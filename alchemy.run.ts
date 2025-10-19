import alchemy from "alchemy";
import { Worker, D1Database, R2Bucket } from "alchemy/cloudflare";

const app = await alchemy("skillstash");

// Create D1 Database
const database = await D1Database("skillstash-registry", {
  // Database will be created if it doesn't exist
});

// Create R2 Bucket
const cache = await R2Bucket("skillstash-cache", {
  // Bucket will be created if it doesn't exist
});

// Deploy API Worker
const apiWorker = await Worker("skillstash-api", {
  entrypoint: "./workers/api/src/index.ts",
  bindings: {
    DB: database,
    CACHE: cache,
  },
  env: {
    ENVIRONMENT: process.env.ENVIRONMENT || "production",
  },
  secrets: ["GITHUB_TOKEN"], // Reads from .env
});

// Deploy Indexer Worker
const indexerWorker = await Worker("skillstash-indexer", {
  entrypoint: "./workers/indexer/src/index.ts",
  bindings: {
    DB: database,
    CACHE: cache,
  },
  env: {
    ENVIRONMENT: process.env.ENVIRONMENT || "production",
  },
  secrets: ["GITHUB_TOKEN"],
  triggers: {
    crons: ["0 2 * * *"], // Daily at 2 AM UTC
  },
});

console.log(`✅ API Worker deployed: ${apiWorker.url}`);
console.log(`✅ Indexer Worker deployed: ${indexerWorker.url}`);

await app.finalize();
