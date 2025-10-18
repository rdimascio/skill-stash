/**
 * SkillStash Shared TypeScript Types
 * Database-aligned type definitions for the entire platform
 */

// Export all types from individual modules
export * from './author';
export * from './plugin';
export * from './skill';
export * from './agent';
export * from './command';
export * from './mcp-server';
export * from './stats';

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: any;
}

// Search types
export interface SearchQuery {
  query?: string;
  tags?: string[];
  category?: string;
  author?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'downloads' | 'stars' | 'created' | 'updated' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  results: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: SearchQuery;
}

// Database view types (matches SQL views)
export interface PluginListView {
  id: string;
  name: string;
  description: string;
  stars: number;
  downloads: number;
  status: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  author: string;
  authorAvatar?: string;
  latestVersion?: string;
  tags: string;
}

export interface PopularPluginView {
  id: string;
  name: string;
  description: string;
  author: string;
  downloads: number;
  stars: number;
  tags: string;
}

export interface TrendingPluginView {
  id: string;
  name: string;
  description: string;
  author: string;
  downloads: number;
  stars: number;
  tags: string;
  recentDownloads: number;
}
