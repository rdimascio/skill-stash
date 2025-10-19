# ingester Cost & Performance Analysis

## What the ingester Actually Does

**NOT scanning all of GitHub!** 🎉

The ingester uses a **targeted search query**:
```
topic:claude-code OR topic:claude-plugin
```

This only finds repositories that have explicitly added these topics to their GitHub repo. As of now, this is probably:
- **~10-50 repositories** (conservative estimate)
- Growing to maybe **~500 repositories** over time

## Cost Breakdown

### GitHub API Costs (FREE)

**Rate Limits (Authenticated)**:
- Core API: **5,000 requests/hour**
- Search API: **30 requests/minute** (1,800/hour)

**Per Indexing Run**:
- Search query: **1 request** (returns up to 100 repos)
- Per repo: **1 request** for marketplace.json
- Total for 50 repos: **~51 requests**
- **Time: ~2 minutes** (search is rate-limited to 30/min)

**With Caching** (subsequent runs):
- R2 cache hit rate: ~90% after first run
- Actual API calls: **~5 requests** (only new/updated repos)
- **Time: ~30 seconds**

**Monthly Usage**:
- Daily runs: 51 × 30 = **1,530 requests/month**
- Well within 5,000/hour limit
- **Cost: $0** (GitHub API is free)

### Cloudflare Costs

#### Workers (ingester)
- **Free Tier**: 100,000 requests/day
- **Usage**: 1 scheduled run/day = 30 requests/month
- **Cost: $0**

#### D1 Database
- **Free Tier**:
  - 5 GB storage
  - 5M reads/day
  - 100K writes/day
- **Usage per run**:
  - ~50 writes (upsert plugins)
  - ~200 writes (upsert components)
  - Total: ~250 writes/day
- **Cost: $0**

#### R2 Storage (Caching)
- **Free Tier**:
  - 10 GB storage
  - 1M Class A operations/month (writes)
  - 10M Class B operations/month (reads)
- **Usage**:
  - Cache ~50 marketplace.json files (~5 KB each)
  - Storage: ~250 KB
  - Writes: ~50/day = 1,500/month
  - Reads: ~50/day = 1,500/month
- **Cost: $0**

### Total Monthly Cost: **$0** 🎉

All operations fit comfortably within Cloudflare's **Free Tier**.

## Performance Analysis

### First Run (Cold Start)
```
┌─────────────────────────────────────┐
│ Search GitHub (topic query)   ~30s │
│ Fetch 50 marketplace.json     ~90s │
│ Parse & validate              ~10s │
│ Database upserts              ~20s │
│ Total:                       ~150s │  (2.5 minutes)
└─────────────────────────────────────┘
```

### Subsequent Runs (Warm Cache)
```
┌─────────────────────────────────────┐
│ Search GitHub (topic query)   ~30s │
│ Check cache for all 50 repos  ~5s  │
│ Fetch 5 new/updated repos     ~15s │
│ Database upserts (5 repos)    ~5s  │
│ Total:                        ~55s │  (<1 minute)
└─────────────────────────────────────┘
```

### At Scale (500 repos in future)
```
┌─────────────────────────────────────┐
│ Search GitHub (5 pages)      ~150s │
│ Fetch 500 marketplace.json   ~900s │
│ Parse & validate             ~100s │
│ Database upserts             ~200s │
│ Total:                      ~1350s │  (22.5 minutes)
└─────────────────────────────────────┘

With caching (90% hit rate):
│ Total:                       ~180s │  (3 minutes)
```

## Current Optimizations

✅ **Already Implemented**:
1. **R2 Caching** - 6 hour TTL for GitHub responses
2. **Smart Re-indexing** - Skips repos indexed < 6 hours ago
3. **Retry Logic** - Exponential backoff for failed requests
4. **Targeted Search** - Only repos with specific topics
5. **Pagination** - Handles multiple pages efficiently

## Recommended Additional Optimizations

### 1. Incremental Indexing (Check Last Push Date)

