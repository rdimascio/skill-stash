# SkillStash Deployment Guide

**Last Updated**: October 18, 2025
**Deployment Method**: Alchemy Infrastructure-as-Code
**Estimated Total Time**: 2-3 hours

---

## Overview

This guide covers deploying the complete SkillStash platform using **Alchemy** for infrastructure management. Alchemy provides a TypeScript-based infrastructure-as-code approach, simplifying deployment and configuration management.

**Components to Deploy**:
- **Cloudflare Workers** (API + Indexer) - via Alchemy
- **Cloudflare D1** (Database) - via Alchemy
- **Cloudflare R2** (Cache Storage) - via Alchemy
- **Vercel** (Web Frontend) - via Vercel CLI
- **npm** (CLI Package) - via npm publish

---

## Prerequisites

### Required Accounts
- [x] **Cloudflare Account** (free tier sufficient)
- [x] **Vercel Account** (free tier sufficient)
- [x] **npm Account** (for CLI publishing)
- [x] **GitHub Account** (for Personal Access Token)

### Required Tools
```bash
# Install Node.js 18+
node --version  # Should be >= 18.0.0

# Install pnpm 8+
npm install -g pnpm
pnpm --version  # Should be >= 8.0.0

# Install Alchemy CLI
npm install -g alchemy

# Install Vercel CLI (optional, for manual deployments)
npm install -g vercel
```

### Environment Setup
```bash
# Clone repository
git clone https://github.com/yourusername/skill-stash.git
cd skill-stash

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

---

## Phase 1: Alchemy Setup (15 minutes)

### Step 1.1: Configure Alchemy
```bash
# Configure Alchemy with your Cloudflare credentials
alchemy configure

# This will prompt for:
# - Cloudflare API Token (create at: https://dash.cloudflare.com/profile/api-tokens)
# - Cloudflare Account ID (find in Cloudflare dashboard)
```

**Create Cloudflare API Token**:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Permissions needed:
   - Account > Workers Scripts > Edit
   - Account > D1 > Edit
   - Account > R2 > Edit
5. Copy the token (save it securely!)

### Step 1.1b: Configure GitHub Secrets for CI/CD

For automated deployments via GitHub Actions, configure these secrets in your repository:

**Navigate to**: Repository Settings → Secrets and variables → Actions → New repository secret

**Required Secrets**:
```bash
# Cloudflare Authentication
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token-here
CLOUDFLARE_EMAIL=your-cloudflare-account-email-here

# Alchemy State Management
ALCHEMY_PASSWORD=your-encryption-password-here
ALCHEMY_STATE_TOKEN=your-state-management-token-here

# GitHub Token (for indexer and PR comments)
GH_TOKEN=your-github-personal-access-token-here
```

**Important Notes**:
- `ALCHEMY_PASSWORD`: Choose a strong password for encrypting Alchemy state
- `ALCHEMY_STATE_TOKEN`: Generate a secure random token (e.g., `openssl rand -hex 32`)
- `GH_TOKEN`: Create with `repo` and `pull_requests` permissions for PR preview comments
- `CLOUDFLARE_EMAIL`: Use the email associated with your Cloudflare account

**PR Preview Deployments**:
The CI/CD pipeline now supports automatic preview deployments for pull requests:
- Opening/updating a PR → Creates preview environment with stage `pr-<number>`
- Closing a PR → Automatically destroys the preview environment
- Preview URLs are posted as comments on the PR automatically

### Step 1.2: Authenticate with Cloudflare
```bash
# Login to Cloudflare via Alchemy
alchemy login
```

### Step 1.3: Create Environment Variables
Create `.env` file in project root:

```bash
# Copy example file
cp .env.example .env

# Edit .env with your values
nano .env  # or use your preferred editor
```

**Required Environment Variables** (`.env`):
```bash
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token-here
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id-here

# GitHub Personal Access Token
# Create at: https://github.com/settings/tokens
# Permissions: repo (read), user (read)
GITHUB_TOKEN=your-github-personal-access-token-here

# Environment
ENVIRONMENT=production
```

**Important**: Never commit `.env` to git! It's in `.gitignore`.

---

## Phase 2: Database Setup (30 minutes)

### Step 2.1: Generate Database Schema
```bash
# Generate Drizzle migrations
pnpm db:generate
```

### Step 2.2: Deploy Database via Alchemy
The database will be created automatically when you run `alchemy deploy` in Phase 3.

### Step 2.3: Seed Database (After Initial Deploy)
```bash
# After workers are deployed, seed the database
# You can use wrangler to execute SQL against D1
pnpm --filter @skillstash/db exec wrangler d1 execute skillstash-registry \
  --remote \
  --file=src/seed.sql
