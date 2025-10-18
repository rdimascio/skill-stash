/**
 * SkillStash Indexer Worker
 * Discovers and indexes Claude Code plugins from GitHub
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDbClient } from '@skillstash/db';
import { GitHubClient, withRetry } from './lib/github';
import { PluginParser } from './lib/parser';
import { DatabaseUpdater } from './lib/updater';
import { CacheManager } from './lib/cache';
import { validatePlugin, validateMarketplaceJson } from './lib/validation';

type Bindings = {
  DB: D1Database;
  CACHE: R2Bucket;
  GITHUB_TOKEN: string;
  ENVIRONMENT?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use('*', cors());

/**
 * Manual trigger endpoint for indexing
 */
app.get('/index', async (c) => {
  try {
    console.log('Starting manual indexing...');

    const result = await runIndexing(c.env);

    return c.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Indexing failed:', error);

    return c.json(
      {
        success: false,
        error: 'Indexing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * Index a specific repository
 */
app.post('/index/:owner/:repo', async (c) => {
  try {
    const owner = c.req.param('owner');
    const repo = c.req.param('repo');
    const fullName = `${owner}/${repo}`;

    console.log(`Indexing specific repo: ${fullName}`);

    const githubClient = new GitHubClient(c.env.GITHUB_TOKEN);
    const parser = new PluginParser();
    const db = createDbClient(c.env.DB);
    const updater = new DatabaseUpdater(db);

    // Get repository info
    const repoInfo = await githubClient.getRepository(fullName);

    // Get marketplace.json first for early validation
    const marketplaceJson = await githubClient.getMarketplaceJson(fullName);

    if (!marketplaceJson) {
      return c.json(
        {
          success: false,
          error: 'No marketplace.json found',
          message: 'Repository must contain .claude-plugin/marketplace.json',
        },
        400
      );
    }

    // Validate marketplace.json structure
    const marketplaceValidation = validateMarketplaceJson(marketplaceJson);
    if (!marketplaceValidation.success) {
      return c.json(
        {
          success: false,
          error: 'Invalid marketplace.json',
          errors: marketplaceValidation.errors,
        },
        400
      );
    }

    // Parse plugin
    const parsed = await parser.parsePlugin(repoInfo, githubClient);

    if (!parsed) {
      return c.json(
        {
          success: false,
          error: 'Failed to parse plugin',
        },
        400
      );
    }

    // Validate parsed plugin data
    const validation = validatePlugin(parsed);
    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
        },
        400
      );
    }

    // Update database
    const pluginId = await updater.upsertPlugin(parsed);

    return c.json({
      success: true,
      pluginId,
      message: `Successfully indexed ${fullName}`,
    });
  } catch (error) {
    console.error('Failed to index repository:', error);

    return c.json(
      {
        success: false,
        error: 'Failed to index repository',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * Get indexer statistics
 */
app.get('/stats', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const updater = new DatabaseUpdater(db);
    const stats = await updater.getPluginStats();

    return c.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Failed to get stats:', error);

    return c.json(
      {
        success: false,
        error: 'Failed to get stats',
      },
      500
    );
  }
});

/**
 * Check GitHub API rate limit
 */
app.get('/rate-limit', async (c) => {
  try {
    const githubClient = new GitHubClient(c.env.GITHUB_TOKEN);
    const rateLimit = await githubClient.getRateLimit();

    return c.json({
      success: true,
      rateLimit,
    });
  } catch (error) {
    console.error('Failed to get rate limit:', error);

    return c.json(
      {
        success: false,
        error: 'Failed to get rate limit',
      },
      500
    );
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'skillstash-indexer',
    environment: c.env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Core indexing logic
 */
async function runIndexing(env: Bindings): Promise<{
  indexed: number;
  failed: number;
  skipped: number;
  total: number;
}> {
  const githubClient = new GitHubClient(env.GITHUB_TOKEN);
  const parser = new PluginParser();
  const db = createDbClient(env.DB);
  const updater = new DatabaseUpdater(db);
  const cache = new CacheManager(env.CACHE);

  let indexed = 0;
  let failed = 0;
  let skipped = 0;

  // Search for Claude Code repositories
  console.log('Searching for Claude Code repositories...');

  const repos = await withRetry(() => githubClient.searchClaudeCodeRepos(1, 100));

  console.log(`Found ${repos.length} repositories`);

  for (const repo of repos) {
    try {
      console.log(`Processing: ${repo.full_name}`);

      // Check if we need to re-index (skip if recently indexed)
      const cacheKey = CacheManager.repoKey(repo.owner.login, repo.name);
      const cached = await cache.has(cacheKey);

      if (cached) {
        const lastIndexed = await updater.getLastIndexed(repo.html_url);
        if (lastIndexed) {
          const lastIndexedTime = new Date(lastIndexed).getTime();
          const now = Date.now();
          const hoursSinceIndexed = (now - lastIndexedTime) / (1000 * 60 * 60);

          // Skip if indexed less than 6 hours ago
          if (hoursSinceIndexed < 6) {
            console.log(`Skipping ${repo.full_name} (indexed ${hoursSinceIndexed.toFixed(1)}h ago)`);
            skipped++;
            continue;
          }
        }
      }

      // Get marketplace.json first for early validation
      const marketplaceJson = await githubClient.getMarketplaceJson(repo.full_name);

      if (!marketplaceJson) {
        console.log(`Skipping ${repo.full_name} - no marketplace.json found`);
        skipped++;
        continue;
      }

      // Validate marketplace.json structure
      const marketplaceValidation = validateMarketplaceJson(marketplaceJson);
      if (!marketplaceValidation.success) {
        console.error(`Invalid marketplace.json in ${repo.full_name}:`, marketplaceValidation.errors);
        failed++;
        continue;
      }

      // Parse plugin from validated marketplace.json
      const parsed = await parser.parsePlugin(repo, githubClient);

      if (!parsed) {
        console.log(`Failed to parse ${repo.full_name}`);
        failed++;
        continue;
      }

      // Validate parsed plugin data
      const validation = validatePlugin(parsed);
      if (!validation.success) {
        console.error(`Validation failed for ${repo.full_name}:`, validation.errors);
        failed++;
        continue;
      }

      // Update database
      await updater.upsertPlugin(parsed);

      // Cache successful indexing
      await cache.set(cacheKey, { indexed: true }, { ttl: 6 * 60 * 60 });

      indexed++;
      console.log(`Successfully indexed: ${repo.full_name}`);
    } catch (error) {
      console.error(`Failed to process ${repo.full_name}:`, error);
      failed++;
    }
  }

  console.log(`Indexing complete: ${indexed} indexed, ${failed} failed, ${skipped} skipped`);

  return {
    indexed,
    failed,
    skipped,
    total: repos.length,
  };
}

/**
 * Worker export type
 */
interface WorkerExport {
  fetch: typeof app.fetch;
  scheduled: (event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) => Promise<void>;
}

/**
 * Scheduled cron handler
 */
const worker: WorkerExport = {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Bindings, _ctx: ExecutionContext): Promise<void> {
    console.log('Starting scheduled indexing...');
    console.log('Cron:', event.cron);

    try {
      const result = await runIndexing(env);

      console.log('Scheduled indexing complete:', result);
    } catch (error) {
      console.error('Scheduled indexing failed:', error);
    }
  },
};

export default worker;
