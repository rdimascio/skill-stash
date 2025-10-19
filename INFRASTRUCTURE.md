# Infrastructure Setup Guide

This document provides comprehensive instructions for setting up and managing the SkillStash infrastructure.

## Prerequisites

- Node.js 18+ installed
- pnpm 8+ installed (`npm install -g pnpm@8`)
- Wrangler CLI installed (`npm install -g wrangler`)
- GitHub account with repository access
- Cloudflare account
- Vercel account (for web deployment)
- npm account (for CLI publishing)

## Initial Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate with your Cloudflare account.

### 3. Create Cloudflare D1 Database

```bash
# Create the database
wrangler d1 create skillstash-registry

# Save the database ID from the output
# It will look like: database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**CRITICAL**: Update the `database_id` in both wrangler.toml files:
- `/Users/rdimascio/p/skill-stash/workers/api/wrangler.toml`
- `/Users/rdimascio/p/skill-stash/workers/indexer/wrangler.toml`

Replace the empty string with your actual database ID:
```toml
[[d1_databases]]
binding = "DB"
database_name = "skillstash-registry"
database_id = "your-database-id-here"  # FILL THIS IN
```

### 4. Create Cloudflare R2 Bucket

```bash
# Create the R2 bucket for caching
wrangler r2 bucket create skillstash-cache
```

### 5. Set Up Environment Variables

#### Web App (`apps/web/.env.local`)

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

For production, use: `https://api.skillstash.com`

#### API Worker (`workers/api/.dev.vars`)

```bash
cp workers/api/.dev.vars.example workers/api/.dev.vars
```

Edit `.dev.vars`:
```env
ENVIRONMENT=development
```

#### Indexer Worker (`workers/indexer/.dev.vars`)

```bash
cp workers/indexer/.dev.vars.example workers/indexer/.dev.vars
```

Edit `.dev.vars` and add your GitHub token:
```env
ENVIRONMENT=development
GITHUB_TOKEN=your_github_personal_access_token
```

To create a GitHub token:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `public_repo`, `read:user`
4. Generate and copy the token

## Development

### Run All Services

```bash
pnpm dev
```

### Run Individual Services

```bash
# Web app only
pnpm dev:web

# API worker only
pnpm dev:api

# Indexer worker only
pnpm dev:indexer

# CLI tool only
pnpm dev:cli
```

### Database Migrations

The database schema will be created by the Backend Agent. Once ready:

```bash
# Apply migrations locally
pnpm db:migrate:local

# Apply migrations to production
pnpm db:migrate
```

### Seed Database

```bash
# Seed local database
pnpm db:seed:local

# Seed production database
pnpm db:seed
```

## Building

### Build All Packages

```bash
pnpm build
```

### Build Individual Packages

```bash
pnpm build:web      # Build web app
pnpm build:cli      # Build CLI tool
pnpm build:workers  # Build all workers
```

## Testing & Quality

### Run Tests

```bash
pnpm test           # All tests
pnpm test:web       # Web tests only
pnpm test:cli       # CLI tests only
pnpm test:workers   # Worker tests only
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

### Formatting

```bash
pnpm format        # Format all files
pnpm format:check  # Check formatting
```

## Deployment

### Web App (Vercel)

#### Setup

1. Install Vercel CLI: `npm install -g vercel`
2. Link project: `cd apps/web && vercel link`
3. Set environment variable in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL=https://api.skillstash.com`

#### Deploy

```bash
pnpm deploy:web
```

Or push to `main` branch - GitHub Actions will auto-deploy.

### Cloudflare Workers

#### Deploy API Worker

```bash
pnpm deploy:api
```

#### Deploy Indexer Worker

```bash
pnpm deploy:indexer
```

#### Deploy Both Workers

```bash
pnpm deploy:workers
```

Or push to `main` branch - GitHub Actions will auto-deploy.

### CLI (npm)

#### Publish to npm

1. Login to npm: `npm login`
2. Create git tag: `git tag cli-v0.1.0`
3. Push tag: `git push origin cli-v0.1.0`

