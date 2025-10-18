-- Migration: 0002_add_fts_search
-- Description: Add FTS5 full-text search and views for plugin discovery
-- Created: 2025-10-18
-- Author: Backend Infrastructure Specialist

-- Create FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS plugins_fts USING fts5(
  name,
  description,
  long_description,
  author,
  tags,
  content=plugins,
  content_rowid=rowid
);

-- Trigger to insert into FTS when new plugin is added
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

-- Trigger to update FTS when plugin is updated
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

-- Trigger to delete from FTS when plugin is deleted
CREATE TRIGGER IF NOT EXISTS plugins_fts_delete AFTER DELETE ON plugins BEGIN
  DELETE FROM plugins_fts WHERE rowid = old.rowid;
END;

-- Trigger to update FTS tags when tags are added
CREATE TRIGGER IF NOT EXISTS plugin_tags_fts_update AFTER INSERT ON plugin_tags BEGIN
  UPDATE plugins_fts
  SET tags = (SELECT GROUP_CONCAT(tag, ' ') FROM plugin_tags WHERE plugin_id = new.plugin_id)
  WHERE rowid = (SELECT rowid FROM plugins WHERE id = new.plugin_id);
END;

-- Trigger to update FTS tags when tags are deleted
CREATE TRIGGER IF NOT EXISTS plugin_tags_fts_delete AFTER DELETE ON plugin_tags BEGIN
  UPDATE plugins_fts
  SET tags = (SELECT GROUP_CONCAT(tag, ' ') FROM plugin_tags WHERE plugin_id = old.plugin_id)
  WHERE rowid = (SELECT rowid FROM plugins WHERE id = old.plugin_id);
END;

-- Create view for plugin list with author info
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

-- Create view for popular plugins (by downloads)
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

-- Create view for trending plugins (recent activity)
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
