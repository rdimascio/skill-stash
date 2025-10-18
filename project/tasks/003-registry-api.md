# Task 003: Registry API (Cloudflare Worker)

## Objective
Build a REST API on Cloudflare Workers that serves plugin data to the CLI and web interface.

## Context
This API provides fast, edge-deployed access to the plugin registry. It queries D1 and caches responses in R2 for performance.

## Architecture
```
CLI/Web → Cloudflare Worker → D1 Database → R2 Cache
```

## Endpoints

### GET /api/plugins
List all plugins with pagination and filtering.

**Query Params:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `category` (filter by category)
- `sort` (downloads, stars, updated, created)
- `search` (full-text search)

**Response:**
```json
{
  "plugins": [
    {
      "id": "uuid",
      "name": "@username/plugin-name",
      "slug": "username-plugin-name",
      "description": "Plugin description",
      "category": "testing",
      "version": "1.0.0",
      "downloads": 1234,
      "stars": 56,
      "verified": true,
      "author": {
        "username": "username",
        "avatar_url": "https://..."
      },
      "install_command": "skillstash add username-plugin-name"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### GET /api/plugins/:slug
Get detailed plugin information.

**Response:**
```json
{
  "id": "uuid",
  "name": "@username/plugin-name",
  "slug": "username-plugin-name",
  "description": "Detailed plugin description",
  "category": "testing",
  "tags": ["jest", "testing", "automation"],
  "version": "1.0.0",
  "repo_url": "https://github.com/username/repo",
  "marketplace_url": "https://github.com/username/repo/blob/main/.claude-plugin/marketplace.json",
  "homepage_url": "https://...",
  "downloads": 1234,
  "stars": 56,
  "verified": true,
  "security_audited": false,
  "official": false,
  "skills": [
    {
      "id": "uuid",
      "name": "test-generator",
      "description": "Generates unit tests",
      "path": "skills/test-generator.md"
    }
  ],
  "agents": [...],
  "commands": [...],
  "mcp_servers": [...],
  "author": {
    "username": "username",
    "avatar_url": "https://...",
    "bio": "Developer bio"
  },
  "install_command": "skillstash add username-plugin-name",
  "created_at": "2025-10-01T00:00:00Z",
  "updated_at": "2025-10-15T00:00:00Z"
}
```

### GET /api/search
Search plugins by name, description, or tags.

**Query Params:**
- `q` (search query, required)
- `limit` (default: 10)

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "name": "@username/plugin-name",
      "slug": "username-plugin-name",
      "description": "Match: testing automation...",
      "category": "testing",
      "downloads": 1234,
      "relevance_score": 0.95
    }
  ],
  "query": "testing automation",
  "total": 15
}
```

### GET /api/categories
List all categories with plugin counts.

**Response:**
```json
{
  "categories": [
    {
      "name": "testing",
      "display_name": "Testing",
      "count": 45,
      "icon": "🧪"
    },
    {
      "name": "devops",
      "display_name": "DevOps",
      "count": 32,
      "icon": "🚀"
    }
  ]
}
```

### GET /api/collections
List featured collections.

**Response:**
```json
{
  "collections": [
    {
      "id": "uuid",
      "slug": "devops-essentials",
      "name": "DevOps Essentials",
      "description": "Must-have tools for DevOps",
      "plugin_count": 8,
      "downloads": 2345,
      "author": {...},
      "featured": true
    }
  ]
}
```

### GET /api/collections/:slug
Get collection details with plugins.

**Response:**
```json
{
  "id": "uuid",
  "slug": "devops-essentials",
  "name": "DevOps Essentials",
  "description": "Must-have tools for DevOps workflows",
  "plugins": [...],
  "author": {...},
  "downloads": 2345,
  "install_command": "skillstash add collection/devops-essentials"
}
```

### POST /api/plugins/:slug/download
Track plugin downloads.

**Request:**
```json
{
  "cli_version": "1.0.0",
  "user_id": "uuid" // optional
}
```

**Response:**
```json
{
  "success": true,
  "download_count": 1235
}
```

