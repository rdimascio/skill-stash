# Task 008: Alchemy Infrastructure Migration

**Priority**: High
**Estimated Time**: 4-6 hours
**Assigned To**: DevOps Infrastructure Engineer
**Dependencies**: All previous tasks (001-007) complete
**Status**: Not Started

---

## Overview

Migrate from manual Cloudflare Workers deployment (wrangler) to Alchemy infrastructure-as-code deployment. Alchemy provides TypeScript-based infrastructure definitions, simplifying deployment and configuration management.

**Key Benefits**:
- Infrastructure as TypeScript code (not TOML config files)
- Simplified deployment with `alchemy deploy`
- Better secret management with .env files
- Single source of truth for infrastructure
- Easier local development with `alchemy dev`

---

## Objectives

1. **Install and Configure Alchemy**
   - Add Alchemy to project dependencies
   - Configure Alchemy for Cloudflare
   - Set up authentication

2. **Create Infrastructure Definitions**
   - Create `alchemy.run.ts` files for API and Indexer workers
   - Define D1 database resources
   - Define R2 bucket resources
   - Configure worker bindings programmatically

3. **Migrate Environment Variables**
   - Move all secrets to `.env` files
   - Create `.env.example` files for documentation
   - Update workers to read from environment variables
   - Remove hardcoded values from wrangler.toml

4. **Update Deployment Scripts**
   - Replace wrangler commands with Alchemy commands
   - Update package.json scripts
   - Update GitHub Actions workflows
   - Test deployment flow

5. **Update Documentation**
   - Update DEPLOYMENT.md with Alchemy approach
   - Update LAUNCH-READINESS.md
   - Update CLAUDE.md with new deployment commands
   - Create Alchemy best practices guide

---

## Technical Requirements

### 1. Alchemy Installation

**Root package.json**:
```json
{
  "devDependencies": {
    "alchemy": "latest"
  },
  "scripts": {
    "infra:dev": "alchemy dev",
    "infra:deploy": "alchemy deploy",
    "infra:destroy": "alchemy destroy",
    "deploy:all": "alchemy deploy"
  }
}
```

**Setup Commands**:
```bash
pnpm add -D alchemy
alchemy configure  # Set up Cloudflare credentials
alchemy login      # Authenticate with Cloudflare
```

### 2. Infrastructure Definitions

**Create `/alchemy.run.ts`** (root level):
```typescript
import alchemy from "alchemy";
import { Worker, D1Database, R2Bucket } from "alchemy/cloudflare";

const app = await alchemy("skillstash");

// Create D1 Database
const database = await D1Database("skillstash-registry", {
  // Database will be created if it doesn't exist
});

// Create R2 Bucket
const cache = await R2Bucket("skillstash-cache", {
  // Bucket will be created if it doesn't exist
});

// Deploy API Worker
const apiWorker = await Worker("skillstash-api", {
  entrypoint: "./workers/api/src/index.ts",
  bindings: {
    DB: database,
    CACHE: cache,
  },
  env: {
    ENVIRONMENT: process.env.ENVIRONMENT || "production",
  },
  secrets: ["GITHUB_TOKEN"], // Reads from .env
});

// Deploy Indexer Worker
const indexerWorker = await Worker("skillstash-indexer", {
  entrypoint: "./workers/indexer/src/index.ts",
  bindings: {
    DB: database,
    CACHE: cache,
  },
  env: {
    ENVIRONMENT: process.env.ENVIRONMENT || "production",
  },
  secrets: ["GITHUB_TOKEN"],
  triggers: {
    crons: ["0 2 * * *"], // Daily at 2 AM UTC
  },
});

console.log(`✅ API Worker deployed: ${apiWorker.url}`);
console.log(`✅ Indexer Worker deployed: ${indexerWorker.url}`);

await app.finalize();
```

### 3. Environment Variable Management

**Create `/.env.example`**:
```bash
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Application Secrets
GITHUB_TOKEN=your-github-personal-access-token

# Environment
ENVIRONMENT=development
```

**Create `/.env`** (gitignored):
- Copy from `.env.example`
- Fill in actual values
- Never commit to repository

**Update `.gitignore`**:
```
.env
.env.local
.env.*.local
```

### 4. Worker Environment Access

**Update worker code to read from bindings**:

Workers already access `env.DB`, `env.CACHE`, and `env.GITHUB_TOKEN` correctly via Cloudflare Worker bindings. No changes needed to worker code.

### 5. Update Deployment Scripts

