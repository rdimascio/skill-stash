import alchemy from "alchemy";
import { Worker, D1Database, R2Bucket } from "alchemy/cloudflare";

const app = await alchemy("skillstash");

// Create D1 Database with Drizzle ORM support
const database = await D1Database("skillstash-registry", {
  name: "skillstash-registry",
  migrationsDir: "./packages/db/migrations",
  migrationsTable: "drizzle_migrations",
});

// Create R2 Bucket for caching
const cache = await R2Bucket("skillstash-cache", {
  name: "skillstash-cache",
});

// Deploy API Worker
const apiWorker = await Worker("skillstash-api", {
  entrypoint: "./workers/api/src/index.ts",
  domains: ["api.skillstash.com"], // Custom domain for API
  bindings: {
    DB: database, // D1 Database binding
    CACHE: cache, // R2 Bucket binding
    ENVIRONMENT: process.env.ENVIRONMENT || "production", // Environment variable
    GITHUB_TOKEN: alchemy.secret(process.env.GITHUB_TOKEN || ""), // Secret binding
  },
});

// Deploy Indexer Worker with scheduled cron
const indexerWorker = await Worker("skillstash-indexer", {
  entrypoint: "./workers/indexer/src/index.ts",
  domains: ["indexer.skillstash.com"], // Custom domain for Indexer (optional, for manual triggers)
  bindings: {
    DB: database, // D1 Database binding
    CACHE: cache, // R2 Bucket binding
    ENVIRONMENT: process.env.ENVIRONMENT || "production", // Environment variable
    GITHUB_TOKEN: alchemy.secret(process.env.GITHUB_TOKEN || ""), // Secret binding
  },
  triggers: {
    crons: ["0 2 * * *"], // Daily at 2 AM UTC
  },
});

console.log(`✅ API Worker deployed:`);
console.log(`   Custom domain: https://api.skillstash.com`);
console.log(`   Workers.dev: ${apiWorker.url}`);
console.log(`✅ Indexer Worker deployed:`);
console.log(`   Custom domain: https://indexer.skillstash.com`);
console.log(`   Workers.dev: ${indexerWorker.url}`);

await app.finalize();
