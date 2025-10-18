import { Hono } from 'hono';
import { createDbClient } from '@skillstash/db';
import { plugins, pluginVersions, skills, agents, commands } from '@skillstash/db';
import { eq, like, or, desc, asc, and, sql, count } from 'drizzle-orm';
import { NotFoundError, BadRequestError } from '../middleware/error-handler';
import { validateQuery, searchSchema } from '../middleware/validation';
import { paginatedResponse, successResponse, calculatePagination } from '../lib/response';
import type { Context } from 'hono';

type Bindings = {
  DB: D1Database;
  CACHE: R2Bucket;
  ENVIRONMENT?: string;
};

const pluginsRouter = new Hono<{ Bindings: Bindings }>();

// GET /api/plugins - List all plugins with pagination
pluginsRouter.get('/', async (c) => {
  const db = createDbClient(c.env.DB);
  const { limit = 20, offset = 0, sort = 'stars', order = 'desc' } = c.req.query();

  const limitNum = Math.min(parseInt(limit as string) || 20, 100);
  const offsetNum = parseInt(offset as string) || 0;

  // Get total count
  const totalResult = await db.select({ count: count() }).from(plugins);
  const total = totalResult[0]?.count || 0;

  // Get plugins with sorting
  const orderColumn = sort === 'downloads' ? plugins.downloads :
                      sort === 'created' ? plugins.createdAt :
                      sort === 'updated' ? plugins.updatedAt :
                      plugins.stars;

  const orderFn = order === 'asc' ? asc : desc;

  const results = await db.query.plugins.findMany({
    limit: limitNum,
    offset: offsetNum,
    orderBy: [orderFn(orderColumn)]
  });

  return paginatedResponse(
    c,
    results,
    calculatePagination(total, limitNum, offsetNum)
  );
});

// GET /api/plugins/featured - Get featured plugins
pluginsRouter.get('/featured', async (c) => {
  const db = createDbClient(c.env.DB);
  const limit = Math.min(parseInt(c.req.query('limit') as string) || 10, 50);

  // For now, featured = top by stars
  // TODO: Add featured flag to database
  const results = await db.query.plugins.findMany({
    limit,
    orderBy: [desc(plugins.stars)]
  });

  return successResponse(c, results);
});

// GET /api/plugins/trending - Get trending plugins
pluginsRouter.get('/trending', async (c) => {
  const db = createDbClient(c.env.DB);
  const limit = Math.min(parseInt(c.req.query('limit') as string) || 10, 50);

  // For now, trending = recent downloads
  // TODO: Calculate trending based on recent download stats
  const results = await db.query.plugins.findMany({
    limit,
    orderBy: [desc(plugins.downloads), desc(plugins.stars)]
  });

  return successResponse(c, results);
});

// GET /api/plugins/search - Search plugins
pluginsRouter.get('/search', validateQuery(searchSchema), async (c) => {
  const db = createDbClient(c.env.DB);
  const query = c.get('validatedQuery') as any;

  const {
    q,
    tag,
    tags: tagsArray,
    author,
    sort = 'stars',
    order = 'desc',
    limit = 20,
    offset = 0
  } = query;

  const limitNum = Math.min(limit, 100);
  const offsetNum = offset;

  // Build where conditions
  const conditions: any[] = [];

  if (q) {
    conditions.push(
      or(
        like(plugins.name, `%${q}%`),
        like(plugins.description, `%${q}%`)
      )
    );
  }

  if (author) {
    conditions.push(eq(plugins.author, author));
  }

  // TODO: Implement tag filtering when we have proper tag relations
  // For now, tags are stored as JSON array in plugins table

  // Get total count
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalResult = await db
    .select({ count: count() })
    .from(plugins)
    .where(whereClause);

  const total = totalResult[0]?.count || 0;

  // Get results with sorting
  const orderColumn = sort === 'downloads' ? plugins.downloads :
                      sort === 'created' ? plugins.createdAt :
                      sort === 'updated' ? plugins.updatedAt :
                      plugins.stars;

  const orderFn = order === 'asc' ? asc : desc;

  let queryBuilder = db
    .select()
    .from(plugins)
    .limit(limitNum)
    .offset(offsetNum)
    .orderBy(orderFn(orderColumn));

  if (whereClause) {
    queryBuilder = queryBuilder.where(whereClause) as any;
  }

  const results = await queryBuilder;

  return paginatedResponse(
    c,
    results,
    calculatePagination(total, limitNum, offsetNum)
  );
});

