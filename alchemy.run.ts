import alchemy from "alchemy";
import { Worker, D1Database, R2Bucket } from "alchemy/cloudflare";
import { CloudflareStateStore, GitHubComment } from "alchemy/plugins";

const stage = process.env.STAGE || "prod";
const isProd = stage === "prod";
const isPreview = stage.startsWith("pr-");
const environment = process.env.ENVIRONMENT || (isProd ? "production" : "preview");

const app = await alchemy("skillstash", {
  stage,
  plugins: [
    // Use Cloudflare state management for state persistence
    CloudflareStateStore({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      password: process.env.ALCHEMY_PASSWORD,
      stateToken: process.env.ALCHEMY_STATE_TOKEN,
    }),
    // Add GitHub comments for PR previews
    ...(isPreview
      ? [
          GitHubComment({
            token: process.env.GITHUB_TOKEN,
            pullRequest: process.env.PULL_REQUEST,
            sha: process.env.GITHUB_SHA,
          }),
        ]
      : []),
  ],
});

// Resource naming with stage suffix
const resourceSuffix = isProd ? "" : `-${stage}`;
const databaseName = `skillstash-registry${resourceSuffix}`;
const cacheName = `skillstash-cache${resourceSuffix}`;

// Create D1 Database with Drizzle ORM support
const database = await D1Database("skillstash-registry", {
  name: databaseName,
  migrationsDir: "./packages/db/migrations",
  migrationsTable: "drizzle_migrations",
});

// Create R2 Bucket for caching
const cache = await R2Bucket("skillstash-cache", {
  name: cacheName,
});

// Determine custom domains (only for production)
const apiDomains = isProd ? ["api.skillstack.dev"] : undefined;
const indexerDomains = isProd ? ["indexer.skillstack.dev"] : undefined;

// Deploy API Worker
const apiWorker = await Worker("skillstash-api", {
  entrypoint: "./workers/api/src/index.ts",
  domains: apiDomains,
  bindings: {
    DB: database, // D1 Database binding
    CACHE: cache, // R2 Bucket binding
    ENVIRONMENT: environment, // Environment variable
    GITHUB_TOKEN: alchemy.secret(process.env.GITHUB_TOKEN || ""), // Secret binding
  },
});

// Deploy Indexer Worker with scheduled cron
const indexerWorker = await Worker("skillstash-indexer", {
  entrypoint: "./workers/indexer/src/index.ts",
  domains: indexerDomains,
  bindings: {
    DB: database, // D1 Database binding
    CACHE: cache, // R2 Bucket binding
    ENVIRONMENT: environment, // Environment variable
    GITHUB_TOKEN: alchemy.secret(process.env.GITHUB_TOKEN || ""), // Secret binding
  },
  triggers: {
    // Only enable cron in production
    crons: isProd ? ["0 2 * * *"] : [], // Daily at 2 AM UTC (production only)
  },
});

// Log deployment information
const deploymentType = isProd ? "Production" : isPreview ? `Preview (${stage})` : stage;
console.log(`\n✅ Deployment complete: ${deploymentType}`);
console.log(`\n📦 Resources:`);
console.log(`   Database: ${databaseName}`);
console.log(`   Cache: ${cacheName}`);
console.log(`\n🚀 API Worker:`);
if (isProd && apiDomains) {
  console.log(`   Custom domain: https://api.skillstack.dev`);
}
console.log(`   Workers.dev: ${apiWorker.url}`);
console.log(`\n🔄 Indexer Worker:`);
if (isProd && indexerDomains) {
  console.log(`   Custom domain: https://indexer.skillstack.dev`);
}
console.log(`   Workers.dev: ${indexerWorker.url}`);
if (isProd) {
  console.log(`   Cron: Daily at 2 AM UTC`);
}

// Post GitHub comment for PR previews
if (isPreview && process.env.PULL_REQUEST) {
  await app.comment(`
## 🚀 Preview Deployment Ready

Your worker preview environment has been deployed for PR #${process.env.PULL_REQUEST}

### Endpoints
- **API Worker**: ${apiWorker.url}
- **Indexer Worker**: ${indexerWorker.url}

### Resources
- **Database**: \`${databaseName}\`
- **Cache**: \`${cacheName}\`

### Stage
\`${stage}\`

---
*Commit: ${process.env.GITHUB_SHA?.substring(0, 7)}*
  `);
}

await app.finalize();
