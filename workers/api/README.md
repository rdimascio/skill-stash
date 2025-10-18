# SkillStash Registry API

REST API for the SkillStash plugin registry, powered by Cloudflare Workers, D1, and Hono.

## Base URL

- **Production**: `https://api.skillstash.com`
- **Development**: `http://localhost:8787`

## Response Format

All API responses follow a consistent structure:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [ ... ] // Optional validation details
}
```

## Endpoints

### Health Check

#### `GET /health`

Check API health and status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

---

## Plugin Endpoints

### List Plugins

#### `GET /api/plugins`

Get a paginated list of all plugins.

**Query Parameters:**
- `limit` (number, optional): Results per page (1-100, default: 20)
- `offset` (number, optional): Offset for pagination (default: 0)
- `sort` (string, optional): Sort field (`stars`, `downloads`, `created`, `updated`, default: `stars`)
- `order` (string, optional): Sort order (`asc`, `desc`, default: `desc`)

**Example:**
```bash
GET /api/plugins?limit=10&sort=downloads&order=desc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "plugin-123",
      "name": "git-workflow",
      "description": "Automates git branching and PR workflows",
      "author": "rdimascio",
      "repoUrl": "https://github.com/user/plugin",
      "stars": 150,
      "downloads": 2500,
      "tags": ["git", "workflow"],
      "createdAt": "2025-01-10T10:00:00.000Z",
      "updatedAt": "2025-01-15T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### Featured Plugins

#### `GET /api/plugins/featured`

Get featured plugins (top-rated plugins).

**Query Parameters:**
- `limit` (number, optional): Number of results (1-50, default: 10)

**Example:**
```bash
GET /api/plugins/featured?limit=5
```

---

### Trending Plugins

#### `GET /api/plugins/trending`

Get trending plugins (most recent downloads).

**Query Parameters:**
- `limit` (number, optional): Number of results (1-50, default: 10)

**Example:**
```bash
GET /api/plugins/trending?limit=5
```

---

### Search Plugins

#### `GET /api/plugins/search`

Search for plugins by name, description, author, or tags.

**Query Parameters:**
- `q` (string, optional): Search query (matches name, description)
- `author` (string, optional): Filter by author
- `sort` (string, optional): Sort field (`stars`, `downloads`, `created`, `updated`, default: `stars`)
- `order` (string, optional): Sort order (`asc`, `desc`, default: `desc`)
- `limit` (number, optional): Results per page (1-100, default: 20)
- `offset` (number, optional): Offset for pagination (default: 0)

**Example:**
```bash
GET /api/plugins/search?q=git&author=rdimascio&sort=stars
```

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... }
}
```

---

### Get Plugin by ID

#### `GET /api/plugins/:id`

Get detailed information about a specific plugin, including skills, agents, and commands.

**Path Parameters:**
- `id` (string): Plugin ID

**Example:**
```bash
GET /api/plugins/plugin-123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "plugin-123",
    "name": "git-workflow",
    "description": "...",
    "author": "rdimascio",
    "repoUrl": "https://github.com/user/plugin",
    "stars": 150,
    "downloads": 2500,
    "tags": ["git", "workflow"],
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z",
    "versions": [
      {
        "id": "v-1",
        "pluginId": "plugin-123",
        "version": "1.2.0",
        "changelog": "Bug fixes and improvements",
        "publishedAt": "2025-01-15T12:00:00.000Z"
      }
    ],
    "skills": [ ... ],
    "agents": [ ... ],
    "commands": [ ... ]
  }
}
```

---

### Get Plugin Versions

#### `GET /api/plugins/:id/versions`

Get version history for a plugin.

**Path Parameters:**
- `id` (string): Plugin ID

**Example:**
```bash
GET /api/plugins/plugin-123/versions
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "v-1",
      "pluginId": "plugin-123",
      "version": "1.2.0",
      "changelog": "Bug fixes and improvements",
      "publishedAt": "2025-01-15T12:00:00.000Z"
    }
  ]
}
```

---

### Get Plugin Stats

#### `GET /api/plugins/:id/stats`

Get download and star statistics for a plugin.

**Path Parameters:**
- `id` (string): Plugin ID

**Example:**
```bash
GET /api/plugins/plugin-123/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pluginId": "plugin-123",
    "name": "git-workflow",
    "downloads": 2500,
    "stars": 150
  }
}
```

---

### Record Plugin Download

#### `POST /api/plugins/:id/download`

Record a download event for a plugin.

**Path Parameters:**
- `id` (string): Plugin ID

**Example:**
```bash
POST /api/plugins/plugin-123/download
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

---

### Get Plugin README

#### `GET /api/plugins/:id/readme`

Get the cached README for a plugin from R2 storage.

**Path Parameters:**
- `id` (string): Plugin ID

**Response Headers:**
- `Content-Type: text/markdown`
- `X-Cache: HIT | MISS`

**Example:**
```bash
GET /api/plugins/plugin-123/readme
```

---

## Component Endpoints

### Skills

#### `GET /api/skills`

List all skills across all plugins.