### POST /api/plugins/:slug/rate
Submit a plugin rating (requires auth).

**Request:**
```json
{
  "rating": 5,
  "review": "Great plugin!"
}
```

## Implementation

### File Structure
```
workers/api/
├── src/
│   ├── index.ts           # Worker entry point & router
│   ├── handlers/
│   │   ├── plugins.ts     # Plugin endpoints
│   │   ├── search.ts      # Search endpoint
│   │   ├── collections.ts # Collection endpoints
│   │   └── stats.ts       # Analytics endpoints
│   ├── lib/
│   │   ├── db.ts          # Database helpers
│   │   ├── cache.ts       # R2 caching layer
│   │   └── auth.ts        # Authentication
│   └── types.ts
├── wrangler.toml
└── package.json
```

### Router (`index.ts`)
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';
import { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors());
app.use('/api/*', cache({
  cacheName: 'skillstash-api',
  cacheControl: 'max-age=300' // 5 minutes
}));

// Routes
app.get('/api/plugins', handleListPlugins);
app.get('/api/plugins/:slug', handleGetPlugin);
app.get('/api/search', handleSearch);
app.get('/api/categories', handleCategories);
app.get('/api/collections', handleListCollections);
app.get('/api/collections/:slug', handleGetCollection);
app.post('/api/plugins/:slug/download', handleTrackDownload);
app.post('/api/plugins/:slug/rate', handleRatePlugin);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
```

### Database Helpers (`lib/db.ts`)
```typescript
import { D1Database } from '@cloudflare/workers-types';

export async function getPlugins(
  db: D1Database,
  options: {
    page?: number;
    limit?: number;
    category?: string;
    sort?: 'downloads' | 'stars' | 'updated' | 'created';
  }
): Promise<{ plugins: any[]; total: number }> {
  const page = options.page || 1;
  const limit = Math.min(options.limit || 20, 100);
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM plugins';
  let countQuery = 'SELECT COUNT(*) as total FROM plugins';
  const params: any[] = [];
  
  if (options.category) {
    query += ' WHERE category = ?';
    countQuery += ' WHERE category = ?';
    params.push(options.category);
  }
  
  const sortMap = {
    downloads: 'downloads DESC',
    stars: 'stars DESC',
    updated: 'updated_at DESC',
    created: 'created_at DESC'
  };
  
  query += ` ORDER BY ${sortMap[options.sort || 'downloads']}`;
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const [pluginsResult, countResult] = await Promise.all([
    db.prepare(query).bind(...params).all(),
    db.prepare(countQuery).bind(...(options.category ? [options.category] : [])).first()
  ]);
  
  return {
    plugins: pluginsResult.results,
    total: countResult.total as number
  };
}

export async function getPluginBySlug(
  db: D1Database,
  slug: string
): Promise<any> {
  const plugin = await db
    .prepare('SELECT * FROM plugins WHERE slug = ?')
    .bind(slug)
    .first();
  
  if (!plugin) return null;
  
  // Get all components
  const [skills, agents, commands, mcpServers] = await Promise.all([
    db.prepare('SELECT * FROM skills WHERE plugin_id = ?').bind(plugin.id).all(),
    db.prepare('SELECT * FROM agents WHERE plugin_id = ?').bind(plugin.id).all(),
    db.prepare('SELECT * FROM commands WHERE plugin_id = ?').bind(plugin.id).all(),
    db.prepare('SELECT * FROM mcp_servers WHERE plugin_id = ?').bind(plugin.id).all()
  ]);
  
  return {
    ...plugin,
    skills: skills.results,
    agents: agents.results,
    commands: commands.results,
    mcp_servers: mcpServers.results
  };
}

export async function searchPlugins(
  db: D1Database,
  query: string,
  limit: number = 10
): Promise<any[]> {
  const searchTerm = `%${query}%`;
  
  const result = await db
    .prepare(`
      SELECT *, 
        CASE 
          WHEN name LIKE ? THEN 3
          WHEN description LIKE ? THEN 2
          ELSE 1
        END as relevance_score
      FROM plugins
      WHERE name LIKE ? OR description LIKE ? OR tags LIKE ?
      ORDER BY relevance_score DESC, downloads DESC
      LIMIT ?
    `)
    .bind(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit)
    .all();
  
  return result.results;
}

