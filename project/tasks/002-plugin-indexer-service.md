# Task 002: Plugin Indexer Service

## Objective
Build a Cloudflare Worker that crawls Git repositories, parses `marketplace.json` files, and indexes plugins into the D1 database.

## Context
Claude Code plugins are distributed via Git repos with `.claude-plugin/marketplace.json`. This service discovers and indexes them automatically.

## Architecture

```
GitHub Repo → Indexer Worker → Parse marketplace.json → Store in D1 → Update R2 Cache
```

## marketplace.json Format

```json
{
  "name": "@username/plugin-name",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "username",
  "repository": "https://github.com/username/repo",
  "plugins": [
    {
      "name": "feature-dev",
      "description": "Feature development assistant",
      "skills": ["skills/feature-planning.md"],
      "agents": ["agents/code-reviewer"],
      "commands": ["commands/create-pr"],
      "mcpServers": ["mcp/github-server"]
    }
  ]
}
```

## Implementation

### File Structure
```
workers/indexer/
├── src/
│   ├── index.ts           # Worker entry point
│   ├── crawler.ts         # GitHub API crawler
│   ├── parser.ts          # marketplace.json parser
│   ├── indexer.ts         # Database indexer
│   └── types.ts           # Type definitions
├── wrangler.toml
└── package.json
```

### Core Functions

#### 1. Crawler (`crawler.ts`)
```typescript
interface GitHubRepo {
  owner: string;
  repo: string;
  branch?: string;
}

export async function fetchMarketplaceFile(
  repo: GitHubRepo,
  githubToken: string
): Promise<string | null> {
  const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/.claude-plugin/marketplace.json`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SkillStash-Indexer'
    }
  });
  
  if (!response.ok) return null;
  
  const data = await response.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  
  return content;
}

export async function getRepoMetadata(
  repo: GitHubRepo,
  githubToken: string
): Promise<{stars: number; updated_at: string; default_branch: string}> {
  const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'User-Agent': 'SkillStash-Indexer'
    }
  });
  
  const data = await response.json();
  
  return {
    stars: data.stargazers_count,
    updated_at: data.updated_at,
    default_branch: data.default_branch
  };
}
```

#### 2. Parser (`parser.ts`)
```typescript
import { z } from 'zod';

const MarketplaceSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  author: z.string(),
  repository: z.string().url(),
  plugins: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    skills: z.array(z.string()).optional(),
    agents: z.array(z.string()).optional(),
    commands: z.array(z.string()).optional(),
    mcpServers: z.array(z.string()).optional()
  }))
});

export type MarketplaceData = z.infer<typeof MarketplaceSchema>;

export function parseMarketplaceJson(content: string): MarketplaceData {
  try {
    const json = JSON.parse(content);
    return MarketplaceSchema.parse(json);
  } catch (error) {
    throw new Error(`Invalid marketplace.json: ${error.message}`);
  }
}

export function extractCategory(description: string, name: string): string {
  const keywords = {
    testing: ['test', 'jest', 'vitest', 'cypress', 'qa'],
    devops: ['deploy', 'ci', 'cd', 'docker', 'kubernetes'],
    security: ['security', 'audit', 'scan', 'vulnerability'],
    documentation: ['doc', 'readme', 'documentation'],
    'code-review': ['review', 'pr', 'pull request'],
    ai: ['ai', 'llm', 'gpt', 'claude'],
    database: ['database', 'sql', 'postgres', 'mysql']
  };
  
  const text = `${description} ${name}`.toLowerCase();
  
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => text.includes(word))) {
      return category;
    }
  }
  
  return 'general';
}
```

#### 3. Indexer (`indexer.ts`)
```typescript
import { D1Database } from '@cloudflare/workers-types';
import { MarketplaceData } from './parser';

export async function indexPlugin(
  db: D1Database,
  marketplace: MarketplaceData,
  repoUrl: string,
  metadata: {stars: number; updated_at: string}
): Promise<string> {
  const pluginId = crypto.randomUUID();
  const slug = marketplace.name.replace('@', '').replace('/', '-');
  const category = extractCategory(
    marketplace.description || '',
    marketplace.name
  );
  
  // Insert or update plugin
  await db.prepare(`
    INSERT INTO plugins (
      id, name, slug, description, author_id, author_type,
      repo_url, marketplace_url, category, version, stars,
      updated_at, last_indexed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(name) DO UPDATE SET
      description = excluded.description,
      version = excluded.version,
      stars = excluded.stars,
      updated_at = excluded.updated_at,
      last_indexed_at = CURRENT_TIMESTAMP
  `).bind(
    pluginId,
    marketplace.name,
    slug,
    marketplace.description,
    marketplace.author,
    'user', // TODO: detect org vs user
    repoUrl,
    `${repoUrl}/blob/main/.claude-plugin/marketplace.json`,
    category,
    marketplace.version,
    metadata.stars,
    metadata.updated_at
  ).run();
  
  // Index components (skills, agents, commands, etc.)
  for (const plugin of marketplace.plugins) {
    await indexSkills(db, pluginId, plugin.skills || []);
    await indexAgents(db, pluginId, plugin.agents || []);
    await indexCommands(db, pluginId, plugin.commands || []);
    await indexMCPServers(db, pluginId, plugin.mcpServers || []);
  }
  
  return pluginId;
}

