-- Migration: 0001_initial_schema
-- Description: Initial database schema for SkillStash registry
-- Created: 2025-10-18
-- Author: Backend Infrastructure Specialist

-- Create authors table
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

-- Create plugins table
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
  metadata TEXT,
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

-- Create plugin_versions table
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
  metadata TEXT,
  UNIQUE(plugin_id, version),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_plugin_versions_plugin_id ON plugin_versions(plugin_id);
CREATE INDEX idx_plugin_versions_version ON plugin_versions(version);
CREATE INDEX idx_plugin_versions_published_at ON plugin_versions(published_at DESC);
CREATE INDEX idx_plugin_versions_is_latest ON plugin_versions(is_latest);

-- Create plugin_tags table
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

-- Create plugin_dependencies table
CREATE TABLE IF NOT EXISTS plugin_dependencies (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  dependency_id TEXT NOT NULL,
  dependency_type TEXT NOT NULL CHECK(dependency_type IN ('required', 'optional', 'peer')),
  version_constraint TEXT,
  UNIQUE(plugin_id, dependency_id),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
  FOREIGN KEY (dependency_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_plugin_dependencies_plugin_id ON plugin_dependencies(plugin_id);
CREATE INDEX idx_plugin_dependencies_dependency_id ON plugin_dependencies(dependency_id);
CREATE INDEX idx_plugin_dependencies_type ON plugin_dependencies(dependency_type);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  file_path TEXT NOT NULL,
  instructions TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plugin_id, name),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_skills_plugin_id ON skills(plugin_id);
CREATE INDEX idx_skills_name ON skills(name);

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  role TEXT NOT NULL,
  expertise TEXT,
  tools TEXT,
  instructions TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plugin_id, name),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_agents_plugin_id ON agents(plugin_id);
CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_agents_role ON agents(role);

-- Create commands table
CREATE TABLE IF NOT EXISTS commands (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  file_path TEXT NOT NULL,
  handler TEXT,
  parameters TEXT,
  examples TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plugin_id, name),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_commands_plugin_id ON commands(plugin_id);
CREATE INDEX idx_commands_name ON commands(name);

-- Create mcp_servers table
CREATE TABLE IF NOT EXISTS mcp_servers (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  transport TEXT NOT NULL CHECK(transport IN ('stdio', 'http', 'websocket')),
  command TEXT,
  url TEXT,
  config TEXT,
  capabilities TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plugin_id, name),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_mcp_servers_plugin_id ON mcp_servers(plugin_id);
CREATE INDEX idx_mcp_servers_name ON mcp_servers(name);
CREATE INDEX idx_mcp_servers_transport ON mcp_servers(transport);

-- Create download_stats table
CREATE TABLE IF NOT EXISTS download_stats (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  date TEXT NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  UNIQUE(plugin_id, date, source),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX idx_download_stats_plugin_id ON download_stats(plugin_id);
CREATE INDEX idx_download_stats_date ON download_stats(date DESC);
CREATE INDEX idx_download_stats_source ON download_stats(source);