// GET /api/plugins/:id - Get single plugin with related data
pluginsRouter.get('/:id', async (c) => {
  const db = createDbClient(c.env.DB);
  const pluginId = c.req.param('id');

  const plugin = await db.query.plugins.findFirst({
    where: eq(plugins.id, pluginId),
    with: {
      versions: {
        orderBy: [desc(pluginVersions.publishedAt)],
        limit: 10
      }
    }
  });

  if (!plugin) {
    throw new NotFoundError('Plugin not found');
  }

  // Get related components
  const [skillsList, agentsList, commandsList] = await Promise.all([
    db.query.skills.findMany({
      where: eq(skills.pluginId, pluginId)
    }),
    db.query.agents.findMany({
      where: eq(agents.pluginId, pluginId)
    }),
    db.query.commands.findMany({
      where: eq(commands.pluginId, pluginId)
    })
  ]);

  return successResponse(c, {
    ...plugin,
    skills: skillsList,
    agents: agentsList,
    commands: commandsList
  });
});

// GET /api/plugins/:id/versions - Get plugin version history
pluginsRouter.get('/:id/versions', async (c) => {
  const db = createDbClient(c.env.DB);
  const pluginId = c.req.param('id');

  // Verify plugin exists
  const plugin = await db.query.plugins.findFirst({
    where: eq(plugins.id, pluginId)
  });

  if (!plugin) {
    throw new NotFoundError('Plugin not found');
  }

  const versions = await db.query.pluginVersions.findMany({
    where: eq(pluginVersions.pluginId, pluginId),
    orderBy: [desc(pluginVersions.publishedAt)]
  });

  return successResponse(c, versions);
});

// GET /api/plugins/:id/stats - Get plugin stats
pluginsRouter.get('/:id/stats', async (c) => {
  const db = createDbClient(c.env.DB);
  const pluginId = c.req.param('id');

  const plugin = await db.query.plugins.findFirst({
    where: eq(plugins.id, pluginId),
    columns: {
      id: true,
      name: true,
      downloads: true,
      stars: true
    }
  });

  if (!plugin) {
    throw new NotFoundError('Plugin not found');
  }

  // TODO: Add download stats by date from downloadStats table
  return successResponse(c, {
    pluginId: plugin.id,
    name: plugin.name,
    downloads: plugin.downloads,
    stars: plugin.stars
  });
});

// POST /api/plugins/:id/download - Record download event
pluginsRouter.post('/:id/download', async (c) => {
  const db = createDbClient(c.env.DB);
  const pluginId = c.req.param('id');

  const plugin = await db.query.plugins.findFirst({
    where: eq(plugins.id, pluginId)
  });

  if (!plugin) {
    throw new NotFoundError('Plugin not found');
  }

  // Increment download counter
  await db
    .update(plugins)
    .set({
      downloads: sql`${plugins.downloads} + 1`,
      updatedAt: new Date().toISOString()
    })
    .where(eq(plugins.id, pluginId));

  // TODO: Record in downloadStats table for analytics

  return successResponse(c, { success: true }, 201);
});

// GET /api/plugins/:id/readme - Get cached README from R2
pluginsRouter.get('/:id/readme', async (c) => {
  const pluginId = c.req.param('id');
  const cacheKey = `readme:${pluginId}`;

  try {
    // Try R2 cache first
    const cached = await c.env.CACHE.get(cacheKey);

    if (cached) {
      const content = await cached.text();
      c.header('Content-Type', 'text/markdown');
      c.header('X-Cache', 'HIT');
      return c.text(content);
    }

    // Cache miss - would fetch from GitHub in production
    // For now, return 404
    c.header('X-Cache', 'MISS');
    throw new NotFoundError('README not found in cache');

  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }
    throw new Error('Failed to fetch README');
  }
});

export default pluginsRouter;