**Query Parameters:**
- `limit` (number, optional): Results per page (1-100, default: 50)
- `offset` (number, optional): Offset for pagination (default: 0)

#### `GET /api/skills/:id`

Get a specific skill by ID.

**Path Parameters:**
- `id` (string): Skill ID

---

### Agents

#### `GET /api/agents`

List all agents across all plugins.

**Query Parameters:**
- `limit` (number, optional): Results per page (1-100, default: 50)
- `offset` (number, optional): Offset for pagination (default: 0)

#### `GET /api/agents/:id`

Get a specific agent by ID.

**Path Parameters:**
- `id` (string): Agent ID

---

### Commands

#### `GET /api/commands`

List all commands across all plugins.

**Query Parameters:**
- `limit` (number, optional): Results per page (1-100, default: 50)
- `offset` (number, optional): Offset for pagination (default: 0)

#### `GET /api/commands/:id`

Get a specific command by ID.

**Path Parameters:**
- `id` (string): Command ID

---

### MCP Servers

#### `GET /api/mcp-servers`

List all MCP servers (TODO: implementation pending).

#### `GET /api/mcp-servers/:id`

Get a specific MCP server by ID (TODO: implementation pending).

---

## Discovery Endpoints

### Tags

#### `GET /api/tags`

Get all tags with usage counts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "tag": "git",
      "count": 15
    },
    {
      "tag": "workflow",
      "count": 12
    }
  ]
}
```

#### `GET /api/tags/:tag/plugins`

Get all plugins with a specific tag.

**Path Parameters:**
- `tag` (string): Tag name

**Query Parameters:**
- `limit` (number, optional): Results per page (1-100, default: 20)
- `offset` (number, optional): Offset for pagination (default: 0)

**Example:**
```bash
GET /api/tags/git/plugins
```

---

### Authors

#### `GET /api/authors`

Get all authors with plugin counts and statistics.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "author": "rdimascio",
      "pluginCount": 5,
      "totalStars": 500,
      "totalDownloads": 10000
    }
  ]
}
```

#### `GET /api/authors/:author`

Get details about a specific author.

**Path Parameters:**
- `author` (string): Author name

**Response:**
```json
{
  "success": true,
  "data": {
    "author": "rdimascio",
    "pluginCount": 5,
    "totalStars": 500,
    "totalDownloads": 10000
  }
}
```

#### `GET /api/authors/:author/plugins`

Get all plugins by a specific author.

**Path Parameters:**
- `author` (string): Author name

**Query Parameters:**
- `limit` (number, optional): Results per page (1-100, default: 20)
- `offset` (number, optional): Offset for pagination (default: 0)

**Example:**
```bash
GET /api/authors/rdimascio/plugins
```

---

## Statistics

### Registry Stats

#### `GET /api/stats`

Get overall registry statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "plugins": 42,
    "skills": 120,
    "agents": 35,
    "commands": 85,
    "totalStars": 5000,
    "totalDownloads": 50000
  }
}
```

---

## Error Codes

The API uses standard HTTP status codes:

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters or body
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

---

## Rate Limiting

Rate limiting is enforced per IP address:
- **Limit**: 100 requests per minute
- **Headers**: Rate limit information included in response headers (TODO: implementation pending)

---

## CORS

The API supports CORS with the following configuration:
- **Allowed Origins**: `https://skillstash.com`, `localhost:3000` (development)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Credentials**: Supported

---

## Development

### Run Locally

```bash
# Install dependencies
pnpm install

# Run in dev mode
pnpm --filter @skillstash/api dev

# The API will be available at http://localhost:8787
```

### Test Endpoints

```bash
# Health check
curl http://localhost:8787/health

# List plugins
curl http://localhost:8787/api/plugins

# Search plugins
curl "http://localhost:8787/api/plugins/search?q=git"

# Get plugin details
curl http://localhost:8787/api/plugins/plugin-123
```

### Type Checking

```bash
pnpm --filter @skillstash/api typecheck
```

### Build

```bash
pnpm --filter @skillstash/api build
```

### Deploy

```bash
pnpm --filter @skillstash/api deploy
```

---

## Architecture

### Technology Stack
- **Framework**: Hono (lightweight web framework)
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Cache**: Cloudflare R2 (object storage)
- **Runtime**: Cloudflare Workers

### Performance
- **Response Time**: < 100ms for most endpoints
- **Cache Strategy**: R2 for README files (24-hour TTL)
- **Database Indexing**: Optimized for common queries

### Security
- **CORS**: Configured for allowed origins
- **Headers**: Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- **Validation**: Request validation with Zod schemas
- **Error Handling**: Safe error messages (no internal details exposed)

---

## Future Enhancements

- [ ] Rate limiting with KV store
- [ ] Authentication with API keys
- [ ] Webhook support for plugin updates
- [ ] Advanced search with full-text indexing
- [ ] Analytics and usage tracking
- [ ] Plugin verification badges
- [ ] Download statistics by date
- [ ] MCP servers implementation

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/rdimascio/skill-stash/issues
- Documentation: https://skillstash.com/docs
