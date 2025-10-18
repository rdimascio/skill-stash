# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SkillStash is a discovery and distribution platform for Claude Code plugins — think "shadcn/ui for Claude Code". The project is a pnpm-based monorepo using Turborepo with three main components:

1. **Web App** (`apps/web/`) - Next.js 15 frontend at skillstash.com
2. **CLI Tool** (`packages/cli/`) - npm package `@skillstash/cli` for searching/installing plugins
3. **Backend Workers** (`workers/`) - Cloudflare Workers for registry API and GitHub indexing

## Architecture & Technology Stack

### Monorepo Structure
- **Package Manager**: pnpm 8+ (required)
- **Build System**: Turborepo for task orchestration
- **Language**: TypeScript with strict mode
- **Workspaces**: `apps/*`, `packages/*`, `workers/*`

### Key Components
- **Frontend**: Next.js 15 (App Router, RSC), Tailwind CSS, shadcn/ui
- **Backend**: Cloudflare Workers (Hono framework), D1 (SQLite), R2 storage
- **CLI**: Node.js, Commander.js, chalk/ora/prompts for UI
- **Shared**: `packages/shared/` contains TypeScript types used across all packages

## Common Commands

### Development
```bash
# Install dependencies (always use pnpm)
pnpm install

# Run all apps in dev mode
pnpm dev

# Run specific workspace
pnpm --filter web dev              # Web app only
pnpm --filter @skillstash/cli dev  # CLI only
pnpm --filter api dev              # API worker only
pnpm --filter indexer dev          # Indexer worker only
```

### Building
```bash
# Build all packages
pnpm build

# Build specific workspace
pnpm build:web      # or: pnpm --filter web build
pnpm build:cli      # or: pnpm --filter @skillstash/cli build
pnpm build:workers  # or: pnpm --filter './workers/*' build
```

### Testing & Quality
```bash
# Run all tests
pnpm test

# Test specific workspace
pnpm test:web       # or: pnpm --filter web test
pnpm test:cli       # or: pnpm --filter @skillstash/cli test
pnpm test:workers   # or: pnpm --filter './workers/*' test

# Lint and format
pnpm lint           # Lint all packages
pnpm format         # Format with Prettier
pnpm format:check   # Check formatting
pnpm typecheck      # TypeScript type checking
```

### Database (Cloudflare D1)
```bash
# Run migrations locally
pnpm db:migrate:local

# Run migrations in production
pnpm db:migrate

# Seed database locally
pnpm db:seed:local

# Seed database in production
pnpm db:seed
```

### Deployment
```bash
# Deploy web app to Vercel
pnpm deploy:web

# Deploy Cloudflare Workers
pnpm deploy:api        # API worker
pnpm deploy:indexer    # Indexer worker
pnpm deploy:workers    # Both workers

# Publish CLI to npm
pnpm publish:cli
```

### Utilities
```bash
# Clean build artifacts
pnpm clean

# Reset (clean + reinstall)
pnpm reset
```

## Working with the Monorepo

### Adding Dependencies
Always use pnpm with `--filter` to add dependencies to specific workspaces:
```bash
# Add to web app
pnpm --filter web add react-query

# Add to CLI
pnpm --filter @skillstash/cli add commander

# Add dev dependency
pnpm --filter web add -D @types/node

# Add to multiple workspaces
pnpm --filter './apps/*' add lodash
```

### Cross-Package Dependencies
Packages can reference each other using workspace protocol:
```json
{
  "dependencies": {
    "@skillstash/shared": "workspace:*"
  }
}
```

### Filtering Commands
Turborepo/pnpm filter patterns:
- `--filter web` - Specific package by name
- `--filter @skillstash/cli` - Specific scoped package
- `--filter './apps/*'` - All apps
- `--filter './workers/*'` - All workers
- `--filter '!web'` - Everything except web

## Project-Specific Patterns

### Database Schema Location
Database schema and migrations live in `workers/api/`:
- `workers/api/schema.sql` - Main database schema
- `workers/api/migrations/` - D1 migration files

### Shared Types
All TypeScript types shared between packages are in `packages/shared/src/types/`:
- `Plugin`, `Skill`, `Agent`, `Command`, `MCPServer` interfaces
- Import as: `import type { Plugin } from '@skillstash/shared'`

### Environment Variables
Each component has its own environment file:
- Web: `apps/web/.env.local`
- API Worker: `workers/api/.dev.vars`
- Indexer Worker: `workers/indexer/.dev.vars`

Key environment variables:
- `NEXT_PUBLIC_API_URL` - API endpoint for web app
- `GITHUB_TOKEN` - Personal access token for indexer
- `ENVIRONMENT` - deployment environment (development/production)

### Cloudflare Resources
Production infrastructure uses:
- D1 Database: `skillstash-registry`
- R2 Bucket: `skillstash-cache`
- Workers: `skillstash-api`, `skillstash-indexer`

### Deployment Triggers (GitHub Actions)
- Push to `main` → Deploy web + workers
- Tag `cli-v*` → Publish CLI to npm
- All PRs → Run tests + preview deployments

## Development Principles

### Code Quality Standards
- TypeScript strict mode enabled across all packages
- ESLint + Prettier for consistent formatting
- Conventional commits preferred
- PR reviews required for main branch

### Performance Targets
- API response times < 100ms
- Web app Lighthouse score > 90
- CLI commands feel instant (< 1s)
- Aggressive caching with R2

### Worker Development
When working on Cloudflare Workers:
- Use `wrangler dev` for local development
- Test locally with `--local` flag before production
- Workers use Hono framework for routing
- D1 bindings are accessed via `env.DB`
- R2 bindings via `env.CACHE`

### CLI Development
When working on the CLI:
- Test locally: `cd packages/cli && node dist/index.js`
- Use Commander.js for command structure
- Beautiful terminal UI: chalk (colors), ora (spinners), prompts (input)
- Commands: search, add, install, info, list, init, publish, validate

### Next.js App Development
When working on the web app:
- Use App Router (not Pages Router)
- Server Components by default
- Client Components marked with 'use client'
- shadcn/ui components in `components/ui/`
- API routes in `app/api/`

## Task Documentation

Detailed task breakdowns are in `project/tasks/`:
- `001-database-schema.md` - Database design
- `002-plugin-indexer-service.md` - GitHub crawler
- `003-registry-api.md` - API endpoints
- `004-cli-tool.md` - CLI implementation
- `005-web-frontend.md` - Web app features
- `006-project-setup.md` - Infrastructure
- `007-launch-checklist.md` - MVP requirements

Refer to these for comprehensive implementation details.

## Troubleshooting

### pnpm install fails
- Ensure pnpm 8+ is installed: `pnpm --version`
- Try: `pnpm clean && pnpm install`

### Turborepo cache issues
- Clear cache: `rm -rf .turbo && pnpm build`

### Wrangler command not found
- Install globally: `npm install -g wrangler`
- Or use: `pnpm --filter api exec wrangler`

### Type errors in monorepo
- Build shared package first: `pnpm --filter @skillstash/shared build`
- Then build dependent packages