export async function trackDownload(
  db: D1Database,
  pluginId: string,
  cliVersion?: string
): Promise<void> {
  await db
    .prepare(`
      INSERT INTO plugin_downloads (id, plugin_id, cli_version, downloaded_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `)
    .bind(crypto.randomUUID(), pluginId, cliVersion || null)
    .run();
  
  // Increment download count
  await db
    .prepare('UPDATE plugins SET downloads = downloads + 1 WHERE id = ?')
    .bind(pluginId)
    .run();
}
```

### Handlers (`handlers/plugins.ts`)
```typescript
import { Context } from 'hono';
import { getPlugins, getPluginBySlug } from '../lib/db';

export async function handleListPlugins(c: Context) {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const category = c.req.query('category');
  const sort = c.req.query('sort') as any;
  
  const { plugins, total } = await getPlugins(c.env.DB, {
    page,
    limit,
    category,
    sort
  });
  
  return c.json({
    plugins: plugins.map(p => ({
      ...p,
      tags: JSON.parse(p.tags || '[]'),
      install_command: `skillstash add ${p.slug}`
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit)
    }
  });
}

export async function handleGetPlugin(c: Context) {
  const slug = c.req.param('slug');
  
  const plugin = await getPluginBySlug(c.env.DB, slug);
  
  if (!plugin) {
    return c.json({ error: 'Plugin not found' }, 404);
  }
  
  return c.json({
    ...plugin,
    tags: JSON.parse(plugin.tags || '[]'),
    install_command: `skillstash add ${plugin.slug}`
  });
}
```

### Caching Layer (`lib/cache.ts`)
```typescript
import { R2Bucket } from '@cloudflare/workers-types';

export async function getCached<T>(
  bucket: R2Bucket,
  key: string
): Promise<T | null> {
  const object = await bucket.get(key);
  if (!object) return null;
  
  const text = await object.text();
  return JSON.parse(text);
}

export async function setCache(
  bucket: R2Bucket,
  key: string,
  value: any,
  ttl: number = 300 // 5 minutes
): Promise<void> {
  await bucket.put(key, JSON.stringify(value), {
    customMetadata: {
      expires: (Date.now() + ttl * 1000).toString()
    }
  });
}

export async function invalidateCache(
  bucket: R2Bucket,
  pattern: string
): Promise<void> {
  const list = await bucket.list({ prefix: pattern });
  
  await Promise.all(
    list.objects.map(obj => bucket.delete(obj.key))
  );
}
```

### Configuration (`wrangler.toml`)
```toml
name = "skillstash-api"
main = "src/index.ts"
compatibility_date = "2024-10-18"

[[d1_databases]]
binding = "DB"
database_name = "skillstash-registry"
database_id = "your-database-id"

[[r2_buckets]]
binding = "CACHE"
bucket_name = "skillstash-cache"

[vars]
ENVIRONMENT = "production"
API_VERSION = "v1"

# Custom domain
routes = [
  { pattern = "api.skillstash.com/*", custom_domain = true }
]
```

## Deliverables

1. Complete API implementation with all endpoints
2. Database query helpers with proper indexes
3. R2 caching layer for performance
4. Error handling and validation
5. CORS configuration
6. Rate limiting (optional)

## Success Criteria

- [ ] All endpoints return correct data
- [ ] Pagination works properly
- [ ] Search returns relevant results
- [ ] Caching reduces DB queries
- [ ] Response times < 100ms (edge locations)
- [ ] Proper error handling
- [ ] CORS configured for web client

## Testing

```bash
# Local development
wrangler dev

# Test endpoints
curl https://localhost:8787/api/plugins
curl https://localhost:8787/api/plugins/username-plugin-name
curl https://localhost:8787/api/search?q=testing

# Deploy
wrangler deploy
```