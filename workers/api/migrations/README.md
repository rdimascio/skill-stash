# Database Migrations

This directory contains SQL migration files for the SkillStash registry database.

## Migration Files

- `0001_initial_schema.sql` - Initial database schema with all 10 core tables
- `0002_add_fts_search.sql` - FTS5 full-text search and views for discovery

## Running Migrations

### Local Development

Run all migrations against local D1 database:

```bash
# From project root
pnpm db:migrate:local

# Or manually with wrangler
wrangler d1 migrations apply skillstash-registry --local
```

### Production

Run migrations against production D1 database:

```bash
# From project root
pnpm db:migrate

# Or manually with wrangler
wrangler d1 migrations apply skillstash-registry
```

## Migration Naming Convention

Migrations follow the pattern: `XXXX_descriptive_name.sql`

- `XXXX` - Sequential 4-digit number (0001, 0002, etc.)
- `descriptive_name` - Brief description using snake_case

## Creating New Migrations

1. Create a new file with the next sequential number
2. Add SQL statements for schema changes
3. Include rollback instructions in comments if complex
4. Test locally before production deployment
5. Update this README with migration description

## Migration Best Practices

- **Idempotent**: Use `IF NOT EXISTS` and `IF EXISTS` clauses
- **Forward-only**: Migrations should only move forward, no rollbacks
- **Tested**: Always test migrations locally first
- **Documented**: Include comments explaining complex changes
- **Atomic**: Each migration should be a logical unit of work
- **Indexed**: Add indexes in migrations, not separate scripts

## Database Schema

The current schema includes:

**Core Tables:**
- `authors` - Plugin creator information
- `plugins` - Main plugin registry
- `plugin_versions` - Version history with semver
- `plugin_tags` - Tag taxonomy for discovery
- `plugin_dependencies` - Inter-plugin dependencies

**Component Tables:**
- `skills` - Reusable skill definitions
- `agents` - Agent definitions
- `commands` - Slash command definitions
- `mcp_servers` - MCP server integrations

**Analytics:**
- `download_stats` - Usage analytics

**Search:**
- `plugins_fts` - FTS5 virtual table for full-text search

**Views:**
- `plugin_list_view` - Plugin list with author info
- `popular_plugins_view` - Most downloaded plugins
- `trending_plugins_view` - Recently active plugins
