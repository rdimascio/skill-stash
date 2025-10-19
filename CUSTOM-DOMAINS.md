# Custom Domains Setup for SkillStash

This guide explains how to configure custom domains for SkillStash workers.

## Configured Domains

The following custom domains are configured in `alchemy.run.ts`:

- **API Worker**: `api.skillstash.com`
- **Indexer Worker**: `indexer.skillstash.com`
- **Web App** (future): `skillstash.com` or `www.skillstash.com`

## DNS Configuration Required

### Prerequisites

1. Domain `skillstash.com` registered and active
2. Domain nameservers pointed to Cloudflare
3. Cloudflare account has access to the domain

### DNS Records Setup

#### Option 1: Domain on Cloudflare

If your domain is already managed by Cloudflare:

1. **Alchemy will automatically provision the domains** when you run `alchemy deploy`
2. TLS certificates are automatically issued and managed
3. No manual DNS configuration needed!

#### Option 2: External DNS Provider

If your domain DNS is managed elsewhere (not recommended):

Add CNAME records pointing to your workers:

```
Type: CNAME
Name: api
Target: skillstash-api.your-subdomain.workers.dev
Proxy: No (if external) / Yes (if Cloudflare)

Type: CNAME
Name: indexer
Target: skillstash-indexer.your-subdomain.workers.dev
Proxy: No (if external) / Yes (if Cloudflare)
```

**Note**: Using Cloudflare for DNS is strongly recommended for automatic provisioning.

## Deployment Process

### 1. First Deployment

When you first run `alchemy deploy`, Alchemy will:

1. Create the custom domain bindings in Cloudflare
2. Provision TLS certificates automatically
3. Configure routing to your workers
4. Output both custom domain and workers.dev URLs

### 2. Verify Deployment

After deployment, test both URLs:

```bash
# Test custom domain
curl https://api.skillstash.com/health

# Test workers.dev fallback
curl https://skillstash-api.your-subdomain.workers.dev/health

# Both should return: {"status":"ok"}
```

### 3. Update Environment Variables

After deployment, update your web app environment variables:

**`.env` (for Alchemy deployment)**:
```bash
NEXT_PUBLIC_API_URL=https://api.skillstash.com
NEXT_PUBLIC_INDEXER_URL=https://indexer.skillstash.com
```

## Domain Verification

### Check Domain Status

After deployment, verify domains are active:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Select your worker (e.g., `skillstash-api`)
4. Check **Settings** → **Domains**
5. Verify custom domain is listed and active

### Troubleshooting

#### Domain Not Resolving

**Problem**: `api.skillstash.com` returns DNS error

**Solutions**:
1. Verify domain nameservers point to Cloudflare
2. Check domain is in "Active" status in Cloudflare dashboard
3. Wait up to 24 hours for DNS propagation (usually faster)
4. Try clearing DNS cache: `sudo dscacheutil -flushcache` (macOS)

#### Certificate Errors

**Problem**: SSL/TLS certificate errors when accessing custom domain

**Solutions**:
1. Wait for certificate provisioning (usually 5-10 minutes)
2. Verify domain ownership in Cloudflare
3. Check certificate status in Cloudflare dashboard
4. Alchemy automatically handles certificate renewal

#### 522 Connection Errors

**Problem**: Cloudflare returns "Connection timed out" error

**Solutions**:
1. Verify worker is deployed: `wrangler deployments list`
2. Check worker is responding: Test workers.dev URL first
3. Verify custom domain binding: Check Cloudflare dashboard
4. Redeploy with Alchemy: `alchemy deploy`

## Fallback URLs

Workers are always accessible via both URLs:

**Primary** (Custom Domain):
- `https://api.skillstash.com`
- `https://indexer.skillstash.com`

**Fallback** (Workers.dev):
- `https://skillstash-api.your-subdomain.workers.dev`
- `https://skillstash-indexer.your-subdomain.workers.dev`

Use workers.dev URLs for testing and as fallback if custom domains have issues.

## Future: Web App Domain

When the web app is migrated to TanStack Start (Task 009), add:

```typescript
// In alchemy.run.ts
const webApp = await TanStackStart("skillstash-web", {
  path: "./apps/web",
  domains: ["skillstash.com", "www.skillstash.com"],
  vars: {
    NEXT_PUBLIC_API_URL: apiWorker.url,
    NEXT_PUBLIC_INDEXER_URL: indexerWorker.url,
  },
});
```

## Security Considerations

### TLS/SSL

- ✅ Automatic TLS certificate provisioning
- ✅ Automatic certificate renewal
- ✅ HTTPS enforced by default
- ✅ Modern TLS protocols (1.2+)

### Domain Ownership

- ⚠️ Ensure domain is registered to you/your organization
- ⚠️ Keep Cloudflare account secure (2FA enabled)
- ⚠️ Limit access to production domain configuration

### API Security

Even with custom domains, ensure:
- CORS properly configured
- Rate limiting enabled
- Input validation on all endpoints
- Authentication for sensitive operations

## Cost

Custom domains on Cloudflare Workers:

- **Workers Free Tier**: Included, no additional cost
- **Workers Paid Tier**: Included, no additional cost
- **DNS**: Free when using Cloudflare DNS

**Total Additional Cost**: $0/month 🎉

## References

- [Alchemy Custom Domains](https://alchemy.run/providers/cloudflare/worker/#custom-domains)
- [Cloudflare Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare DNS Setup](https://developers.cloudflare.com/dns/zone-setups/)

---

**Last Updated**: October 18, 2025
