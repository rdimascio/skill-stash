# Alchemy CI/CD Setup Summary

**Date**: October 18, 2025
**Status**: ✅ Complete

## Overview

The CI/CD pipeline has been configured to support Alchemy's dual-stage deployment strategy with automatic PR preview environments.

## Deployment Stages

### Production Deployment
- **Trigger**: Push to `main` branch
- **Stage Name**: `prod`
- **Resources**:
  - D1 Database: `skillstash-registry`
  - R2 Bucket: `skillstash-cache`
  - Workers: `skillstash-api`, `skillstash-ingester`
- **Custom Domains**:
  - API: `api.skillstash.dev`
  - ingester: `ingester.skillstash.dev`
- **Cron Jobs**: ingester runs daily at 2 AM UTC

### Preview Deployments
- **Trigger**: Pull request opened, reopened, or synchronized
- **Stage Name**: `pr-<number>` (e.g., `pr-42`)
- **Resources**:
  - D1 Database: `skillstash-registry-pr-42`
  - R2 Bucket: `skillstash-cache-pr-42`
  - Workers: `skillstash-api-pr-42`, `skillstash-ingester-pr-42`
- **Custom Domains**: None (uses workers.dev URLs)
- **Cron Jobs**: Disabled for preview environments
- **Cleanup**: Automatically destroyed when PR closes

## GitHub Actions Workflow

### File Updated
- `.github/workflows/deploy-workers.yml`

### Jobs

#### 1. `deploy-production`
- **Condition**: Push to `main` branch
- **Steps**:
  1. Checkout code
  2. Setup Node.js 20
  3. Setup pnpm 8
  4. Install dependencies
  5. Build workers
  6. Deploy with Alchemy (`pnpm dlx alchemy deploy`)

#### 2. `deploy-preview`
- **Condition**: Pull request opened/reopened/synchronized
- **Permissions**:
  - `pull-requests: write` (for posting comments)
  - `contents: read`
- **Steps**: Same as production, but with preview stage

#### 3. `cleanup-preview`
- **Condition**: Pull request closed
- **Steps**: Destroy preview environment with `pnpm dlx alchemy destroy`

### Concurrency Control
```yaml
concurrency:
  group: deploy-workers-${{ github.ref }}
  cancel-in-progress: false
```
Prevents simultaneous deployments for the same branch/PR.

## Required GitHub Secrets

### Cloudflare Authentication
| Secret | Description | How to Get |
|--------|-------------|------------|
| `CLOUDFLARE_API_TOKEN` | API token with Workers, D1, R2 permissions | https://dash.cloudflare.com/profile/api-tokens |
| `CLOUDFLARE_EMAIL` | Cloudflare account email | Your account email |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | Dashboard URL or `wrangler whoami` |

### Alchemy State Management
| Secret | Description | How to Generate |
|--------|-------------|-----------------|
| `ALCHEMY_PASSWORD` | Encryption password for state | `openssl rand -base64 32` |
| `ALCHEMY_STATE_TOKEN` | State management token | `openssl rand -hex 32` |

### GitHub Integration
| Secret | Description | Note |
|--------|-------------|------|
| `GITHUB_TOKEN` | For ingester and PR comments | Automatically provided by GitHub Actions |

## Alchemy Script Configuration

### File: `alchemy.run.ts`

#### Plugins Configured

**CloudflareStateStore**
```typescript
CloudflareStateStore({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  password: process.env.ALCHEMY_PASSWORD,
  stateToken: process.env.ALCHEMY_STATE_TOKEN,
})
```
Persists deployment state across runs and environments.

**GitHubComment** (Preview Only)
```typescript
GitHubComment({
  token: process.env.GITHUB_TOKEN,
  pullRequest: process.env.PULL_REQUEST,
  sha: process.env.GITHUB_SHA,
})
```
Posts deployment URLs as PR comments with each push.

#### Resource Naming Strategy
- **Production**: Resources have no suffix (e.g., `skillstash-registry`)
- **Preview**: Resources have `-pr-<number>` suffix (e.g., `skillstash-registry-pr-42`)

#### Environment Detection
```typescript
const stage = process.env.STAGE || "prod";
const isProd = stage === "prod";
const isPreview = stage.startsWith("pr-");
```

#### Feature Flags by Stage
- **Custom Domains**: Production only
- **Cron Jobs**: Production only
- **GitHub Comments**: Preview only

