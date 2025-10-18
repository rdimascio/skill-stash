import { Hono } from 'hono';
import { createDbClient } from '@skillstash/db';
import { plugins, skills, agents, commands } from '@skillstash/db';
import { sql, count } from 'drizzle-orm';
import { successResponse } from '../lib/response';

type Bindings = {
  DB: D1Database;
  CACHE: R2Bucket;
  ENVIRONMENT?: string;
};

const statsRouter = new Hono<{ Bindings: Bindings }>();

// GET /api/stats - Get registry statistics
statsRouter.get('/', async (c) => {
  const db = createDbClient(c.env.DB);

  // Get counts in parallel
  const [
    pluginCount,
    skillCount,
    agentCount,
    commandCount,
    totalStars,
    totalDownloads
  ] = await Promise.all([
    db.select({ count: count() }).from(plugins),
    db.select({ count: count() }).from(skills),
    db.select({ count: count() }).from(agents),
    db.select({ count: count() }).from(commands),
    db.select({ total: sql<number>`SUM(${plugins.stars})` }).from(plugins),
    db.select({ total: sql<number>`SUM(${plugins.downloads})` }).from(plugins)
  ]);

  const stats = {
    plugins: pluginCount[0]?.count || 0,
    skills: skillCount[0]?.count || 0,
    agents: agentCount[0]?.count || 0,
    commands: commandCount[0]?.count || 0,
    totalStars: totalStars[0]?.total || 0,
    totalDownloads: totalDownloads[0]?.total || 0
  };

  return successResponse(c, stats);
});

export default statsRouter;
