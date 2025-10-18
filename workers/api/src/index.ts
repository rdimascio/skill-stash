import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDbClient } from '@skillstash/db';

type Bindings = {
  DB: D1Database;
  CACHE: R2Bucket;
  ENVIRONMENT?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for all routes
app.use('*', cors());

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development'
  });
});

// Get all plugins
app.get('/plugins', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const plugins = await db.query.plugins.findMany({
      limit: 50,
      orderBy: (plugins, { desc }) => [desc(plugins.stars)]
    });

    return c.json({
      success: true,
      data: plugins,
      total: plugins.length
    });
  } catch (error) {
    console.error('Error fetching plugins:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch plugins'
      },
      500
    );
  }
});

// Get single plugin by ID
app.get('/plugins/:id', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const pluginId = c.req.param('id');

    const plugin = await db.query.plugins.findFirst({
      where: (plugins, { eq }) => eq(plugins.id, pluginId)
    });

    if (!plugin) {
      return c.json(
        {
          success: false,
          error: 'Plugin not found'
        },
        404
      );
    }

    return c.json({
      success: true,
      data: plugin
    });
  } catch (error) {
    console.error('Error fetching plugin:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch plugin'
      },
      500
    );
  }
});

// Search plugins
app.get('/search', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const query = c.req.query('q');

    if (!query) {
      return c.json(
        {
          success: false,
          error: 'Search query is required'
        },
        400
      );
    }

    // Simple search implementation
    // TODO: Implement full-text search with better relevance ranking
    const plugins = await db.query.plugins.findMany({
      where: (plugins, { or, like }) =>
        or(
          like(plugins.name, `%${query}%`),
          like(plugins.description, `%${query}%`)
        ),
      limit: 20
    });

    return c.json({
      success: true,
      data: plugins,
      total: plugins.length,
      query
    });
  } catch (error) {
    console.error('Error searching plugins:', error);
    return c.json(
      {
        success: false,
        error: 'Search failed'
      },
      500
    );
  }
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not found'
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      success: false,
      error: 'Internal server error'
    },
    500
  );
});

export default app;
