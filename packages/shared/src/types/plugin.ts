/**
 * Plugin Types
 * Matches the `plugins` and `plugin_versions` table schemas
 */

export type PluginStatus = 'active' | 'deprecated' | 'archived';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  authorId: string;
  repoUrl: string;
  homepageUrl?: string;
  license?: string;
  stars: number;
  downloads: number;
  status: PluginStatus;
  isVerified: boolean;
  metadata?: Record<string, any>; // JSON metadata
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
}

export interface PluginVersion {
  id: string;
  pluginId: string;
  version: string;
  changelog?: string;
  breakingChanges?: string;
  minClaudeVersion?: string;
  publishedAt: string;
  isLatest: boolean;
  downloadUrl?: string;
  checksum?: string;
  metadata?: Record<string, any>; // JSON metadata
}

export interface PluginTag {
  id: string;
  pluginId: string;
  tag: string;
  category: 'language' | 'framework' | 'tool' | 'domain' | 'feature' | 'platform';
}

export type DependencyType = 'required' | 'optional' | 'peer';

export interface PluginDependency {
  id: string;
  pluginId: string;
  dependencyId: string;
  dependencyType: DependencyType;
  versionConstraint?: string; // Semver constraint
}

export interface CreatePluginInput {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  authorId: string;
  repoUrl: string;
  homepageUrl?: string;
  license?: string;
  status?: PluginStatus;
  metadata?: Record<string, any>;
}

export interface UpdatePluginInput {
  description?: string;
  longDescription?: string;
  homepageUrl?: string;
  license?: string;
  stars?: number;
  downloads?: number;
  status?: PluginStatus;
  isVerified?: boolean;
  metadata?: Record<string, any>;
  lastSyncedAt?: string;
}

export interface CreatePluginVersionInput {
  id: string;
  pluginId: string;
  version: string;
  changelog?: string;
  breakingChanges?: string;
  minClaudeVersion?: string;
  downloadUrl?: string;
  checksum?: string;
  metadata?: Record<string, any>;
}

// Composite types for API responses
export interface PluginWithAuthor extends Plugin {
  author: {
    username: string;
    avatarUrl?: string;
  };
}

export interface PluginWithDetails extends PluginWithAuthor {
  latestVersion?: string;
  tags: string[];
  versions?: PluginVersion[];
  dependencies?: PluginDependency[];
}

export interface PluginListItem {
  id: string;
  name: string;
  description: string;
  author: string;
  authorAvatar?: string;
  stars: number;
  downloads: number;
  latestVersion?: string;
  tags: string[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
