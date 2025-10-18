# @skillstash/db

Type-safe database package for SkillStash using Drizzle ORM and Cloudflare D1.

## Overview

This package provides:
- Type-safe Drizzle ORM schemas for all 10 database tables
- Database client factory for Cloudflare D1
- Auto-generated TypeScript types
- Migration management with Drizzle Kit
- Seed data for development

## Installation

This package is part of the SkillStash monorepo and uses pnpm workspaces.

```bash
pnpm install
```

## Database Schema

The package defines 10 tables:

1. **plugins** - Main plugin registry
2. **plugin_versions** - Version history with semver
3. **plugin_tags** - Searchable tags
4. **plugin_dependencies** - Inter-plugin dependencies
5. **skills** - Skill definitions
6. **agents** - Agent definitions
7. **commands** - Slash command definitions
8. **mcp_servers** - MCP server integrations
9. **authors** - Author profiles
10. **download_stats** - Analytics data

## Usage

### Creating a Database Client

```typescript
import { createDbClient } from '@skillstash/db';

// In a Cloudflare Worker
export default {
  async fetch(request: Request, env: Env) {
    const db = createDbClient(env.DB);

    // Use the database
    const plugins = await db.query.plugins.findMany();

    return Response.json(plugins);
  }
};
```

### Using Types

```typescript
import type { Plugin, NewPlugin, Skill, Agent } from '@skillstash/db';

// Type for selecting from database
const plugin: Plugin = await db.query.plugins.findFirst(...);

// Type for inserting into database
const newPlugin: NewPlugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  description: 'A great plugin',
  author: 'me',
  repoUrl: 'https://github.com/me/my-plugin'
};

await db.insert(plugins).values(newPlugin);
```

### Querying Data

```typescript
import { createDbClient, plugins } from '@skillstash/db';
import { eq, like, desc } from 'drizzle-orm';

const db = createDbClient(env.DB);

// Find all plugins
const allPlugins = await db.query.plugins.findMany();

// Find by ID
const plugin = await db.query.plugins.findFirst({
  where: eq(plugins.id, 'git-workflow')
});

// Search by name
const searchResults = await db.query.plugins.findMany({
  where: like(plugins.name, '%git%'),
  orderBy: desc(plugins.stars)
});

// Insert new plugin
await db.insert(plugins).values({
  id: 'new-plugin',
  name: 'New Plugin',
  description: 'Description',
  author: 'author',
  repoUrl: 'https://github.com/author/plugin'
});

// Update plugin
await db.update(plugins)
  .set({ stars: 100 })
  .where(eq(plugins.id, 'git-workflow'));

// Delete plugin
await db.delete(plugins)
  .where(eq(plugins.id, 'old-plugin'));
```

## Development

### Generate Migrations

After modifying schema files, generate migrations:

```bash
pnpm db:generate
```

This creates migration files in `migrations/` directory.

### Push Schema to Database

Push schema changes directly to the database (development only):

```bash
pnpm db:push
```

### Drizzle Studio

Launch the visual database browser:

```bash
pnpm db:studio
```

### Type Checking

```bash
pnpm typecheck
```

## Scripts

- `pnpm generate` - Generate migration files from schema
- `pnpm push` - Push schema directly to database
- `pnpm studio` - Launch Drizzle Studio
- `pnpm typecheck` - Run TypeScript type checking

## Environment Variables

Database credentials are managed via environment variables. See `workers/api/.dev.vars.example` for configuration.

**IMPORTANT**: Never commit database IDs or credentials. Use `.dev.vars` locally and Cloudflare dashboard for production.

## Integration

### In Cloudflare Workers

1. Add dependency in `package.json`:
```json
{
  "dependencies": {
    "@skillstash/db": "workspace:*",
    "drizzle-orm": "^0.29.3"
  }
}
```

2. Configure D1 binding in `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "skillstash-registry"
```

3. Use in worker:
```typescript
import { createDbClient } from '@skillstash/db';

type Bindings = {
  DB: D1Database;
};

export default {
  async fetch(request: Request, env: Bindings) {
    const db = createDbClient(env.DB);
    // Use db...
  }
};
```

### In CLI or Other Packages

```typescript
import type { Plugin, Skill, Agent } from '@skillstash/db';

// Use types for validation, display, etc.
```

## Benefits

1. **Type Safety**: Full TypeScript types from schema to API
2. **DRY**: Single source of truth for database schema
3. **Migrations**: Automatic migration generation with Drizzle Kit
4. **Developer Experience**: Drizzle Studio for visual DB inspection
5. **Reusability**: Import types and client anywhere in monorepo
6. **Security**: Credentials in environment variables, not committed

## Learn More

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [SkillStash Project Documentation](../../CLAUDE.md)