## PR Preview Comment Format

When a PR is deployed, Alchemy automatically posts/updates a comment:

```markdown
## 🚀 Preview Deployment Ready

Your worker preview environment has been deployed for PR #42

### Endpoints
- **API Worker**: https://skillstash-api-pr-42.your-subdomain.workers.dev
- **ingester Worker**: https://skillstash-ingester-pr-42.your-subdomain.workers.dev

### Resources
- **Database**: `skillstash-registry-pr-42`
- **Cache**: `skillstash-cache-pr-42`

### Stage
`pr-42`

---
*Commit: abc1234*
```

## Documentation Updated

### 1. `DEPLOYMENT.md`
- Added `CLOUDFLARE_ACCOUNT_ID` to required secrets
- Updated `GH_TOKEN` to `GITHUB_TOKEN` (consistent naming)
- Added note that `GITHUB_TOKEN` is automatically provided
- Added details about PR preview environments
- Added note about isolated resources per preview

### 2. `INFRASTRUCTURE.md`
- Updated secrets section with Alchemy requirements
- Added `CLOUDFLARE_ACCOUNT_ID`, `ALCHEMY_PASSWORD`, `ALCHEMY_STATE_TOKEN`
- Clarified `GITHUB_TOKEN` is auto-provided

### 3. `SETUP-CHECKLIST.md`
- Updated Cloudflare secrets section with all Alchemy requirements
- Added commands to generate secure passwords/tokens
- Clarified `GITHUB_TOKEN` setup not needed

## Testing the Setup

### Local Testing
```bash
# Set environment variables
export CLOUDFLARE_API_TOKEN="your-token"
export CLOUDFLARE_EMAIL="your-email"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export ALCHEMY_PASSWORD="your-password"
export ALCHEMY_STATE_TOKEN="your-state-token"
export GITHUB_TOKEN="your-github-token"
export STAGE="prod"
export ENVIRONMENT="production"

# Deploy with Alchemy
pnpm dlx alchemy deploy
```

### Testing PR Previews
1. Create a test branch
2. Make changes to workers
3. Open pull request
4. Wait for `deploy-preview` job to complete
5. Check PR for deployment comment
6. Test preview URLs
7. Close PR and verify `cleanup-preview` runs

## Troubleshooting

### "State not found" error
- Verify `ALCHEMY_STATE_TOKEN` is set correctly
- Ensure `CloudflareStateStore` plugin is configured

### "Authentication failed" error
- Check `CLOUDFLARE_API_TOKEN` has correct permissions
- Verify `CLOUDFLARE_ACCOUNT_ID` matches your account

### Preview comment not posted
- Verify `GITHUB_TOKEN` secret exists (should be automatic)
- Check job has `pull-requests: write` permission
- Ensure `PULL_REQUEST` and `GITHUB_SHA` environment variables are set

### Resources not cleaned up
- Check `cleanup-preview` job ran successfully
- Manually destroy: `pnpm dlx alchemy destroy --stage pr-<number> --force`

## Maintenance

### Rotating Secrets
To rotate Alchemy secrets:
1. Generate new password/token
2. Update GitHub secret
3. Update local `.env` if used
4. Next deployment will use new credentials

### Monitoring Deployments
- View workflow runs: Repository → Actions tab
- View worker logs: `wrangler tail <worker-name>`
- View Alchemy state: Cloudflare Dashboard → Workers & Pages

## Benefits of This Setup

1. **Isolated Testing**: Each PR gets its own isolated environment
2. **Automatic Cleanup**: Preview environments destroyed when PR closes
3. **Cost Efficiency**: Preview resources only exist during PR lifecycle
4. **Fast Feedback**: Deployments happen automatically on every push
5. **State Management**: Alchemy tracks resource state across deployments
6. **Visibility**: PR comments provide instant access to preview URLs

## Next Steps

1. Configure GitHub secrets in repository settings
2. Test deployment by merging to `main`
3. Test PR preview by opening a pull request
4. Monitor logs and verify deployments
5. Update custom domains if needed (production only)

## References

- Alchemy Documentation: https://alchemy.sh/docs
- GitHub Actions: https://docs.github.com/en/actions
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Repository Workflow: `.github/workflows/deploy-workers.yml`
- Alchemy Script: `alchemy.run.ts`
