import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const authors = sqliteTable('authors', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email'),
  githubUrl: text('github_url'),
  websiteUrl: text('website_url'),
  bio: text('bio'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});
