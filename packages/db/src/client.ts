import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * Creates a Drizzle ORM client for Cloudflare D1
 * @param d1 - Cloudflare D1 database binding
 * @returns Drizzle database client with type-safe schema
 */
export function createDbClient(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