**Root `package.json` changes**:
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "deploy:web": "turbo run build --filter=web && cd apps/web && vercel --prod",
    "deploy:workers": "alchemy deploy",
    "deploy:all": "pnpm build && alchemy deploy && pnpm deploy:web",
    "infra:dev": "alchemy dev",
    "infra:destroy": "alchemy destroy"
  }
}
```

**Remove**:
- `deploy:api` script (replaced by Alchemy)
- `deploy:indexer` script (replaced by Alchemy)

### 6. Update GitHub Actions

**`.github/workflows/deploy-workers.yml`**:
```yaml
name: Deploy Workers

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build workers
        run: pnpm build:workers

      - name: Deploy with Alchemy
        run: pnpm deploy:workers
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ENVIRONMENT: production
```

---

## Migration Steps

### Phase 1: Setup (30 minutes)
1. Install Alchemy: `pnpm add -D alchemy`
2. Configure Alchemy: `alchemy configure`
3. Authenticate: `alchemy login`
4. Create `.env.example` with all required variables
5. Create `.env` with actual values (local development)
6. Update `.gitignore` to exclude `.env` files

### Phase 2: Infrastructure Code (1 hour)
1. Create `/alchemy.run.ts` with full infrastructure definition
2. Define D1 database resource
3. Define R2 bucket resource
4. Define API worker with bindings
5. Define Indexer worker with bindings and cron trigger
6. Test locally: `alchemy dev`

### Phase 3: Deployment Testing (1 hour)
1. Test deployment: `alchemy deploy`
2. Verify workers are deployed correctly
3. Verify D1 database is accessible
4. Verify R2 bucket is accessible
5. Test API endpoints
6. Test indexer manually

### Phase 4: Script Updates (30 minutes)
1. Update root `package.json` scripts
2. Remove individual deploy:api and deploy:indexer scripts
3. Add unified deploy:workers using Alchemy
4. Add infra management scripts (dev, destroy)

### Phase 5: CI/CD Updates (45 minutes)
1. Update `.github/workflows/deploy-workers.yml`
2. Add Cloudflare secrets to GitHub repository
3. Test GitHub Actions deployment
4. Verify automated deployments work

### Phase 6: Documentation (1.5 hours)
1. Update DEPLOYMENT.md with Alchemy approach
2. Update LAUNCH-READINESS.md
3. Update CLAUDE.md with new commands
4. Create Alchemy best practices guide
5. Update README.md if needed

### Phase 7: Cleanup (30 minutes)
1. Remove `wrangler.toml` files (optional, can keep for reference)
2. Remove wrangler from dependencies (optional)
3. Update any remaining references to wrangler commands
4. Final testing of complete deployment flow

---

## Acceptance Criteria

### Infrastructure
- [x] Alchemy installed and configured
- [x] `alchemy.run.ts` created with complete infrastructure definition
- [x] D1 database defined and accessible
- [x] R2 bucket defined and accessible
- [x] Both workers deploy successfully via Alchemy

### Environment Variables
- [x] All secrets moved to `.env` files
- [x] `.env.example` created with all required variables
- [x] `.env` gitignored and never committed
- [x] Workers read secrets from environment bindings correctly

### Deployment
- [x] `alchemy deploy` successfully deploys all infrastructure
- [x] `alchemy dev` works for local development
- [x] API worker accessible and functional
- [x] Indexer worker runs on schedule
- [x] Database operations work correctly
- [x] R2 caching works correctly

### Scripts and CI/CD
- [x] Package.json scripts updated to use Alchemy
- [x] GitHub Actions workflows updated
- [x] Automated deployment works in CI/CD
- [x] All tests pass after migration

### Documentation
- [x] DEPLOYMENT.md updated with Alchemy instructions
- [x] LAUNCH-READINESS.md reflects Alchemy approach
- [x] CLAUDE.md has correct deployment commands
- [x] Best practices guide created

---

## Testing Checklist

### Local Development
- [ ] `pnpm install` completes successfully
- [ ] `alchemy dev` starts local development environment
- [ ] API worker responds at local URL
- [ ] Database queries work locally
- [ ] R2 operations work locally

### Deployment
- [ ] `alchemy deploy` completes without errors
- [ ] Workers deployed to Cloudflare
- [ ] API endpoint returns correct responses
- [ ] Indexer can be triggered manually
- [ ] Database is accessible from workers
- [ ] R2 bucket is accessible from workers

### GitHub Actions
- [ ] Push to main triggers deployment workflow
- [ ] Workflow completes successfully
- [ ] Workers are updated in production
- [ ] No secrets leaked in logs
- [ ] Deployment verification passes

---

## Rollback Plan

If issues arise during migration:

1. **Keep wrangler.toml files** during migration for easy rollback
2. **Test in development** environment first before production
3. **Rollback command**: Can still use `wrangler deploy` with old config
4. **Database safety**: D1 database and R2 bucket are unchanged
5. **GitHub Actions**: Can revert workflow to previous version

---

## References

- [Alchemy Documentation](https://alchemy.run)
- [Alchemy Getting Started](https://alchemy.run/getting-started/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)

---

## Notes

- Alchemy simplifies infrastructure management by using TypeScript instead of TOML
- All existing Cloudflare resources (D1, R2) remain unchanged
- Workers continue to use the same code, just deployed via Alchemy
- Environment variables provide better security than hardcoded values
- GitHub Actions secrets ensure secure CI/CD deployment

---

**Created**: October 18, 2025
**Last Updated**: October 18, 2025
**Status**: Ready for DevOps Agent
