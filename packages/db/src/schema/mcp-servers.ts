import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { plugins } from './plugins';

export const mcpServers = sqliteTable('mcp_servers', {
  id: text('id').primaryKey(),
  pluginId: text('plugin_id')
    .notNull()
    .references(() => plugins.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  command: text('command').notNull(),
  args: text('args', { mode: 'json' }).$type<string[]>(),
  env: text('env', { mode: 'json' }).$type<Record<string, string>>(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});
