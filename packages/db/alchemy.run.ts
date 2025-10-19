import alchemy from 'alchemy';
import { D1Database, R2Bucket } from 'alchemy/cloudflare';
import { CloudflareStateStore } from 'alchemy/state';

const stage = process.env.STAGE || 'prod';
const isProd = stage === 'prod';

// Resource naming with stage suffix
const resourceSuffix = isProd ? '' : `-${stage}`;
const databaseName = `skillstash-registry${resourceSuffix}`;
const cacheName = `skillstash-cache${resourceSuffix}`;

const app = await alchemy('skillstash-db', {
  stage,
  stateStore: (scope) => new CloudflareStateStore(scope),
});

// Create D1 Database with Drizzle ORM support
export const database = await D1Database('skillstash-registry', {
  name: databaseName,
  migrationsDir: './migrations',
  migrationsTable: 'drizzle_migrations',
});

// Create R2 Bucket for caching
export const cache = await R2Bucket('skillstash-cache', {
  name: cacheName,
});

await app.finalize();
