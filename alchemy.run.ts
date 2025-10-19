import alchemy from 'alchemy';
import { Worker, D1Database, R2Bucket } from 'alchemy/cloudflare';
import { GitHubComment } from 'alchemy/github';
import { CloudflareStateStore } from 'alchemy/state';

const stage = process.env.STAGE || 'prod';
const isProd = stage === 'prod';
const isPreview = stage.startsWith('pr-');
const environment =
  process.env.ENVIRONMENT || (isProd ? 'production' : 'preview');

const app = await alchemy('skillstash', {
  stage,
  stateStore: (scope) => new CloudflareStateStore(scope),
});

// Resource naming with stage suffix
const resourceSuffix = isProd ? '' : `-${stage}`;
const databaseName = `skillstash-registry${resourceSuffix}`;
const cacheName = `skillstash-cache${resourceSuffix}`;

// Create D1 Database with Drizzle ORM support
const database = await D1Database('skillstash-registry', {
  name: databaseName,
  migrationsDir: './packages/db/migrations',
  migrationsTable: 'drizzle_migrations',
});

// Create R2 Bucket for caching
const cache = await R2Bucket('skillstash-cache', {
  name: cacheName,
});

// Determine custom domains (only for production)
const apiDomains = isProd ? ['api.skillstash.dev'] : undefined;
const ingesterDomains = isProd ? ['ingester.skillstash.dev'] : undefined;

// Deploy API Worker
const apiWorker = await Worker('skillstash-api', {
  entrypoint: './workers/api/src/index.ts',
  domains: apiDomains,
  bindings: {
    DB: database, // D1 Database binding
    CACHE: cache, // R2 Bucket binding
    ENVIRONMENT: environment, // Environment variable
    GITHUB_TOKEN: alchemy.secret(process.env.GITHUB_TOKEN || ''), // Secret binding
  },
  dev: {
    port: 8000,
    tunnel: true,
    remote: true,
  },
});

// Deploy ingester Worker with scheduled cron
const ingesterWorker = await Worker('skillstash-ingester', {
  entrypoint: './workers/ingester/src/index.ts',
  domains: ingesterDomains,
  bindings: {
    DB: database, // D1 Database binding
    CACHE: cache, // R2 Bucket binding
    ENVIRONMENT: environment, // Environment variable
    GITHUB_TOKEN: alchemy.secret(process.env.GITHUB_TOKEN || ''), // Secret binding
  },
  crons: isProd ? ['0 2 * * *'] : [], // Daily at 2 AM UTC (production only)
  dev: {
    port: 8001,
    tunnel: true,
    remote: true,
  },
});

// Log deployment information
const deploymentType = isProd
  ? 'Production'
  : isPreview
    ? `Preview (${stage})`
    : stage;
console.log(`\n✅ Deployment complete: ${deploymentType}`);
console.log(`\n📦 Resources:`);
console.log(`   Database: ${databaseName}`);
console.log(`   Cache: ${cacheName}`);
console.log(`\n🚀 API Worker:`);
if (isProd && apiDomains) {
  console.log(`   Custom domain: https://api.skillstash.dev`);
}
console.log(`   Workers.dev: ${apiWorker.url}`);
console.log(`\n🔄 ingester Worker:`);
if (isProd && ingesterDomains) {
  console.log(`   Custom domain: https://ingester.skillstash.dev`);
}
console.log(`   Workers.dev: ${ingesterWorker.url}`);
if (isProd) {
  console.log(`   Cron: Daily at 2 AM UTC`);
}

// Post GitHub comment for PR previews
if (isPreview && process.env.PULL_REQUEST) {
  await GitHubComment('preview-comment', {
    owner: 'rdimascio',
    repository: 'skill-stash',
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `
## 🚀 Preview Deployment Ready

Your worker preview environment has been deployed for PR #${process.env.PULL_REQUEST}

### Endpoints
- **API Worker**: ${apiWorker.url}
- **ingester Worker**: ${ingesterWorker.url}

### Resources
- **Database**: \`${databaseName}\`
- **Cache**: \`${cacheName}\`

### Stage
\`${stage}\`

---
*Commit: ${process.env.GITHUB_SHA?.substring(0, 7)}*`,
  });
}

await app.finalize();
