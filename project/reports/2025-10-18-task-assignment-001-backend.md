# Task Assignment 001: Database Schema & Models

**Date**: October 18, 2025
**Assigned to**: Backend Infrastructure Specialist
**Priority**: CRITICAL
**Estimated Duration**: 1-2 days
**Status**: BLOCKED (waiting for D1 database ID from Task 006)

## Task Overview

Design and implement the core database schema for SkillStash registry using Cloudflare D1 (SQLite). This includes all tables, indexes, TypeScript types, and migrations.

## Task Specification

**Reference**: `/Users/rdimascio/p/skill-stash/project/tasks/001-database-schema.md`

Please review the complete task specification in the file above for detailed schema design.

## MANDATORY: Git Workflow Requirements

**CRITICAL**: You MUST use the git skill for all version control operations.

### Initial Setup
```bash
# Activate git skill
/git

# Your workflow will be guided by the git skill
```

### Branch-Based Workflow
- **Never push directly to main**
- Create feature branch: `feat/database-schema`
- Commit frequently (every 20-30 minutes)
- Use conventional commits: `type(scope): description`

### Commit Examples
```
feat(database): add plugins table schema
feat(database): add skills and agents tables
feat(database): add users and collections tables
feat(database): create indexes for performance
feat(types): add TypeScript type definitions
feat(migrations): create initial migration file
feat(database): add seed data for development
test(database): verify schema constraints
docs(database): document schema design decisions
```

### Pull Request Creation
When work is complete:
- Use git skill to create PR
- Never push to main directly
- Include schema documentation
- List all tables and relationships

## Current Status: BLOCKED

**Waiting for**: D1 Database ID from DevOps Infrastructure Engineer (Task 006)

### What You Need
- D1 database ID (from Cloudflare)
- Wrangler configuration
- Access to run migrations

### While Waiting
You can prepare:
1. Review the complete schema in `project/tasks/001-database-schema.md`
2. Plan the migration sequence
3. Design seed data
4. Review TypeScript type definitions

**DO NOT START** until you receive the D1 database ID.

## Key Deliverables

### 1. Database Schema
Location: `workers/api/schema.sql`

**Tables to Create**:
- [ ] `plugins` - Core plugin metadata (10 columns + indexes)
- [ ] `skills` - Plugin skills (6 columns + indexes)
- [ ] `agents` - Plugin agents (6 columns + indexes)
- [ ] `commands` - Plugin commands (6 columns + indexes)
- [ ] `mcp_servers` - MCP server configurations (6 columns + indexes)
- [ ] `users` - User accounts (10 columns + indexes)
- [ ] `collections` - Plugin collections (8 columns + indexes)
- [ ] `collection_plugins` - Collection membership (3 columns + indexes)
- [ ] `plugin_downloads` - Download tracking (5 columns + indexes)
- [ ] `plugin_ratings` - User ratings (7 columns + indexes)

### 2. TypeScript Types
Location: `packages/shared/src/types.ts`

**Types to Define**:
- [ ] `Plugin` interface
- [ ] `Skill` interface
- [ ] `Agent` interface
- [ ] `Command` interface
- [ ] `MCPServer` interface
- [ ] `User` interface
- [ ] `Collection` interface
- [ ] `PluginDownload` interface
- [ ] `PluginRating` interface

### 3. Migration Files
Location: `workers/api/migrations/`

- [ ] `0001_initial_schema.sql` - Create all tables
- [ ] `0002_indexes.sql` - Add performance indexes
- [ ] Migration testing script

### 4. Seed Data
Location: `workers/api/seed.sql`

**Sample Data**:
- [ ] 5-10 example plugins
- [ ] Skills, agents, commands for each plugin
- [ ] 3-5 test users
- [ ] 2-3 collections
- [ ] Sample ratings and downloads

## Schema Requirements

### Database Constraints
- Use UUIDs for all primary keys
- Foreign keys with proper CASCADE behavior
- CHECK constraints for enums (e.g., author_type)
- NOT NULL where appropriate
- UNIQUE constraints for slugs and names

### Indexes
Critical indexes for performance:
- `idx_plugins_slug` - Plugin lookup by slug
- `idx_plugins_category` - Browse by category
- `idx_plugins_downloads` - Sort by popularity
- `idx_plugins_updated` - Sort by recency
- All foreign key relationships

