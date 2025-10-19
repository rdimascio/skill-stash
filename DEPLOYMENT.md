# SkillStash Deployment Guide

Complete step-by-step guide to deploy SkillStash to production.

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Node.js 18+ installed
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] Cloudflare account created
- [ ] Wrangler CLI installed (`npm install -g wrangler`)
- [ ] Vercel account created
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] GitHub personal access token (for indexer)
- [ ] Domain purchased (optional, for custom domain)

---

## Phase 1: Cloudflare Setup (15 minutes)

### 1.1 Authenticate with Cloudflare

```bash
# Login to Cloudflare
wrangler login

# This opens a browser window to authenticate
# Grant the necessary permissions
```

### 1.2 Create D1 Database

```bash
# Create the database
wrangler d1 create skillstash-registry

# OUTPUT will look like:
# ✅ Successfully created DB 'skillstash-registry'
#
# [[d1_databases]]
# binding = "DB"
# database_name = "skillstash-registry"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
#
# ⚠️ SAVE THIS database_id - you'll need it!
```

**Important**: Copy the `database_id` from the output. You'll need this in the next step.

### 1.3 Create R2 Bucket

```bash
# Create the R2 bucket for caching
wrangler r2 bucket create skillstash-cache

# OUTPUT:
# ✅ Created bucket 'skillstash-cache'
```

### 1.4 Update Configuration Files

Update the `database_id` in **BOTH** wrangler configuration files:

**File 1**: `workers/api/wrangler.toml`
```toml
[[d1_databases]]
binding = "DB"
database_name = "skillstash-registry"
database_id = "your-actual-database-id-here"  # ← Replace with your ID
```

**File 2**: `workers/indexer/wrangler.toml`
```toml
[[d1_databases]]
binding = "DB"
database_name = "skillstash-registry"
database_id = "your-actual-database-id-here"  # ← Replace with your ID
```

### 1.5 Configure GitHub Token Secret

Create a GitHub personal access token:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it these permissions:
   - `public_repo` (Access public repositories)
4. Copy the token

Set it as a secret in Cloudflare:
```bash
# For the indexer worker
cd workers/indexer
wrangler secret put GITHUB_TOKEN

# Paste your GitHub token when prompted
# Press Enter
```

---

## Phase 2: Database Setup (30 minutes)

### 2.1 Generate Drizzle Migrations

```bash
# From project root
pnpm install

# Generate migrations from schema
pnpm --filter @skillstash/db exec drizzle-kit generate:sqlite

# This creates migration files in packages/db/migrations/
```

### 2.2 Apply Migrations to Production Database

```bash
# Push schema to D1 database
pnpm --filter @skillstash/db exec drizzle-kit push:sqlite

# When prompted, confirm you want to apply to production
```

### 2.3 Seed Database with Initial Data

```bash
# Load seed data (sample plugins)
wrangler d1 execute skillstash-registry --file=packages/db/src/seed.sql

# OUTPUT:
# ✅ Executed SQL successfully
```

### 2.4 Verify Database Setup

```bash
# Check that tables were created
wrangler d1 execute skillstash-registry --command="SELECT name FROM sqlite_master WHERE type='table'"

# Should output:
# plugins, plugin_versions, plugin_tags, skills, agents,
# commands, mcp_servers, authors, download_stats, etc.

# Check that seed data loaded
wrangler d1 execute skillstash-registry --command="SELECT COUNT(*) FROM plugins"

# Should output a count > 0
```

---

## Phase 3: Deploy Backend Workers (30 minutes)

### 3.1 Build All Packages

```bash
# From project root
pnpm build

# This builds:
# - packages/db
# - packages/shared
# - workers/api
# - workers/indexer
# - packages/cli
# - apps/web
```

### 3.2 Deploy API Worker

```bash
# Navigate to API worker
cd workers/api

# Deploy to Cloudflare
wrangler deploy

# OUTPUT:
# ✨ Deployment complete!
# URL: https://skillstash-api.<your-subdomain>.workers.dev
#
# ⚠️ SAVE THIS URL - you'll need it for the web app
```

**Test the API:**
```bash
# Test health endpoint
curl https://skillstash-api.<your-subdomain>.workers.dev/health

# Should return:
# {"status":"ok"}

# Test plugins endpoint
curl https://skillstash-api.<your-subdomain>.workers.dev/api/plugins

# Should return JSON with plugins
```

### 3.3 Deploy Indexer Worker

```bash
# Navigate to indexer worker
cd ../indexer

# Deploy to Cloudflare
wrangler deploy

# OUTPUT:
# ✨ Deployment complete!
# URL: https://skillstash-indexer.<your-subdomain>.workers.dev
#
# ⚠️ SAVE THIS URL - you'll need it for the web app
```

**Test the Indexer:**
```bash
# Test health endpoint
curl https://skillstash-indexer.<your-subdomain>.workers.dev/health

# Should return:
# {"status":"ok"}

# Test indexer stats
curl https://skillstash-indexer.<your-subdomain>.workers.dev/stats

# Should return stats about indexed plugins
```

### 3.4 Trigger Initial Indexing (Optional)

```bash
# Manually trigger indexing to populate database
curl -X GET https://skillstash-indexer.<your-subdomain>.workers.dev/index

# This will search GitHub for plugins with "claude-code" or "claude-plugin" topics
# and index any that have .claude-plugin/marketplace.json files

# Check progress
curl https://skillstash-indexer.<your-subdomain>.workers.dev/stats
```

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

If you have a custom domain (e.g., skillstash.com):

**Via Vercel Dashboard:**
1. Go to Project Settings → Domains
2. Add your domain (skillstash.com)
3. Add www subdomain (www.skillstash.com)
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
# Default: https://api.skillstash.com (production)
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

### For skillstash.com

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
# api.skillstash.com → Cloudflare Worker
Type: CNAME
Name: api
Value: skillstash-api.<your-subdomain>.workers.dev
```

**4. Wait for DNS Propagation:**
```bash
# Check DNS propagation
dig skillstash.com
dig www.skillstash.com

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
