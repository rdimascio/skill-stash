-- SkillStash Registry Database Schema
-- SQLite (Cloudflare D1) Schema for Plugin Discovery & Distribution Platform
-- Version: 1.0
-- Last Updated: 2025-10-18

-- =============================================================================
-- Core Tables
-- =============================================================================

-- Authors: Plugin creator information
CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  github_url TEXT,
  website TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_authors_username ON authors(username);
CREATE INDEX idx_authors_created_at ON authors(created_at DESC);

-- Plugins: Main registry of Claude Code plugins
CREATE TABLE IF NOT EXISTS plugins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  long_description TEXT,
  author_id TEXT NOT NULL,
  repo_url TEXT NOT NULL UNIQUE,
  homepage_url TEXT,
  license TEXT,
  stars INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'deprecated', 'archived')),
  is_verified BOOLEAN NOT NULL DEFAULT 0,
  metadata TEXT, -- JSON: additional plugin metadata
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TEXT,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

CREATE INDEX idx_plugins_name ON plugins(name);
CREATE INDEX idx_plugins_author_id ON plugins(author_id);
CREATE INDEX idx_plugins_stars ON plugins(stars DESC);
CREATE INDEX idx_plugins_downloads ON plugins(downloads DESC);
CREATE INDEX idx_plugins_status ON plugins(status);
CREATE INDEX idx_plugins_created_at ON plugins(created_at DESC);
CREATE INDEX idx_plugins_updated_at ON plugins(updated_at DESC);

