import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const plugins = sqliteTable('plugins', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  author: text('author').notNull(),
  repoUrl: text('repo_url').notNull(),
  stars: integer('stars').default(0),
  downloads: integer('downloads').default(0),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

export const pluginVersions = sqliteTable('plugin_versions', {
  id: text('id').primaryKey(),
  pluginId: text('plugin_id')
    .notNull()
    .references(() => plugins.id, { onDelete: 'cascade' }),
  version: text('version').notNull(),
  changelog: text('changelog'),
  publishedAt: text('published_at').default(sql`CURRENT_TIMESTAMP`)
});

export const pluginTags = sqliteTable('plugin_tags', {
  id: text('id').primaryKey(),
  pluginId: text('plugin_id')
    .notNull()
    .references(() => plugins.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull()
});

export const pluginDependencies = sqliteTable('plugin_dependencies', {
  id: text('id').primaryKey(),
  pluginId: text('plugin_id')
    .notNull()
    .references(() => plugins.id, { onDelete: 'cascade' }),
  dependencyId: text('dependency_id')
    .notNull()
    .references(() => plugins.id, { onDelete: 'cascade' }),
  versionConstraint: text('version_constraint')
});
