/**
 * Statistics Types
 * Matches the `download_stats` table schema
 */

export type DownloadSource = 'cli' | 'web' | 'api';

export interface DownloadStats {
  id: string;
  pluginId: string;
  date: string; // ISO 8601 date (YYYY-MM-DD)
  downloadCount: number;
  uniqueUsers: number;
  source?: DownloadSource;
}

export interface CreateDownloadStatsInput {
  id: string;
  pluginId: string;
  date: string;
  downloadCount?: number;
  uniqueUsers?: number;
  source?: DownloadSource;
}

export interface UpdateDownloadStatsInput {
  downloadCount?: number;
  uniqueUsers?: number;
}

export interface PluginStats {
  pluginId: string;
  totalDownloads: number;
  totalUniqueUsers: number;
  dailyDownloads: DownloadStats[];
  downloadsBySource: Record<DownloadSource, number>;
}

export interface TrendingPlugin {
  pluginId: string;
  name: string;
  description: string;
  author: string;
  downloads: number;
  stars: number;
  tags: string[];
  recentDownloads: number; // Downloads in last 7 days
}