```

Or manually trigger the indexer to populate data:
```bash
# Get your API worker URL from alchemy deploy output
curl -X POST https://skillstash-indexer.your-subdomain.workers.dev/index/owner/repo
```

---

## Phase 3: Deploy Workers with Alchemy (30 minutes)

### Step 3.1: Review Infrastructure Definition
The infrastructure is defined in `/alchemy.run.ts`. Review it to understand what will be deployed:

```typescript
// This file defines:
// - D1 Database (skillstash-registry)
// - R2 Bucket (skillstash-cache)
// - API Worker (skillstash-api)
// - Indexer Worker (skillstash-indexer) with cron schedule
```

### Step 3.2: Deploy Infrastructure
```bash
# Deploy all infrastructure (D1, R2, Workers)
pnpm deploy:workers

# OR use Alchemy directly
alchemy deploy
```

**What this does**:
1. Creates D1 database `skillstash-registry` (if not exists)
2. Creates R2 bucket `skillstash-cache` (if not exists)
3. Deploys API worker with DB and CACHE bindings
4. Deploys Indexer worker with DB and CACHE bindings + cron schedule
5. Injects secrets from `.env` file

**Expected Output**:
```
✅ D1 Database created: skillstash-registry
✅ R2 Bucket created: skillstash-cache
✅ API Worker deployed: https://skillstash-api.your-subdomain.workers.dev
✅ Indexer Worker deployed: https://skillstash-indexer.your-subdomain.workers.dev
```

### Step 3.3: Verify Deployment
```bash
# Test API health endpoint
curl https://skillstash-api.your-subdomain.workers.dev/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-18T..."}

# Test Indexer health endpoint
curl https://skillstash-indexer.your-subdomain.workers.dev/health

# Expected response:
# {"status":"ok"}
```

### Step 3.4: Save Worker URLs
Copy the worker URLs from the deployment output. You'll need them for the web app configuration.

**Example URLs**:
- API: `https://skillstash-api.your-subdomain.workers.dev`
- Indexer: `https://skillstash-indexer.your-subdomain.workers.dev`

---

## Phase 4: Deploy Frontend (30 minutes)

### 4.1 Create Environment Variables

Create `apps/web/.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://skillstash-api.<your-subdomain>.workers.dev
NEXT_PUBLIC_INDEXER_URL=https://skillstash-indexer.<your-subdomain>.workers.dev
```

**Important**: Replace `<your-subdomain>` with your actual Cloudflare Workers subdomain from Phase 3.

### 4.2 Test Locally First

```bash
# Navigate to web app
cd apps/web

# Install dependencies (if not already done)
pnpm install

# Build for production
pnpm build

# Test the production build locally
pnpm start

# Open browser to http://localhost:3000
# Verify all pages work
```

### 4.3 Deploy to Vercel

```bash
# From apps/web directory
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? skillstash
# - Directory? ./
# - Override settings? N

# This creates a preview deployment first
```

### 4.4 Configure Environment Variables in Vercel

**Option A: Via CLI**
```bash
vercel env add NEXT_PUBLIC_API_URL
# When prompted, enter: https://skillstash-api.<your-subdomain>.workers.dev

vercel env add NEXT_PUBLIC_INDEXER_URL
# When prompted, enter: https://skillstash-indexer.<your-subdomain>.workers.dev
```

**Option B: Via Vercel Dashboard**
1. Go to https://vercel.com/your-project/settings/environment-variables
2. Add `NEXT_PUBLIC_API_URL`
3. Add `NEXT_PUBLIC_INDEXER_URL`
4. Redeploy

### 4.5 Deploy to Production

```bash
# Deploy to production
vercel --prod

# OUTPUT:
# ✅ Deployed to production!
# URL: https://skillstash.vercel.app
#
# ⚠️ Your app is now live!
```

**Test the Deployment:**
```bash
# Test home page
curl -I https://skillstash.vercel.app

# Should return:
# HTTP/2 200

# Test in browser:
# - Open https://skillstash.vercel.app
# - Verify home page loads
# - Test search functionality
# - Test browse page
# - Test plugin detail page
# - Test import page
```

### 4.6 Configure Custom Domain (Optional)

If you have a custom domain (e.g., skillstack.dev):

**Via Vercel Dashboard:**
1. Go to Project Settings → Domains
2. Add your domain (skillstack.dev)
3. Add www subdomain (www.skillstack.dev)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take up to 24 hours)

