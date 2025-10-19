const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.skillstash.com';
const INDEXER_BASE = process.env.NEXT_PUBLIC_INDEXER_URL || 'https://indexer.skillstash.com';

export interface Plugin {
  id: string;
  slug: string;
  name: string;
  description: string;
  repository_url: string;
  stars: number;
  downloads: number;
  category: string;
  tags: string[];
  author: string;
  author_url: string;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface PluginComponent {
  name?: string;
  description?: string;
}

export interface PluginDetail extends Plugin {
  readme: string;
  skills: PluginComponent[];
  agents: PluginComponent[];
  commands: PluginComponent[];
  mcp_servers: PluginComponent[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  category?: string;
  sort?: 'stars' | 'downloads' | 'recent';
}

/**
 * Get a paginated list of plugins
 */
export async function getPlugins(options: SearchOptions = {}): Promise<PaginatedResponse<Plugin>> {
  const params = new URLSearchParams();

  if (options.page) params.set('offset', String((options.page - 1) * (options.limit || 20)));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.category) params.set('category', options.category);
  if (options.sort) {
    switch (options.sort) {
      case 'stars':
        params.set('sort', 'stars');
        break;
      case 'downloads':
        params.set('sort', 'downloads');
        break;
      case 'recent':
        params.set('sort', 'updated_at');
        break;
    }
  }

  const response = await fetch(`${API_BASE}/api/plugins?${params}`, {
    next: { revalidate: 300 } // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch plugins: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a single plugin by ID or slug
 */
export async function getPlugin(idOrSlug: string): Promise<PluginDetail | null> {
  const response = await fetch(`${API_BASE}/api/plugins/${idOrSlug}`, {
    next: { revalidate: 60 }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch plugin: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search plugins by query
 */
export async function searchPlugins(query: string, options: SearchOptions = {}): Promise<PaginatedResponse<Plugin>> {
  const params = new URLSearchParams();
  params.set('q', query);

  if (options.page) params.set('offset', String((options.page - 1) * (options.limit || 20)));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.category) params.set('category', options.category);

  const response = await fetch(
    `${API_BASE}/api/plugins/search?${params}`,
    { next: { revalidate: 60 } }
  );

  if (!response.ok) {
    throw new Error(`Failed to search plugins: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get featured plugins
 */
export async function getFeaturedPlugins(limit: number = 6): Promise<Plugin[]> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('sort', 'stars');

  const response = await fetch(`${API_BASE}/api/plugins?${params}`, {
    next: { revalidate: 600 } // Cache for 10 minutes
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch featured plugins: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get available categories
 */
export async function getCategories(): Promise<string[]> {
  // This would ideally come from the API, but for now we'll use a static list
  return [
    'Development',
    'Testing',
    'Documentation',
    'Deployment',
    'Security',
    'Quality',
    'Utilities'
  ];
}

/**
 * Import a plugin from GitHub
 */
export async function importPlugin(repoUrl: string): Promise<{ message: string; plugin_id?: string }> {
  // Parse GitHub URL
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub URL. Please provide a valid GitHub repository URL.');
  }

  const [, owner, repo] = match;
  const cleanRepo = repo.replace(/\.git$/, '');

  const response = await fetch(
    `${INDEXER_BASE}/index/${owner}/${cleanRepo}`,
    {
      method: 'POST',
      cache: 'no-store'
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Import failed. Please try again.');
  }

  return data;
}

/**
 * Get plugin statistics
 */
export async function getStats(): Promise<{
  total_plugins: number;
  total_downloads: number;
  total_stars: number;
}> {
  const response = await fetch(`${API_BASE}/api/stats`, {
    next: { revalidate: 600 }
  });

  if (!response.ok) {
    // Return default stats if API fails
    return {
      total_plugins: 0,
      total_downloads: 0,
      total_stars: 0
    };
  }

  return response.json();
}