```typescript
// In parser.ts
async parsePlugin(repo: GitHubRepo, githubClient: GitHubClient): Promise<ParsedPlugin | null> {
  // Check if repo has been updated since last index
  const lastIndexed = await this.getLastIndexedDate(repo.full_name);

  if (lastIndexed && new Date(repo.pushed_at) <= lastIndexed) {
    console.log(`Skipping ${repo.full_name} - no changes since last index`);
    return null; // Skip unchanged repos
  }

  // ... rest of parsing logic
}
```

**Impact**: Reduces API calls by 80-90% on daily runs

### 2. Parallel Fetching (with Rate Limit Respect)

```typescript
// In index.ts
async function indexInBatches(repos: GitHubRepo[], batchSize: number = 10) {
  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize);

    // Process batch in parallel
    await Promise.allSettled(
      batch.map(repo => indexRepo(repo))
    );

    // Wait to respect rate limits (30/min for search)
    if (i + batchSize < repos.length) {
      await sleep(2000); // 2 second delay between batches
    }
  }
}
```

**Impact**: Reduces total time by 70% (from 2.5 min to 45 sec)

### 3. Conditional Fetching

```typescript
// Only fetch marketplace.json if repo has .claude-plugin directory
async hasClaudePlugin(repo: string): Promise<boolean> {
  // Check if .claude-plugin exists (1 API call)
  const dir = await githubClient.getDirectoryContents(repo, '.claude-plugin');
  return dir !== null;
}
```

**Impact**: Saves 1 API call per repo without plugin

### 4. Webhook Integration (Future)

Instead of daily cron:
- GitHub webhook on push events
- Index only when repos actually change
- Near real-time updates

**Impact**: Reduces unnecessary runs by 95%

## Scaling Projections

### 100 Plugins
- API calls/day: ~110
- Time/run: ~3 minutes (first) / ~45 seconds (cached)
- Cost: **$0**

### 500 Plugins
- API calls/day: ~550
- Time/run: ~22 minutes (first) / ~3 minutes (cached)
- Cost: **$0**

### 1,000 Plugins
- API calls/day: ~1,100
- Time/run: ~45 minutes (first) / ~5 minutes (cached)
- Cost: **$0** (still within free tier!)

### 5,000 Plugins (Unlikely but possible)
- API calls/day: ~5,500
- Time/run: ~3.5 hours (first) / ~20 minutes (cached)
- Cost: **$0** with optimizations
- May need pagination across multiple runs

## Risk Mitigation

### Rate Limit Exceeded
- **Probability**: Very low with current implementation
- **Mitigation**: Exponential backoff with retry logic
- **Fallback**: Queue repos and process in next run

### API Token Revoked
- **Probability**: Low
- **Mitigation**: Health check endpoint tests token validity
- **Alert**: Log errors, send notification

### Large File Parsing
- **Probability**: Medium (some plugins may have large JSON)
- **Mitigation**:
  - Set size limit on marketplace.json (10 KB max)
  - Stream parsing for large files
  - Timeout after 5 seconds

## Monitoring Recommendations

Add these metrics to track performance:

```typescript
interface IndexingMetrics {
  totalRepos: number;
  indexed: number;
  skipped: number;
  failed: number;
  apiCallsUsed: number;
  cacheHitRate: number;
  duration: number;
  rateLimitRemaining: number;
}
```

Log after each run:
```json
{
  "timestamp": "2025-01-15T02:00:00Z",
  "totalRepos": 50,
  "indexed": 5,
  "skipped": 43,
  "failed": 2,
  "apiCallsUsed": 12,
  "cacheHitRate": 0.86,
  "duration": 45,
  "rateLimitRemaining": 4988
}
```

## Conclusion

**Current Cost**: $0/month
**Expected Cost at Scale**: $0/month
**Performance**: Excellent (< 1 minute per run with caching)
**Risk**: Very low

The ingester is:
- ✅ **Not scanning all of GitHub** (only repos with specific topics)
- ✅ **Free to run** (within all free tier limits)
- ✅ **Fast** (< 1 minute with caching)
- ✅ **Scalable** (can handle 1,000+ plugins)
- ✅ **Reliable** (retry logic, error handling)

**Recommendation**: Deploy as-is, add incremental indexing optimization in v2.
