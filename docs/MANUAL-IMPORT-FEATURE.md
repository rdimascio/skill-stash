# Manual Plugin Import Feature

## Overview

Allow users to manually submit their GitHub repositories for immediate indexing, rather than waiting for the daily automated cron job.

## Current Implementation Status

✅ **Backend Already Implemented!**

The ingester worker already has a manual import endpoint:

```http
POST https://ingester.skillstash.com/index/:owner/:repo
```

**Example**:
```bash
curl -X POST https://ingester.skillstash.com/index/anthropics/claude-code-git
```

**Response (Success)**:
```json
{
  "success": true,
  "pluginId": "anthropics-claude-code-git",
  "message": "Successfully indexed anthropics/claude-code-git"
}
```

**Response (Error - No marketplace.json)**:
```json
{
  "success": false,
  "error": "No marketplace.json found",
  "message": "Repository must contain .claude-plugin/marketplace.json"
}
```

**Response (Error - Invalid marketplace.json)**:
```json
{
  "success": false,
  "error": "Invalid marketplace.json",
  "errors": [
    {
      "path": ["version"],
      "message": "Invalid semver format"
    }
  ]
}
```

## What's Missing: Frontend UI

Need to add this to **Task 005 (Web Frontend)**:

### 1. Import Page UI

**Route**: `/import` or `/publish`

**Components Needed**:
- GitHub URL input field
- "Import Plugin" button
- Real-time validation feedback
- Success/error messages
- Link to plugin page after success

**Example UI Flow**:

```
┌─────────────────────────────────────────────────┐
│  Add Your Plugin to SkillStash                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  GitHub Repository URL                          │
│  ┌───────────────────────────────────────────┐ │
│  │ https://github.com/owner/repo             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [Import Plugin] ← Button                      │
│                                                 │
│  ✓ Your repository will be validated           │
│  ✓ Marketplace.json will be checked            │
│  ✓ Plugin will appear immediately              │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Success State**:
```
┌─────────────────────────────────────────────────┐
│  ✅ Plugin Imported Successfully!                │
├─────────────────────────────────────────────────┤
│                                                 │
│  git-workflow has been added to SkillStash      │
│                                                 │
│  [View Plugin] [Import Another]                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Error State**:
```
┌─────────────────────────────────────────────────┐
│  ❌ Import Failed                                │
├─────────────────────────────────────────────────┤
│                                                 │
│  No marketplace.json found                      │
│                                                 │
│  Your repository must contain:                  │
│  .claude-plugin/marketplace.json                │
│                                                 │
│  📖 [Read Documentation]                        │
│  [Try Again]                                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2. API Client Integration

Create API client in web app:

```typescript
// apps/web/src/lib/api.ts

export async function importPlugin(repoUrl: string) {
  // Parse GitHub URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub URL');
  }

  const [, owner, repo] = match;

  // Call ingester endpoint
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_ingester_URL}/index/${owner}/${repo}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Import failed');
  }

  return await response.json();
}
```

### 3. Plugin Validation Preview (Nice to Have)

Before import, check if marketplace.json exists:

```typescript
// Validate endpoint (doesn't save to DB)
POST /validate/:owner/:repo

Response:
{
  "valid": true,
  "marketplace": { /* parsed data */ },
  "preview": {
    "name": "git-workflow",
    "description": "...",
    "skills": 1,
    "agents": 2,
    "commands": 3
  }
}
```

This lets users see what will be imported before committing.

## User Journey

### Happy Path
1. User creates `.claude-plugin/marketplace.json` in their repo
2. User goes to skillstash.com/import
3. User pastes GitHub URL
4. Click "Import Plugin"
5. ✅ Success message appears
6. Plugin is live immediately
7. User can share plugin link

### Error Path: Missing File
1. User pastes GitHub URL
2. Click "Import Plugin"
3. ❌ Error: "No marketplace.json found"
4. Show helpful error with documentation link
5. User adds marketplace.json to their repo
6. User tries again → Success

### Error Path: Invalid Schema
1. User pastes GitHub URL with malformed JSON
2. Click "Import Plugin"
3. ❌ Error: "Invalid marketplace.json"
4. Show specific validation errors:
   - "version: Must be valid semver (e.g. 1.0.0)"
   - "description: Must be at least 10 characters"
5. User fixes JSON in their repo
6. User tries again → Success

## Security & Rate Limiting

### Rate Limiting Strategy

**Problem**: Users could spam the import endpoint

**Solution**: Rate limit by IP address

```typescript
// Cloudflare Workers rate limiting
app.post('/index/:owner/:repo', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const key = `ratelimit:import:${ip}`;

  // Check rate limit (10 imports per hour per IP)
  const count = await c.env.CACHE.get(key);
  if (count && parseInt(count) >= 10) {
    return c.json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Maximum 10 imports per hour. Try again later.'
    }, 429);
  }

  // Increment counter
  const newCount = (parseInt(count || '0') + 1).toString();
  await c.env.CACHE.put(key, newCount, {
    expirationTtl: 3600 // 1 hour
  });

  // ... rest of import logic
});
```

### Authentication (Future Enhancement)

For v2, require GitHub OAuth:
- Prevents abuse
- Allows user-specific rate limits
- Enables "My Plugins" dashboard
- Can verify repo ownership

## Benefits

✅ **Instant Publishing**: No wait for daily cron
✅ **Immediate Feedback**: Validation errors shown immediately
✅ **Better UX**: Users control when their plugin goes live
✅ **Lower Barrier**: Don't need to add GitHub topics
✅ **Testing**: Authors can test before announcing

## Implementation Priority

**Phase 1 (MVP - Essential)**: ✅ Backend done, needs frontend
- Basic import form
- Success/error messages
- Link to documentation

**Phase 2 (Polish)**:
- Validation preview before import
- Better error messages with examples
- Rate limiting UI feedback

**Phase 3 (Advanced)**:
- GitHub OAuth integration
- "My Plugins" dashboard
- Auto-update webhooks
- Analytics for plugin authors

## Task Updates

### Add to Task 005 (Web Frontend)

Update task scope to include:

**New Feature: Manual Plugin Import**
- Import page at `/import` route
- GitHub URL input with validation
- Call ingester POST endpoint
- Success/error handling
- Link to documentation
- Responsive design

**Acceptance Criteria**:
- [ ] Import form component created
- [ ] API integration with ingester
- [ ] Error handling with helpful messages
- [ ] Success redirect to plugin page
- [ ] Mobile responsive
- [ ] Loading states
- [ ] Documentation link

### Add to Task 007 (Launch Checklist)

**Pre-Launch**:
- [ ] Test import with valid plugin
- [ ] Test import with missing marketplace.json
- [ ] Test import with invalid JSON
- [ ] Test rate limiting
- [ ] Document import process in help docs

## Cost Impact

**Negligible**: Manual imports use same infrastructure as cron
- Each import: ~2 API calls (get repo info + marketplace.json)
- With rate limiting (10/hour per IP): Max ~240 imports/day
- Well within free tier limits

## Metrics to Track

Post-launch, monitor:
- `import_attempts_total` - How many people try to import
- `import_success_rate` - Success vs errors
- `import_error_types` - Common validation errors
- `time_to_import` - Performance metric

This helps identify:
- Common mistakes (improve documentation)
- Performance issues
- Abuse patterns

## Recommendation

**Add this to Task 005 scope immediately!**

This is a critical feature for user adoption. The backend is already done, just needs ~1 day of frontend work.

Priority: **HIGH** - Should be in MVP launch.