GitHub Actions will automatically publish to npm.

Or manually:
```bash
pnpm publish:cli
```

## GitHub Actions Configuration

### Required Secrets

Configure these secrets in your GitHub repository settings:

#### For Web Deployment
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `NEXT_PUBLIC_API_URL` - Production API URL

#### For Worker Deployment (Alchemy)
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Workers, D1, and R2 permissions
- `CLOUDFLARE_EMAIL` - Cloudflare account email
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID (from dashboard or `wrangler whoami`)
- `ALCHEMY_PASSWORD` - Encryption password for Alchemy state management
- `ALCHEMY_STATE_TOKEN` - State management token for Alchemy
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions (for indexer and PR comments)

#### For CLI Publishing
- `NPM_TOKEN` - npm authentication token

### Getting Tokens

**Vercel Token**:
1. Go to https://vercel.com/account/tokens
2. Create new token
3. Copy token value

**Vercel Org/Project IDs**:
Run in `apps/web/`:
```bash
vercel link
cat .vercel/project.json
```

**Cloudflare API Token**:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create token with:
   - Workers Scripts: Edit
   - D1: Edit
   - Workers R2 Storage: Edit

**npm Token**:
1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Generate new token (Automation type)
3. Copy token value

## DNS Configuration

### Cloudflare DNS

Add these records in Cloudflare DNS:

```
Type    Name    Content                         Proxy
A       @       <Vercel IP from web deployment> Proxied
CNAME   api     skillstash-api.workers.dev      Proxied
CNAME   www     skillstash.com                  Proxied
```

### Worker Routes

Worker routes are configured in `wrangler.toml`:
- API Worker: `api.skillstash.com/*`

## Monitoring & Logs

### View Worker Logs

```bash
# API worker logs
wrangler tail skillstash-api

# Indexer worker logs
wrangler tail skillstash-indexer
```

### View D1 Database

```bash
# Open D1 console
wrangler d1 execute skillstash-registry --command "SELECT * FROM plugins LIMIT 10"
```

### View R2 Bucket

```bash
# List objects in R2
wrangler r2 object list skillstash-cache
```

## Troubleshooting

### pnpm install fails

```bash
pnpm clean
pnpm install
```

### Build fails

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Worker deployment fails

Check that:
1. You're authenticated: `wrangler whoami`
2. Database ID is set in `wrangler.toml`
3. R2 bucket exists: `wrangler r2 bucket list`

### Database migration fails

```bash
# Check database exists
wrangler d1 list

# Try local migration first
pnpm db:migrate:local
```

## Maintenance

### Update Dependencies

```bash
# Check for updates
pnpm outdated

# Update all dependencies
pnpm update -r

# Update specific package
pnpm --filter web update next
```

### Clean Build Artifacts

```bash
pnpm clean
```

### Reset Everything

```bash
pnpm reset  # Cleans and reinstalls
```

## Production Checklist

Before going live, ensure:

- [ ] D1 database created and ID configured
- [ ] R2 bucket created
- [ ] Environment variables set in Vercel
- [ ] GitHub secrets configured
- [ ] DNS records pointing to correct locations
- [ ] SSL certificates active
- [ ] Worker routes configured
- [ ] Database migrations applied
- [ ] Database seeded with initial data
- [ ] API responding at `api.skillstash.com`
- [ ] Web app responding at `skillstash.com`
- [ ] GitHub Actions workflows passing

## Support

For infrastructure issues:
1. Check this documentation
2. Review GitHub Actions logs
3. Check Cloudflare Workers logs with `wrangler tail`
4. Review Vercel deployment logs

## Database ID Handoff

**FOR BACKEND AGENT**: Once you've created the D1 database, provide the database ID to the Backend Agent immediately. They need it to create the schema and migrations.

The database ID can be found:
- In the output of `wrangler d1 create skillstash-registry`
- In the Cloudflare dashboard under Workers & Pages > D1
- By running: `wrangler d1 list`

Format for handoff:
```
D1 Database: skillstash-registry
Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```