async function indexSkills(
  db: D1Database,
  pluginId: string,
  skills: string[]
): Promise<void> {
  // Delete existing skills for this plugin
  await db.prepare('DELETE FROM skills WHERE plugin_id = ?')
    .bind(pluginId)
    .run();
  
  // Insert new skills
  for (const skillPath of skills) {
    const skillId = crypto.randomUUID();
    const name = skillPath.split('/').pop()?.replace('.md', '') || skillPath;
    
    await db.prepare(`
      INSERT INTO skills (id, plugin_id, name, path, auto_load)
      VALUES (?, ?, ?, ?, TRUE)
    `).bind(skillId, pluginId, name, skillPath).run();
  }
}

// Similar functions for agents, commands, mcp_servers...
```

#### 4. Worker Entry Point (`index.ts`)
```typescript
import { Env } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/index' && request.method === 'POST') {
      return handleIndexRequest(request, env);
    }
    
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handleGitHubWebhook(request, env);
    }
    
    return new Response('SkillStash Indexer', { status: 200 });
  },
  
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    // Cron job: re-index all known repos every 6 hours
    await reindexAllPlugins(env);
  }
};

async function handleIndexRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const { repo_url } = await request.json();
  
  try {
    // Extract owner/repo from URL
    const match = repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    
    const [, owner, repo] = match;
    
    // Fetch and parse marketplace.json
    const content = await fetchMarketplaceFile(
      { owner, repo },
      env.GITHUB_TOKEN
    );
    
    if (!content) {
      return new Response('No marketplace.json found', { status: 404 });
    }
    
    const marketplace = parseMarketplaceJson(content);
    const metadata = await getRepoMetadata({ owner, repo }, env.GITHUB_TOKEN);
    
    // Index in D1
    const pluginId = await indexPlugin(
      env.DB,
      marketplace,
      repo_url,
      metadata
    );
    
    return Response.json({
      success: true,
      plugin_id: pluginId,
      indexed_at: new Date().toISOString()
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}
```

### Configuration (`wrangler.toml`)
```toml
name = "skillstash-indexer"
main = "src/index.ts"
compatibility_date = "2024-10-18"

[[d1_databases]]
binding = "DB"
database_name = "skillstash-registry"
database_id = "your-database-id"

[vars]
ENVIRONMENT = "production"

# Secrets (set via wrangler secret put)
# GITHUB_TOKEN

# Cron trigger: re-index every 6 hours
[triggers]
crons = ["0 */6 * * *"]
```

## API Endpoints

### POST /index
Index a single repository.

**Request:**
```json
{
  "repo_url": "https://github.com/username/repo"
}
```

**Response:**
```json
{
  "success": true,
  "plugin_id": "uuid",
  "indexed_at": "2025-10-18T12:00:00Z"
}
```

### POST /webhook
GitHub webhook handler for automatic re-indexing on push.

**Webhook Setup:**
1. Add webhook to GitHub repo
2. Set payload URL to `https://indexer.skillstash.com/webhook`
3. Select "Push" events
4. Verify signature using `WEBHOOK_SECRET`

## Deliverables

1. `workers/indexer/src/` - Complete worker implementation
2. `wrangler.toml` - Worker configuration
3. `package.json` - Dependencies (zod, @cloudflare/workers-types)
4. GitHub webhook integration
5. Cron job for periodic re-indexing

## Success Criteria

- [ ] Can fetch and parse marketplace.json from GitHub
- [ ] Validates JSON schema correctly
- [ ] Inserts/updates plugins in D1
- [ ] Indexes all components (skills, agents, commands)
- [ ] Handles errors gracefully
- [ ] GitHub webhook triggers re-indexing
- [ ] Cron job runs successfully

## Testing

```bash
# Test locally
wrangler dev

# Test indexing
curl -X POST http://localhost:8787/index \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/anthropics/skills"}'

# Deploy
wrangler deploy
```