**Configure DNS (at your registrar):**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## Phase 5: Publish CLI to npm (15 minutes)

### 5.1 Verify Package Configuration

Check `packages/cli/package.json`:
```json
{
  "name": "@skillstash/cli",
  "version": "1.0.0",
  "description": "CLI for discovering and installing Claude Code plugins",
  "bin": {
    "skillstash": "./dist/index.js"
  },
  // ... rest of config
}
```

### 5.2 Build CLI Package

```bash
# Navigate to CLI package
cd packages/cli

# Clean and rebuild
rm -rf dist
pnpm build

# Verify build output
ls -la dist/
# Should see: index.js, index.d.ts, etc.
```

### 5.3 Test Locally

```bash
# Test the CLI locally
node dist/index.js --version
# Should output: 1.0.0

node dist/index.js search git
# Should search for plugins

node dist/index.js info git-workflow
# Should show plugin info
```

### 5.4 Publish to npm

```bash
# Login to npm (if not already logged in)
npm login

# Publish package
npm publish --access public

# OUTPUT:
# + @skillstash/cli@1.0.0
```

### 5.5 Test Installation

```bash
# In a new terminal/directory
npm install -g @skillstash/cli

# Test installation
skillstash --version
# Should output: 1.0.0

skillstash search git
# Should search registry and display results

# If it works, you're done! 🎉
```

---

## Phase 6: Verification & Testing (1 hour)

### 6.1 Smoke Tests

Run these critical path tests:

```bash
# 1. API Health
curl https://skillstash-api.<your-subdomain>.workers.dev/health
# ✓ Should return: {"status":"ok"}

# 2. API Plugins List
curl https://skillstash-api.<your-subdomain>.workers.dev/api/plugins
# ✓ Should return: JSON array of plugins

# 3. API Plugin Detail
curl https://skillstash-api.<your-subdomain>.workers.dev/api/plugins/git-workflow
# ✓ Should return: Plugin object

# 4. API Search
curl "https://skillstash-api.<your-subdomain>.workers.dev/api/plugins/search?q=git"
# ✓ Should return: Search results

# 5. Indexer Health
curl https://skillstash-indexer.<your-subdomain>.workers.dev/health
# ✓ Should return: {"status":"ok"}

# 6. Indexer Stats
curl https://skillstash-indexer.<your-subdomain>.workers.dev/stats
# ✓ Should return: Stats object

# 7. Web App Home
curl -I https://skillstash.vercel.app
# ✓ Should return: HTTP/2 200

# 8. CLI Search
skillstash search git
# ✓ Should return: Table of plugins

# 9. CLI Info
skillstash info git-workflow
# ✓ Should return: Plugin details

# 10. CLI List
skillstash list
# ✓ Should return: List of installed plugins
```

### 6.2 Web App Manual Testing

Open https://skillstash.vercel.app in browser:

- [ ] Home page loads
- [ ] Search bar works
- [ ] Featured plugins display
- [ ] Browse page shows plugins
- [ ] Filters work
- [ ] Sorting works
- [ ] Plugin detail page loads
- [ ] README renders correctly
- [ ] Tabs work (Skills, Agents, Commands)
- [ ] Install command copies
- [ ] Import page loads
- [ ] Import form validates URLs
- [ ] Search page works
- [ ] Categories page works
- [ ] Dark mode toggles
- [ ] Mobile responsive

### 6.3 Performance Testing

```bash
# Test API response times
time curl https://skillstash-api.<your-subdomain>.workers.dev/api/plugins
# ✓ Should be < 100ms

# Test web page load times
# Open browser DevTools → Network tab
# Reload https://skillstash.vercel.app
# ✓ LCP should be < 2.5s
# ✓ FCP should be < 1s
```

### 6.4 Security Checklist

- [ ] Secrets not in repository (check git history)
- [ ] Environment variables secure (in Vercel/Cloudflare only)
- [ ] HTTPS enforced everywhere
- [ ] CORS configured correctly
- [ ] Input validation on all endpoints
- [ ] No database_id in committed files
- [ ] GitHub token in secrets only

---

## Phase 7: Monitoring Setup (30 minutes)

### 7.1 Vercel Analytics

```bash
# Enable Vercel Analytics in dashboard
# Or via CLI:
vercel analytics enable
```

### 7.2 Cloudflare Analytics

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your workers
4. View analytics and logs

### 7.3 Error Tracking (Optional)

