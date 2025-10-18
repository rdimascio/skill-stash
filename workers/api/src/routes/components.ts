import { Hono } from 'hono';
import { createDbClient } from '@skillstash/db';
import { skills, agents, commands } from '@skillstash/db';
import { eq, desc, count } from 'drizzle-orm';
import { NotFoundError } from '../middleware/error-handler';
import { successResponse, paginatedResponse, calculatePagination } from '../lib/response';

type Bindings = {
  DB: D1Database;
  CACHE: R2Bucket;
  ENVIRONMENT?: string;
};

const componentsRouter = new Hono<{ Bindings: Bindings }>();

// SKILLS ENDPOINTS

// GET /api/skills - List all skills
componentsRouter.get('/skills', async (c) => {
  const db = createDbClient(c.env.DB);
  const { limit = 50, offset = 0 } = c.req.query();

  const limitNum = Math.min(parseInt(limit as string) || 50, 100);
  const offsetNum = parseInt(offset as string) || 0;

  const totalResult = await db.select({ count: count() }).from(skills);
  const total = totalResult[0]?.count || 0;

  const results = await db.query.skills.findMany({
    limit: limitNum,
    offset: offsetNum,
    orderBy: [desc(skills.createdAt)],
    with: {
      plugin: {
        columns: {
          id: true,
          name: true,
          author: true
        }
      }
    }
  });

  return paginatedResponse(
    c,
    results,
    calculatePagination(total, limitNum, offsetNum)
  );
});

// GET /api/skills/:id - Get skill by ID
componentsRouter.get('/skills/:id', async (c) => {
  const db = createDbClient(c.env.DB);
  const skillId = c.req.param('id');

  const skill = await db.query.skills.findFirst({
    where: eq(skills.id, skillId),
    with: {
      plugin: true
    }
  });

  if (!skill) {
    throw new NotFoundError('Skill not found');
  }

  return successResponse(c, skill);
});

// AGENTS ENDPOINTS

// GET /api/agents - List all agents
componentsRouter.get('/agents', async (c) => {
  const db = createDbClient(c.env.DB);
  const { limit = 50, offset = 0 } = c.req.query();

  const limitNum = Math.min(parseInt(limit as string) || 50, 100);
  const offsetNum = parseInt(offset as string) || 0;

  const totalResult = await db.select({ count: count() }).from(agents);
  const total = totalResult[0]?.count || 0;

  const results = await db.query.agents.findMany({
    limit: limitNum,
    offset: offsetNum,
    orderBy: [desc(agents.createdAt)],
    with: {
      plugin: {
        columns: {
          id: true,
          name: true,
          author: true
        }
      }
    }
  });

  return paginatedResponse(
    c,
    results,
    calculatePagination(total, limitNum, offsetNum)
  );
});

// GET /api/agents/:id - Get agent by ID
componentsRouter.get('/agents/:id', async (c) => {
  const db = createDbClient(c.env.DB);
  const agentId = c.req.param('id');

  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, agentId),
    with: {
      plugin: true
    }
  });

  if (!agent) {
    throw new NotFoundError('Agent not found');
  }

  return successResponse(c, agent);
});

// COMMANDS ENDPOINTS

// GET /api/commands - List all commands
componentsRouter.get('/commands', async (c) => {
  const db = createDbClient(c.env.DB);
  const { limit = 50, offset = 0 } = c.req.query();

  const limitNum = Math.min(parseInt(limit as string) || 50, 100);
  const offsetNum = parseInt(offset as string) || 0;

  const totalResult = await db.select({ count: count() }).from(commands);
  const total = totalResult[0]?.count || 0;

  const results = await db.query.commands.findMany({
    limit: limitNum,
    offset: offsetNum,
    orderBy: [desc(commands.createdAt)],
    with: {
      plugin: {
        columns: {
          id: true,
          name: true,
          author: true
        }
      }
    }
  });

  return paginatedResponse(
    c,
    results,
    calculatePagination(total, limitNum, offsetNum)
  );
});

// GET /api/commands/:id - Get command by ID
componentsRouter.get('/commands/:id', async (c) => {
  const db = createDbClient(c.env.DB);
  const commandId = c.req.param('id');

  const command = await db.query.commands.findFirst({
    where: eq(commands.id, commandId),
    with: {
      plugin: true
    }
  });

  if (!command) {
    throw new NotFoundError('Command not found');
  }

  return successResponse(c, command);
});

// MCP SERVERS ENDPOINTS
// Note: MCP servers schema needs to be checked/created

// GET /api/mcp-servers - List all MCP servers
componentsRouter.get('/mcp-servers', async (c) => {
  // TODO: Implement when mcp-servers schema is available
  return successResponse(c, [], 200);
});

// GET /api/mcp-servers/:id - Get MCP server by ID
componentsRouter.get('/mcp-servers/:id', async () => {
  // TODO: Implement when mcp-servers schema is available
  throw new NotFoundError('MCP Server not found');
});

export default componentsRouter;
