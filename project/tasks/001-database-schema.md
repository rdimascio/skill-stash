# Task 001: Database Schema & Models

## Objective
Design and implement the core database schema for the SkillStash registry using Cloudflare D1 (SQLite).

## Context
SkillStash indexes Claude Code plugins from decentralized Git repositories. We need to store plugins, their components (skills, agents, commands), user data, and analytics.

## Database: Cloudflare D1 (SQLite)

### Core Tables

#### 1. plugins
```sql
CREATE TABLE plugins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  author_id TEXT,
  author_type TEXT CHECK(author_type IN ('user', 'org')),
  
  -- Repository info
  repo_url TEXT NOT NULL,
  marketplace_url TEXT NOT NULL,
  homepage_url TEXT,
  
  -- Categorization
  category TEXT NOT NULL,
  tags TEXT, -- JSON array
  
  -- Version & status
  version TEXT NOT NULL,
  latest_commit_sha TEXT,
  
  -- Stats
  downloads INTEGER DEFAULT 0,
  stars INTEGER DEFAULT 0,
  
  -- Trust signals
  verified BOOLEAN DEFAULT FALSE,
  security_audited BOOLEAN DEFAULT FALSE,
  official BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_indexed_at DATETIME,
  
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX idx_plugins_slug ON plugins(slug);
CREATE INDEX idx_plugins_category ON plugins(category);
CREATE INDEX idx_plugins_downloads ON plugins(downloads DESC);
CREATE INDEX idx_plugins_updated ON plugins(updated_at DESC);
```

#### 2. skills
```sql
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  path TEXT NOT NULL, -- Path in repo
  capabilities TEXT, -- JSON array
  auto_load BOOLEAN DEFAULT TRUE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_skills_plugin ON skills(plugin_id);
CREATE INDEX idx_skills_name ON skills(name);
```

#### 3. agents
```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  path TEXT NOT NULL,
  type TEXT, -- 'subagent', 'chat', 'workflow'
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_agents_plugin ON agents(plugin_id);
CREATE INDEX idx_agents_name ON agents(name);
```

#### 4. commands
```sql
CREATE TABLE commands (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  path TEXT NOT NULL,
  usage_example TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_commands_plugin ON commands(plugin_id);
CREATE INDEX idx_commands_name ON commands(name);
```

#### 5. mcp_servers
```sql
CREATE TABLE mcp_servers (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  path TEXT NOT NULL,
  service_type TEXT, -- 'github', 'aws', 'custom'
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_mcp_servers_plugin ON mcp_servers(plugin_id);
```

#### 6. users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  github_id TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  
  verified BOOLEAN DEFAULT FALSE,
  pro_subscriber BOOLEAN DEFAULT FALSE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_github ON users(github_id);
```

#### 7. collections
```sql
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  author_id TEXT NOT NULL,
  
  featured BOOLEAN DEFAULT FALSE,
  downloads INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX idx_collections_slug ON collections(slug);
CREATE INDEX idx_collections_featured ON collections(featured);
```

#### 8. collection_plugins
```sql
CREATE TABLE collection_plugins (
  collection_id TEXT NOT NULL,
  plugin_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  
  PRIMARY KEY (collection_id, plugin_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_collection_plugins_collection ON collection_plugins(collection_id);
```

#### 9. plugin_downloads
```sql
CREATE TABLE plugin_downloads (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  user_id TEXT,
  downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  cli_version TEXT,
  
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_downloads_plugin ON plugin_downloads(plugin_id);
CREATE INDEX idx_downloads_date ON plugin_downloads(downloaded_at);
```

#### 10. plugin_ratings
```sql
CREATE TABLE plugin_ratings (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  review TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(plugin_id, user_id),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_ratings_plugin ON plugin_ratings(plugin_id);
```

## TypeScript Types

```typescript
// types/database.ts

export interface Plugin {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  author_id: string;
  author_type: 'user' | 'org';
  repo_url: string;
  marketplace_url: string;
  homepage_url: string | null;
  category: string;
  tags: string[]; // Stored as JSON string in DB
  version: string;
  latest_commit_sha: string | null;
  downloads: number;
  stars: number;
  verified: boolean;
  security_audited: boolean;
  official: boolean;
  created_at: string;
  updated_at: string;
  last_indexed_at: string | null;
}

export interface Skill {
  id: string;
  plugin_id: string;
  name: string;
  description: string | null;
  path: string;
  capabilities: string[]; // Stored as JSON string
  auto_load: boolean;
  created_at: string;
}

export interface Agent {
  id: string;
  plugin_id: string;
  name: string;
  description: string | null;
  path: string;
  type: 'subagent' | 'chat' | 'workflow' | null;
  created_at: string;
}

export interface Command {
  id: string;
  plugin_id: string;
  name: string;
  description: string | null;
  path: string;
  usage_example: string | null;
  created_at: string;
}

export interface MCPServer {
  id: string;
  plugin_id: string;
  name: string;
  description: string | null;
  path: string;
  service_type: string | null;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  github_id: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  verified: boolean;
  pro_subscriber: boolean;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  author_id: string;
  featured: boolean;
  downloads: number;
  created_at: string;
  updated_at: string;
}

export interface PluginDownload {
  id: string;
  plugin_id: string;
  user_id: string | null;
  downloaded_at: string;
  cli_version: string | null;
}

export interface PluginRating {
  id: string;
  plugin_id: string;
  user_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  updated_at: string;
}
```

## Deliverables

1. `schema.sql` - Complete SQL schema with all tables and indexes
2. `types/database.ts` - TypeScript type definitions
3. `migrations/001_initial.sql` - Initial migration file
4. `seed.sql` - Sample seed data for development

## Success Criteria

- [ ] All tables created successfully in D1
- [ ] Foreign keys and constraints working
- [ ] Indexes created for common queries
- [ ] TypeScript types match schema exactly
- [ ] Can insert and query test data

## Notes

- Use UUIDs for all primary keys (generate with `crypto.randomUUID()`)
- JSON fields stored as TEXT, parse on read
- SQLite doesn't have ARRAY type, use JSON
- Timestamps in ISO 8601 format
- Set up D1 database in Cloudflare dashboard before running migrations