-- Plugin Versions: Track version history with semver
CREATE TABLE IF NOT EXISTS plugin_versions (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  version TEXT NOT NULL,
  changelog TEXT,
  breaking_changes TEXT,
  min_claude_version TEXT,
  published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_latest BOOLEAN NOT NULL DEFAULT 0,
  download_url TEXT,
  checksum TEXT,
  metadata TEXT, -- JSON: version-specific metadata
  UNIQUE(plugin_id, version),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_plugin_versions_plugin_id ON plugin_versions(plugin_id);
CREATE INDEX idx_plugin_versions_version ON plugin_versions(version);
CREATE INDEX idx_plugin_versions_published_at ON plugin_versions(published_at DESC);
CREATE INDEX idx_plugin_versions_is_latest ON plugin_versions(is_latest);

-- Plugin Tags: Category and tag taxonomy for discovery
CREATE TABLE IF NOT EXISTS plugin_tags (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('language', 'framework', 'tool', 'domain', 'feature', 'platform')),
  UNIQUE(plugin_id, tag),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_plugin_tags_plugin_id ON plugin_tags(plugin_id);
CREATE INDEX idx_plugin_tags_tag ON plugin_tags(tag);
CREATE INDEX idx_plugin_tags_category ON plugin_tags(category);

-- Plugin Dependencies: Inter-plugin dependency tracking
CREATE TABLE IF NOT EXISTS plugin_dependencies (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  dependency_id TEXT NOT NULL,
  dependency_type TEXT NOT NULL CHECK(dependency_type IN ('required', 'optional', 'peer')),
  version_constraint TEXT, -- Semver constraint like "^1.0.0" or ">=2.0.0 <3.0.0"
  UNIQUE(plugin_id, dependency_id),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
  FOREIGN KEY (dependency_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_plugin_dependencies_plugin_id ON plugin_dependencies(plugin_id);
CREATE INDEX idx_plugin_dependencies_dependency_id ON plugin_dependencies(dependency_id);
CREATE INDEX idx_plugin_dependencies_type ON plugin_dependencies(dependency_type);

-- =============================================================================
-- Component Tables
-- =============================================================================

-- Skills: Reusable skill definitions from plugins
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Relative path within plugin
  instructions TEXT,
  metadata TEXT, -- JSON: skill configuration
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plugin_id, name),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_skills_plugin_id ON skills(plugin_id);
CREATE INDEX idx_skills_name ON skills(name);

-- Agents: Agent definitions from plugins
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  role TEXT NOT NULL, -- Agent's primary role
  expertise TEXT, -- JSON array: areas of expertise
  tools TEXT, -- JSON array: tool names the agent uses
  instructions TEXT,
  metadata TEXT, -- JSON: agent configuration
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plugin_id, name),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_agents_plugin_id ON agents(plugin_id);
CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_agents_role ON agents(role);

-- Commands: Slash command definitions from plugins
CREATE TABLE IF NOT EXISTS commands (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Relative path to command file
  handler TEXT, -- Function/method name that handles the command
  parameters TEXT, -- JSON: command parameter definitions
  examples TEXT, -- JSON array: usage examples
  metadata TEXT, -- JSON: command configuration
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plugin_id, name),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_commands_plugin_id ON commands(plugin_id);
CREATE INDEX idx_commands_name ON commands(name);

-- MCP Servers: Model Context Protocol server integrations
CREATE TABLE IF NOT EXISTS mcp_servers (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  transport TEXT NOT NULL CHECK(transport IN ('stdio', 'http', 'websocket')),
  command TEXT, -- Command to start the server (for stdio)
  url TEXT, -- URL for HTTP/WebSocket servers
  config TEXT, -- JSON: server-specific configuration
  capabilities TEXT, -- JSON array: declared capabilities (prompts, resources, tools)
  metadata TEXT, -- JSON: additional metadata
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plugin_id, name),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_mcp_servers_plugin_id ON mcp_servers(plugin_id);
CREATE INDEX idx_mcp_servers_name ON mcp_servers(name);
CREATE INDEX idx_mcp_servers_transport ON mcp_servers(transport);

-- =============================================================================
-- Analytics & Metadata
-- =============================================================================

-- Download Stats: Track plugin download counts over time
CREATE TABLE IF NOT EXISTS download_stats (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  date TEXT NOT NULL, -- ISO 8601 date (YYYY-MM-DD)
  download_count INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  source TEXT, -- 'cli', 'web', 'api', etc.
  UNIQUE(plugin_id, date, source),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_download_stats_plugin_id ON download_stats(plugin_id);
CREATE INDEX idx_download_stats_date ON download_stats(date DESC);
CREATE INDEX idx_download_stats_source ON download_stats(source);

-- =============================================================================
-- Full-Text Search
-- =============================================================================

-- FTS5 virtual table for full-text search on plugins
CREATE VIRTUAL TABLE IF NOT EXISTS plugins_fts USING fts5(
  name,
  description,
  long_description,
  author,
  tags,
  content=plugins,
  content_rowid=rowid
);

-- Triggers to keep FTS index in sync with plugins table
CREATE TRIGGER IF NOT EXISTS plugins_fts_insert AFTER INSERT ON plugins BEGIN
  INSERT INTO plugins_fts(rowid, name, description, long_description, author, tags)
  SELECT
    new.rowid,
    new.name,
    new.description,
    new.long_description,
    (SELECT username FROM authors WHERE id = new.author_id),
    (SELECT GROUP_CONCAT(tag, ' ') FROM plugin_tags WHERE plugin_id = new.id);
END;

CREATE TRIGGER IF NOT EXISTS plugins_fts_update AFTER UPDATE ON plugins BEGIN
  UPDATE plugins_fts
  SET
    name = new.name,
    description = new.description,
    long_description = new.long_description,
    author = (SELECT username FROM authors WHERE id = new.author_id),
    tags = (SELECT GROUP_CONCAT(tag, ' ') FROM plugin_tags WHERE plugin_id = new.id)
  WHERE rowid = new.rowid;
END;

CREATE TRIGGER IF NOT EXISTS plugins_fts_delete AFTER DELETE ON plugins BEGIN
  DELETE FROM plugins_fts WHERE rowid = old.rowid;
END;

-- Trigger to update plugin tags in FTS when tags are modified
CREATE TRIGGER IF NOT EXISTS plugin_tags_fts_update AFTER INSERT ON plugin_tags BEGIN
  UPDATE plugins_fts
  SET tags = (SELECT GROUP_CONCAT(tag, ' ') FROM plugin_tags WHERE plugin_id = new.plugin_id)
  WHERE rowid = (SELECT rowid FROM plugins WHERE id = new.plugin_id);
END;

CREATE TRIGGER IF NOT EXISTS plugin_tags_fts_delete AFTER DELETE ON plugin_tags BEGIN
  UPDATE plugins_fts
  SET tags = (SELECT GROUP_CONCAT(tag, ' ') FROM plugin_tags WHERE plugin_id = old.plugin_id)
  WHERE rowid = (SELECT rowid FROM plugins WHERE id = old.plugin_id);
END;

-- =============================================================================
-- Views for Common Queries
-- =============================================================================

-- Plugin list view with author information and latest version
CREATE VIEW IF NOT EXISTS plugin_list_view AS
SELECT
  p.id,
  p.name,
  p.description,
  p.stars,
  p.downloads,
  p.status,
  p.is_verified,
  p.created_at,
  p.updated_at,
  a.username as author,
  a.avatar_url as author_avatar,
  (SELECT version FROM plugin_versions WHERE plugin_id = p.id AND is_latest = 1 LIMIT 1) as latest_version,
  (SELECT GROUP_CONCAT(tag, ',') FROM plugin_tags WHERE plugin_id = p.id) as tags
FROM plugins p
INNER JOIN authors a ON p.author_id = a.id;

-- Popular plugins view (by downloads)
CREATE VIEW IF NOT EXISTS popular_plugins_view AS
SELECT
  id,
  name,
  description,
  author,
  downloads,
  stars,
  tags
FROM plugin_list_view
WHERE status = 'active'
ORDER BY downloads DESC;

-- Trending plugins view (by recent download activity)
CREATE VIEW IF NOT EXISTS trending_plugins_view AS
SELECT
  p.id,
  p.name,
  p.description,
  p.author,
  p.downloads,
  p.stars,
  p.tags,
  SUM(ds.download_count) as recent_downloads
FROM plugin_list_view p
LEFT JOIN download_stats ds ON p.id = ds.plugin_id
  AND ds.date >= date('now', '-7 days')
WHERE p.status = 'active'
GROUP BY p.id
ORDER BY recent_downloads DESC;
