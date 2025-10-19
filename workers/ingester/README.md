# SkillStash ingester Worker

The ingester Worker is a Cloudflare Worker that discovers and indexes Claude Code plugins from GitHub. It crawls repositories with specific topics, parses plugin metadata, and populates the SkillStash registry database.

## Architecture

### Components

1. **GitHub API Client** (`lib/github.ts`)
   - Authenticates with GitHub API
   - Searches for repositories with `claude-code` or `claude-plugin` topics
   - Fetches repository files (CLAUDE.md, .claude directory)
   - Handles rate limiting with exponential backoff retry logic

2. **Plugin Parser** (`lib/parser.ts`)
   - Extracts plugin metadata from CLAUDE.md
   - Parses skills from `.claude/skills/*.md`
   - Parses agents from `.claude/agents/*.md`
   - Parses commands from `.claude/commands/*.md`
   - Parses MCP servers from `.claude/mcp-servers/*.{md,json}`

3. **Database Updater** (`lib/updater.ts`)
   - Upserts plugins and related components to D1 database
   - Uses Drizzle ORM for type-safe database operations
   - Handles cascading updates for skills, agents, commands, MCP servers

4. **Cache Manager** (`lib/cache.ts`)
   - Caches GitHub API responses in R2 bucket
   - Reduces API calls and improves performance
   - 6-hour default TTL for cached data

5. **Validation** (`lib/validation.ts`)
   - Validates parsed plugin data with Zod schemas
   - Ensures data integrity before database insertion
   - Provides detailed validation error messages

### Data Flow

```
GitHub Repos → GitHub Client → Parser → Validator → Updater → D1 Database
                      ↓
                 R2 Cache (for GitHub responses)
```

## Endpoints

### GET `/index`
Manually trigger a full indexing run.

**Response:**
```json
{
  "success": true,
  "indexed": 15,
  "failed": 2,
  "skipped": 3,
  "total": 20
}
```

### POST `/index/:owner/:repo`
Index a specific GitHub repository.

**Example:**
```bash
curl -X POST https://ingester.skillstash.com/index/anthropics/claude-code
```

**Response:**
```json
{
  "success": true,
  "pluginId": "anthropics-claude-code",
  "message": "Successfully indexed anthropics/claude-code"
}
```

### GET `/stats`
Get ingester statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 50,
    "withSkills": 35,
    "withAgents": 20,
    "withCommands": 40,
    "withMcpServers": 10
  }
}
```

### GET `/rate-limit`
Check GitHub API rate limit status.

**Response:**
```json
{
  "success": true,
  "rateLimit": {
    "limit": 5000,
    "remaining": 4950,
    "reset": 1710000000
  }
}
```

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "skillstash-ingester",
  "environment": "production",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

## Scheduled Execution

The worker runs automatically via Cloudflare Cron Triggers:
- **Schedule:** Daily at 2:00 AM UTC
- **Configured in:** `wrangler.toml`

```toml
[triggers]
crons = ["0 2 * * *"]
```

## Plugin Discovery Strategy

The ingester finds plugins by:

1. **GitHub Topics**: Searches for repos with `claude-code` or `claude-plugin` topics
2. **Repository Structure**: Looks for `.claude/` directory
3. **CLAUDE.md**: Optional but recommended plugin metadata file
4. **Components**: Parses skills, agents, commands, and MCP servers from subdirectories

### Expected Repository Structure

```
my-claude-plugin/
├── CLAUDE.md                    # Plugin metadata (optional)
├── README.md
└── .claude/
    ├── skills/
    │   ├── skill-name.md        # Skill definition
    │   └── another-skill.md
    ├── agents/
    │   └── agent-name.md        # Agent definition
    ├── commands/
    │   └── command-name.md      # Command definition
    └── mcp-servers/
        ├── server-name.md       # MCP server definition
        └── server-config.json   # MCP server config
```

## Environment Variables

### Required Secrets
- `GITHUB_TOKEN` - Personal access token with repo read permissions

### Optional Variables
- `ENVIRONMENT` - Deployment environment (development/production)

## Local Development

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create `.dev.vars` file:
```bash
echo "GITHUB_TOKEN=your_github_token_here" > .dev.vars
```

3. Run in development mode:
```bash
pnpm dev
```

### Testing

Test manual indexing:
```bash
curl http://localhost:8788/index
```

Test specific repository:
```bash
curl -X POST http://localhost:8788/index/owner/repo
```

Check stats:
```bash
curl http://localhost:8788/stats
```

### Type Checking

```bash
pnpm typecheck
```

### Building

```bash
pnpm build
```

## Deployment

### Prerequisites

1. **D1 Database**: Create D1 database named `skillstash-registry`
```bash
wrangler d1 create skillstash-registry
```

2. **R2 Bucket**: Create R2 bucket named `skillstash-cache`
```bash
wrangler r2 bucket create skillstash-cache
```

3. **GitHub Token**: Set as secret
```bash
wrangler secret put GITHUB_TOKEN
```

4. **Update wrangler.toml**: Fill in database_id with your D1 database ID

### Deploy

```bash
pnpm deploy
```

Or from root:
```bash
pnpm deploy:ingester
```

## Error Handling

### GitHub API Errors
- **Rate Limiting**: Automatic retry with exponential backoff
- **404 Errors**: Gracefully handled, logged but not retried
- **Authentication Errors**: Fail fast with clear error message

### Parsing Errors
- Non-critical parsing errors are logged but don't stop indexing
- Validation errors skip the plugin and continue with next one

### Database Errors
- Transaction-like behavior with cascading deletes
- Failed upserts are logged and reported in indexing results

## Performance Optimizations

1. **R2 Caching**: GitHub API responses cached for 6 hours
2. **Skip Recent**: Plugins indexed < 6 hours ago are skipped
3. **Parallel Operations**: Uses Promise.all where possible
4. **Batch Processing**: Processes repositories in batches

## Monitoring

### Logs
All indexing operations are logged to Cloudflare Workers logs:
- Repository processing status
- Parsing errors
- Validation failures
- Database operations
- Rate limit warnings

### Metrics to Monitor
- Indexing success rate (indexed / total)
- Parsing failure rate (failed / total)
- GitHub API rate limit usage
- Database operation latency
- Cache hit rate

## Troubleshooting

### "GitHub API error: 401"
- Check that GITHUB_TOKEN secret is set correctly
- Verify token has `repo` read permissions

### "Failed to parse plugin"
- Check repository has proper structure
- Verify CLAUDE.md or .claude directory exists
- Review parser logs for specific errors

### "Validation failed"
- Review validation errors in response
- Ensure plugin metadata meets schema requirements
- Check description length (minimum 10 characters)

### High failure rate
- Check GitHub API rate limits
- Verify database connectivity
- Review error logs for common patterns

## API Rate Limits

GitHub API limits:
- **Authenticated**: 5,000 requests/hour
- **Search API**: 30 requests/minute

The ingester is designed to stay well within these limits:
- Caches responses for 6 hours
- Uses retry logic with backoff
- Monitors rate limit via `/rate-limit` endpoint

## Future Enhancements

- [ ] Webhook support for real-time indexing
- [ ] Incremental updates (only fetch changed files)
- [ ] Multi-page search results
- [ ] Plugin versioning support
- [ ] Analytics and metrics dashboard
- [ ] Automatic plugin quality scoring
- [ ] Integration with GitHub Apps for better permissions

## Related Documentation

- [Database Schema](/packages/db/README.md)
- [API Worker](/workers/api/README.md)
- [CLI Tool](/apps/cli/README.md)
- [Project Tasks](/project/tasks/002-plugin-ingester-service.md)
