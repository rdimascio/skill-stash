import { Hono } from 'hono';
import { createDbClient } from '@skillstash/db';
import { plugins } from '@skillstash/db';
import { eq, desc, count, sql } from 'drizzle-orm';
import { NotFoundError } from '../middleware/error-handler';
import {
  successResponse,
  paginatedResponse,
  calculatePagination,
} from '../lib/response';
import type { worker as Worker } from '../../alchemy.run';

const discoveryRouter = new Hono<{ Bindings: typeof Worker.Env }>();

// GET /api/tags - List all tags with counts
discoveryRouter.get('/tags', async (c) => {
  const db = createDbClient(c.env.DB);

  // Get all plugins with tags
  const allPlugins = await db.query.plugins.findMany({
    columns: {
      tags: true,
    },
  });

  // Count tag occurrences
  const tagCounts = new Map<string, number>();

  allPlugins.forEach((plugin) => {
    if (plugin.tags && Array.isArray(plugin.tags)) {
      plugin.tags.forEach((tag) => {
        if (typeof tag === 'string') {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      });
    }
  });

  // Convert to array and sort by count
  const tags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return successResponse(c, tags);
});

// GET /api/tags/:tag/plugins - Get plugins by tag
discoveryRouter.get('/tags/:tag/plugins', async (c) => {
  const db = createDbClient(c.env.DB);
  const tag = c.req.param('tag');
  const { limit = 20, offset = 0 } = c.req.query();

  const limitNum = Math.min(parseInt(limit as string) || 20, 100);
  const offsetNum = parseInt(offset as string) || 0;

  // SQLite doesn't have native JSON array search, so we need to do filtering in app
  const allPlugins = await db.query.plugins.findMany({
    orderBy: [desc(plugins.stars)],
  });

  // Filter by tag
  const filtered = allPlugins.filter((plugin) => {
    if (plugin.tags && Array.isArray(plugin.tags)) {
      return plugin.tags.includes(tag);
    }
    return false;
  });

  // Apply pagination
  const total = filtered.length;
  const results = filtered.slice(offsetNum, offsetNum + limitNum);

  return paginatedResponse(
    c,
    results,
    calculatePagination(total, limitNum, offsetNum)
  );
});

// GET /api/authors - List all authors with plugin counts
discoveryRouter.get('/authors', async (c) => {
  const db = createDbClient(c.env.DB);

  // Get all unique authors with counts
  const authors = await db
    .select({
      author: plugins.author,
      pluginCount: count(plugins.id),
      totalStars: sql<number>`SUM(${plugins.stars})`,
      totalDownloads: sql<number>`SUM(${plugins.downloads})`,
    })
    .from(plugins)
    .groupBy(plugins.author)
    .orderBy(desc(sql`COUNT(${plugins.id})`));

  return successResponse(c, authors);
});

// GET /api/authors/:author - Get author details
discoveryRouter.get('/authors/:author', async (c) => {
  const db = createDbClient(c.env.DB);
  const author = c.req.param('author');

  // Get author stats
  const stats = await db
    .select({
      author: plugins.author,
      pluginCount: count(plugins.id),
      totalStars: sql<number>`SUM(${plugins.stars})`,
      totalDownloads: sql<number>`SUM(${plugins.downloads})`,
    })
    .from(plugins)
    .where(eq(plugins.author, author))
    .groupBy(plugins.author);

  if (!stats || stats.length === 0) {
    throw new NotFoundError('Author not found');
  }

  return successResponse(c, stats[0]);
});

// GET /api/authors/:author/plugins - Get author's plugins
discoveryRouter.get('/authors/:author/plugins', async (c) => {
  const db = createDbClient(c.env.DB);
  const author = c.req.param('author');
  const { limit = 20, offset = 0 } = c.req.query();

  const limitNum = Math.min(parseInt(limit as string) || 20, 100);
  const offsetNum = parseInt(offset as string) || 0;

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(plugins)
    .where(eq(plugins.author, author));

  const total = totalResult[0]?.count || 0;

  if (total === 0) {
    throw new NotFoundError('Author not found');
  }

  // Get plugins
  const results = await db.query.plugins.findMany({
    where: eq(plugins.author, author),
    limit: limitNum,
    offset: offsetNum,
    orderBy: [desc(plugins.stars)],
  });

  return paginatedResponse(
    c,
    results,
    calculatePagination(total, limitNum, offsetNum)
  );
});

export default discoveryRouter;
