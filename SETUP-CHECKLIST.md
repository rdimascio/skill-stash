# SkillStash Infrastructure Setup Checklist

This checklist will guide you through the one-time setup required to get SkillStash infrastructure running.

## ✅ Phase 1: Authentication & Accounts (5 minutes)

### 1.1 Cloudflare Authentication
```bash
wrangler login
```
- Opens browser for authentication
- Verify success: `wrangler whoami`

### 1.2 Verify Other Accounts
- [ ] GitHub account with repository access
- [ ] Vercel account (for web deployment)
- [ ] npm account (for CLI publishing)

## ✅ Phase 2: Cloudflare Infrastructure (10 minutes)

### 2.1 Create D1 Database
```bash
wrangler d1 create skillstash-registry
```

**CRITICAL**: Copy the `database_id` from the output.

### 2.2 Update Wrangler Configurations
Update the `database_id` in **BOTH** files:

**File 1**: `workers/api/wrangler.toml`
```toml
[[d1_databases]]
binding = "DB"
database_name = "skillstash-registry"
database_id = "PASTE_YOUR_DATABASE_ID_HERE"
```

**File 2**: `workers/indexer/wrangler.toml`
```toml
[[d1_databases]]
binding = "DB"
database_name = "skillstash-registry"
database_id = "PASTE_YOUR_DATABASE_ID_HERE"
```

### 2.3 Create R2 Bucket
```bash
wrangler r2 bucket create skillstash-cache
```

### 2.4 Verify Infrastructure
```bash
# Verify database exists
wrangler d1 list

# Verify bucket exists
wrangler r2 bucket list
```

## ✅ Phase 3: Environment Variables (5 minutes)

### 3.1 Web App Environment
```bash
cd apps/web
cp .env.example .env.local
```

Edit `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### 3.2 API Worker Environment
```bash
cd workers/api
cp .dev.vars.example .dev.vars
```

No changes needed for local development.

### 3.3 Indexer Worker Environment
```bash
cd workers/indexer
cp .dev.vars.example .dev.vars
```

Edit `workers/indexer/.dev.vars` and add your GitHub token:
```env
ENVIRONMENT=development
GITHUB_TOKEN=ghp_your_token_here
```

**How to create GitHub token**:
1. Visit: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `public_repo`, `read:user`
4. Generate and copy token
5. Paste into `.dev.vars`

## ✅ Phase 4: GitHub Secrets (10 minutes)

Configure these in your repository: Settings > Secrets and variables > Actions

### 4.1 Vercel Deployment Secrets
```
VERCEL_TOKEN          → Get from https://vercel.com/account/tokens
VERCEL_ORG_ID         → Run: cd apps/web && vercel link
VERCEL_PROJECT_ID     → Found in: apps/web/.vercel/project.json
NEXT_PUBLIC_API_URL   → https://api.skillstash.com (production)
```

### 4.2 Cloudflare Deployment Secrets
```
CLOUDFLARE_API_TOKEN  → Create at dash.cloudflare.com/profile/api-tokens
                        Required permissions: Workers Scripts (Edit), D1 (Edit), Workers R2 (Edit)
GH_TOKEN              → Same as indexer GITHUB_TOKEN above
```

### 4.3 npm Publishing Secret
```
NPM_TOKEN            → Get from https://www.npmjs.com/settings/YOUR_USERNAME/tokens
                       (Automation token type)
```

## ✅ Phase 5: Database Setup (WAIT FOR BACKEND AGENT)

**DO NOT DO THIS YET** - The Backend Agent will:
1. Create the database schema (`workers/api/schema.sql`)
2. Create migration files
3. Notify you when ready

Once notified:
```bash
# Apply migrations locally
pnpm db:migrate:local

# Apply migrations to production
pnpm db:migrate
```

## ✅ Phase 6: Verification (5 minutes)

### 6.1 Install Dependencies
```bash
pnpm install
```

### 6.2 Verify Build
```bash
pnpm build
```
Should complete without errors.

### 6.3 Test Local Development
```bash
# In separate terminals:

# Terminal 1: API Worker
pnpm dev:api

# Terminal 2: Web App
pnpm dev:web

# Terminal 3: Indexer Worker (optional)
pnpm dev:indexer
```

### 6.4 Verify Services
- API Worker: http://localhost:8787
- Web App: http://localhost:3000

## ✅ Phase 7: DNS Configuration (Optional - Production Only)

Only needed when deploying to production:

1. Go to Cloudflare DNS settings
2. Add records:
   - `A @ <Vercel IP>` (Proxied)
   - `CNAME api skillstash-api.workers.dev` (Proxied)
   - `CNAME www skillstash.com` (Proxied)

## 🎯 Quick Reference

### Development Commands
```bash
pnpm dev              # Run all services
pnpm dev:web          # Web app only
pnpm dev:api          # API worker only
pnpm dev:indexer      # Indexer worker only
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint all code
pnpm typecheck        # Type check all code
```

### Deployment Commands
```bash
pnpm deploy:web       # Deploy web to Vercel
pnpm deploy:api       # Deploy API worker
pnpm deploy:indexer   # Deploy indexer worker
pnpm deploy:workers   # Deploy both workers
```

### Database Commands
```bash
pnpm db:migrate:local  # Local migrations
pnpm db:migrate        # Production migrations
pnpm db:seed:local     # Local seed data
pnpm db:seed           # Production seed data
```

## 🚨 Common Issues

### "Not logged in" error
```bash
wrangler login
```

### "Database not found" error
- Verify database_id is set in both `wrangler.toml` files
- Run: `wrangler d1 list` to see your databases

### Build fails
```bash
pnpm clean
pnpm install
pnpm build
```

### GitHub Actions failing
- Verify all secrets are configured
- Check workflow logs for specific errors

## 📝 Handoff Checklist

Ready to hand off to Backend Agent when:
- [x] Infrastructure configurations complete
- [x] D1 database created and ID documented
- [x] R2 bucket created
- [x] Environment variable templates created
- [x] Build passing locally
- [ ] Database ID shared with Backend Agent

**DATABASE ID TO SHARE**: (copy from Phase 2.1 output)
```
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## 📚 Additional Resources

- Full infrastructure guide: `INFRASTRUCTURE.md`
- Project documentation: `PROJECT.md`
- Claude instructions: `CLAUDE.md`
- Task details: `project/reports/2025-10-18-task-assignment-006-devops.md`

## ✅ Setup Complete!

Once all phases are complete, you're ready to start development.

**Next Steps**:
1. Backend Agent will create database schema
2. Frontend Agent will build the web interface
3. CLI Agent will implement the command-line tool
4. QA Agent will test everything

Happy coding! 🚀
