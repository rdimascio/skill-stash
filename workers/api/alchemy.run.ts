import alchemy from 'alchemy';
import { Worker } from 'alchemy/cloudflare';
import { database, cache } from '@skillstash/db/alchemy';
import { CloudflareStateStore } from 'alchemy/state';

const stage = process.env.STAGE || 'prod';
const isProd = stage === 'prod';
const environment =
  process.env.ENVIRONMENT || (isProd ? 'production' : 'preview');

// Determine custom domains (only for production)
const apiDomains = isProd ? ['api.skillstash.dev'] : undefined;

const app = await alchemy('skillstash-api', {
  stage,
  stateStore:
    process.env.NODE_ENV === 'production'
      ? (scope) =>
          new CloudflareStateStore(scope, {
            stateToken: alchemy.secret(process.env.ALCHEMY_STATE_TOKEN || ''),
          })
      : undefined,
});

// Deploy API Worker
export const worker = await Worker('skillstash-api', {
  entrypoint: './src/index.ts',
  domains: apiDomains,
  bindings: {
    DB: database, // D1 Database binding
    CACHE: cache, // R2 Bucket binding
    ENVIRONMENT: environment, // Environment variable
    GITHUB_TOKEN: alchemy.secret(process.env.GITHUB_TOKEN || ''), // Secret binding
  },
  dev: {
    port: 8000,
  },
});

await app.finalize();