### JSON Fields
SQLite doesn't have native JSON arrays, so:
- Store as TEXT in database
- Parse/stringify in application code
- Document format in schema comments
- Examples: `tags`, `capabilities`

### Timestamps
- Use ISO 8601 format
- Default to CURRENT_TIMESTAMP
- `created_at`, `updated_at`, `last_indexed_at`

## Critical Handoffs

After completing database schema, you MUST provide:

### For Backend API Developer (Task 003)
- Database schema documentation
- TypeScript types package
- Migration instructions
- Example queries

### For ingester Service Developer (Task 002)
- Plugin insert/update queries
- Relationship handling (skills, agents, commands)
- Transaction patterns

### For All Developers
- Database access patterns
- Query examples

## Dependencies

**Blocked by**:
- Task 006 (Infrastructure Setup) - needs D1 database ID

**Blocks**:
- Task 002 (ingester Service) - needs schema to insert data
- Task 003 (Registry API) - needs schema for queries
- Task 004 (CLI Tool) - needs types
- Task 005 (Web Frontend) - needs types

## Success Criteria

- [ ] All 10 tables created successfully in D1
- [ ] Foreign key constraints working correctly
- [ ] Indexes created for all common queries
- [ ] TypeScript types exactly match schema
- [ ] Can insert test data without errors
- [ ] Can query data with proper joins
- [ ] Migration files run successfully
- [ ] Seed data populates correctly
- [ ] No orphaned records possible
- [ ] **Git workflow followed**: feature branch, frequent commits, PR created
- [ ] **No direct commits to main**
- [ ] **Status report saved** to `project/reports/`

## Testing Checklist

Before marking this task complete:

```bash
# Run migrations locally
cd workers/api
pnpm exec wrangler d1 migrations apply skillstash-registry --local

# Verify tables created
pnpm exec wrangler d1 execute skillstash-registry --local \
  --command "SELECT name FROM sqlite_master WHERE type='table'"

# Test insert
pnpm exec wrangler d1 execute skillstash-registry --local \
  --file seed.sql

# Verify data
pnpm exec wrangler d1 execute skillstash-registry --local \
  --command "SELECT COUNT(*) FROM plugins"

# Test foreign keys
pnpm exec wrangler d1 execute skillstash-registry --local \
  --command "PRAGMA foreign_keys = ON; DELETE FROM plugins WHERE id = 'test-id'"

# Build shared types package
cd ../../packages/shared
pnpm build

# Verify types are accessible
pnpm exec tsc --noEmit
```

## Timeline

**Once Unblocked**:

**Day 1**:
- Create complete `schema.sql`
- Define all TypeScript types
- Create migration files
- Test schema locally

**Day 2**:
- Create seed data
- Test migrations and seeds
- Run full integration test
- Document schema
- Create PR and handoff

## Schema Design Principles

1. **Normalization**: Proper 3NF normalization
2. **Performance**: Index all foreign keys and common queries
3. **Integrity**: Foreign keys with CASCADE rules
4. **Flexibility**: JSON for arrays and dynamic data
5. **Simplicity**: SQLite-appropriate patterns

## Example Schema Snippet

```sql
-- Example: plugins table with proper constraints
CREATE TABLE plugins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  author_id TEXT,
  author_type TEXT CHECK(author_type IN ('user', 'org')),
  repo_url TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT, -- JSON array: ["cli", "productivity"]
  version TEXT NOT NULL,
  downloads INTEGER DEFAULT 0,
  stars INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX idx_plugins_slug ON plugins(slug);
CREATE INDEX idx_plugins_category ON plugins(category);
```

## Support & Questions

If you encounter issues:
1. Review SQLite/D1 documentation
2. Test schema changes locally first
3. Document any design decisions
4. Escalate to Project Manager if blocked

## Reporting Requirements

Once unblocked, save daily progress to:
- `project/reports/2025-10-XX-backend-status.md`

Include:
- Tables completed
- Types defined
- Test results
- Any schema design decisions
- Blocker status

---

## When Ready to Start

1. **Wait for D1 database ID** from DevOps Agent
2. Review complete task: `project/tasks/001-database-schema.md`
3. Activate git skill: `/git`
4. Create feature branch: `feat/database-schema`
5. Begin with schema.sql
6. Commit every 20-30 minutes
7. Test thoroughly before PR

**REMEMBER**: Use `/git` skill for all version control operations. Never commit directly to main.

You'll be notified when Task 006 is complete and you're unblocked!
