# Task Assignment 006: Infrastructure Setup

**Date**: October 18, 2025
**Assigned to**: DevOps Infrastructure Engineer
**Priority**: CRITICAL
**Estimated Duration**: 2-3 days
**Status**: ASSIGNED

## Task Overview

Set up the complete infrastructure for SkillStash including monorepo structure, Cloudflare resources, deployment pipelines, and development environment.

## Task Specification

**Reference**: `/Users/rdimascio/p/skill-stash/project/tasks/006-project-setup.md`

Please review the complete task specification in the file above for detailed implementation requirements.

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
- Create feature branch: `feat/infrastructure-setup`
- Commit frequently (every 20-30 minutes)
- Use conventional commits: `type(scope): description`

### Commit Examples
```
feat(infra): initialize pnpm monorepo structure
feat(infra): configure turborepo pipeline
feat(cloudflare): create d1 database
feat(cloudflare): set up r2 bucket
feat(ci): add github actions workflows
chore(env): configure environment variables
docs(readme): update setup instructions
```

### Pull Request Creation
When work is complete:
- Use git skill to create PR
- Never push to main directly
- Include description of infrastructure setup
- List all resources created

## Key Deliverables

### 1. Monorepo Structure
- [ ] Root `package.json` with workspace configuration
- [ ] `pnpm-workspace.yaml` defining workspace packages
- [ ] `turbo.json` with build pipeline configuration
- [ ] Directory structure: `apps/*`, `packages/*`, `workers/*`

### 2. Cloudflare Resources
- [ ] D1 database: `skillstash-registry` (provide database ID)
- [ ] R2 bucket: `skillstash-cache` (provide bucket name)
- [ ] Wrangler configuration for both workers
- [ ] Environment secrets configured

### 3. Shared Configuration
- [ ] `packages/config/tsconfig.base.json` - Base TypeScript config
- [ ] `packages/shared/` - Shared types package
- [ ] ESLint and Prettier configuration
- [ ] Git ignore files

### 4. GitHub Actions Workflows
- [ ] `.github/workflows/deploy-web.yml` - Deploy Next.js app to Vercel
- [ ] `.github/workflows/deploy-workers.yml` - Deploy Cloudflare Workers
- [ ] `.github/workflows/publish-cli.yml` - Publish CLI to npm
- [ ] Repository secrets configured

### 5. Environment Configuration
- [ ] `apps/web/.env.local.example` - Web app environment template
- [ ] `workers/api/.dev.vars.example` - API worker environment template
- [ ] `workers/ingester/.dev.vars.example` - ingester worker environment template

### 6. Documentation
- [ ] Root `README.md` - Project overview and setup instructions
- [ ] Development setup guide
- [ ] Deployment instructions

## Critical Handoffs

After completing infrastructure setup, you MUST provide:

### For Backend Infrastructure Specialist (Task 001)
- **D1 Database ID**: The database identifier from Cloudflare
- **D1 Database Name**: `skillstash-registry`
- **How to access**: Wrangler commands for migrations

### For All Developers
- **R2 Bucket Name**: `skillstash-cache`
- **Monorepo Commands**: How to run/build/test
- **Environment Setup**: How to configure local development

### For CLI and Frontend Teams
- **API Base URL** (after API is deployed): To be provided later

## Dependencies

**Blocked by**: None (this is the first task)

**Blocks**:
- Task 001 (Database Schema) - needs D1 database ID
- Task 002 (ingester Service) - needs infrastructure
- Task 003 (Registry API) - needs infrastructure
- Task 004 (CLI Tool) - needs monorepo structure
- Task 005 (Web Frontend) - needs monorepo structure

## Success Criteria

- [ ] Monorepo structure created and pnpm install works
- [ ] Turborepo builds all packages successfully
- [ ] Cloudflare D1 database created and accessible
- [ ] Cloudflare R2 bucket created and accessible
- [ ] GitHub Actions workflows configured and passing
- [ ] All environment variables documented
- [ ] Development environment tested and working
- [ ] Infrastructure documentation complete
- [ ] **Git workflow followed**: feature branch, frequent commits, PR created
- [ ] **No direct commits to main**
- [ ] **Status report saved** to `project/reports/`

## Testing Checklist

Before marking this task complete, verify:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Verify Turborepo is working
pnpm turbo run build --dry-run

# Test D1 connection
cd workers/api
pnpm exec wrangler d1 info skillstash-registry

# Test R2 bucket
pnpm exec wrangler r2 bucket list

# Verify GitHub Actions syntax
# Push to feature branch and check Actions tab
```

## Timeline

**Day 1**:
- Create monorepo structure
- Configure pnpm workspaces and Turborepo
- Set up shared packages

**Day 2**:
- Create Cloudflare D1 database
- Create R2 bucket
- Configure wrangler for workers

**Day 3**:
- Set up GitHub Actions workflows
- Configure environment variables
- Test full infrastructure
- Create PR and handoff

## Support & Questions

If you encounter blockers:
1. Document the blocker in your status report
2. Try alternative approaches
3. Escalate to Project Manager if unresolved

## Reporting Requirements

Save daily progress to:
- `project/reports/2025-10-18-devops-status.md`
- `project/reports/2025-10-19-devops-status.md`
- etc.

Include:
- What you completed
- What you're working on
- Any blockers
- Information for handoffs

---

## Ready to Start

1. Read complete task specification: `project/tasks/006-project-setup.md`
2. Activate git skill: `/git`
3. Create feature branch: `feat/infrastructure-setup`
4. Begin with monorepo structure
5. Commit every 20-30 minutes
6. Report progress daily

**REMEMBER**: Use `/git` skill for all version control operations. Never commit directly to main.

Let's build the foundation for SkillStash!
