import alchemy from 'alchemy';
import { Worker } from 'alchemy/cloudflare';
import { database, cache } from '@skillstash/db/alchemy';
import { CloudflareStateStore } from 'alchemy/state';

const stage = process.env.STAGE || 'prod';
const isProd = stage === 'prod';
const environment =
  process.env.ENVIRONMENT || (isProd ? 'production' : 'preview');

// Determine custom domains (only for production)
const ingesterDomains = isProd ? ['ingester.skillstash.dev'] : undefined;

const app = await alchemy('skillstash-ingester', {
  stage,
  stateStore: (scope) => new CloudflareStateStore(scope),
});

// Deploy ingester Worker with scheduled cron
export const worker = await Worker('skillstash-ingester', {
  entrypoint: './src/index.ts',
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
  },
});

await app.finalize();