If using Sentry or similar:
```bash
# Install Sentry SDK
pnpm add @sentry/nextjs @sentry/node

# Configure in apps/web/sentry.config.js
# Add SENTRY_DSN to environment variables
```

---

## Troubleshooting

### Issue: "Database not found"

**Solution**: Verify database_id in wrangler.toml files matches your actual database ID.

```bash
# List your databases
wrangler d1 list

# Copy the correct database_id
# Update workers/api/wrangler.toml
# Update workers/indexer/wrangler.toml
# Redeploy workers
```

### Issue: "API returns 500 errors"

**Solution**: Check worker logs.

```bash
# View API worker logs
wrangler tail --env production

# In another terminal, make a request
curl https://skillstash-api.<your-subdomain>.workers.dev/api/plugins

# Check logs for errors
```

### Issue: "No plugins showing on website"

**Solution**: Seed database and/or run indexer.

```bash
# Seed database
wrangler d1 execute skillstash-registry --file=packages/db/src/seed.sql

# Manually trigger indexing
curl https://skillstash-indexer.<your-subdomain>.workers.dev/index

# Verify plugins exist
wrangler d1 execute skillstash-registry --command="SELECT COUNT(*) FROM plugins"
```

### Issue: "CLI can't find plugins"

**Solution**: Check API URL configuration.

```bash
# The CLI uses the API URL from:
# Default: https://api.skillstack.dev (production)
# Or set via: SKILLSTASH_API_URL environment variable

# Set custom API URL:
export SKILLSTASH_API_URL=https://skillstash-api.<your-subdomain>.workers.dev

# Test CLI
skillstash search git
```

### Issue: "Import page not working"

**Solution**: Verify indexer URL in web app environment variables.

```bash
# Check Vercel environment variables
vercel env ls

# Ensure NEXT_PUBLIC_INDEXER_URL is set
# Should be: https://skillstash-indexer.<your-subdomain>.workers.dev

# If missing, add it:
vercel env add NEXT_PUBLIC_INDEXER_URL

# Redeploy
vercel --prod
```

---

## Rollback Procedures

### Rollback Web App

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback
```

### Rollback API Worker

```bash
cd workers/api
wrangler rollback
```

### Rollback Indexer Worker

```bash
cd workers/indexer
wrangler rollback
```

---

## Post-Deployment Checklist

- [ ] All services deployed and running
- [ ] Database seeded with data
- [ ] Smoke tests passing
- [ ] Web app accessible
- [ ] CLI published to npm
- [ ] CLI installation tested
- [ ] Monitoring enabled
- [ ] Error tracking configured
- [ ] Documentation updated with URLs
- [ ] README updated
- [ ] Team notified

---

## Custom Domain Setup (Advanced)

### For skillstack.dev

**1. Configure in Vercel:**
- Add domain in Vercel dashboard
- Get CNAME/A record values

**2. Update DNS:**
```
# At your registrar (e.g., Cloudflare, GoDaddy, etc.)
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**3. Configure Subdomains (Optional):**
```
# api.skillstack.dev → Cloudflare Worker
Type: CNAME
Name: api
Value: skillstash-api.<your-subdomain>.workers.dev
```

**4. Wait for DNS Propagation:**
```bash
# Check DNS propagation
dig skillstack.dev
dig www.skillstack.dev

# Should show your Vercel CNAME
```

---

## Environment Variables Summary

### Web App (.env.local)
```
NEXT_PUBLIC_API_URL=https://skillstash-api.<your-subdomain>.workers.dev
NEXT_PUBLIC_INDEXER_URL=https://skillstash-indexer.<your-subdomain>.workers.dev
```

### API Worker (Cloudflare Secrets)
- Database ID in wrangler.toml
- R2 bucket binding in wrangler.toml

### Indexer Worker (Cloudflare Secrets)
```bash
# Set via wrangler secret put
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
```

---

## Success! 🎉

Your SkillStash deployment is complete!

**URLs:**
- Web App: https://skillstash.vercel.app (or your custom domain)
- API: https://skillstash-api.<your-subdomain>.workers.dev
- Indexer: https://skillstash-indexer.<your-subdomain>.workers.dev

**Next Steps:**
1. Test all functionality
2. Add more plugins (manually or via indexer)
3. Write documentation
4. Announce launch! 🚀

---

**Need Help?**
- Check `/LAUNCH-READINESS.md` for launch checklist
- Review `/project/tasks/007-launch-checklist.md` for detailed launch plan
- Check worker logs: `wrangler tail`
- Review Vercel logs in dashboard
