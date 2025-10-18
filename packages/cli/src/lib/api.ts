/**
 * API Client for SkillStash Registry
 * Handles all communication with the SkillStash API
 */

const API_BASE = process.env.SKILLSTASH_API_URL || 'https://api.skillstash.com';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  repoUrl: string;
  stars: number;
  downloads: number;
  tags?: string[];
  metadata?: {
    version?: string;
    [key: string]: any;
  };
  skills?: any[];
  agents?: any[];
  commands?: any[];
  mcpServers?: any[];
}

export interface SearchResponse {
  data: Plugin[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ListResponse {
  data: Plugin[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

/**
 * Search for plugins by query
 */
export async function searchPlugins(
  query: string,
  limit: number = 10
): Promise<SearchResponse> {
  const url = new URL(`${API_BASE}/api/plugins/search`);
  url.searchParams.append('q', query);
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  return response.json() as Promise<SearchResponse>;
}

/**
 * Get a specific plugin by ID
 */
export async function getPlugin(id: string): Promise<Plugin> {
  const response = await fetch(`${API_BASE}/api/plugins/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Plugin "${id}" not found`);
    }
    throw new Error(`Failed to fetch plugin: ${response.statusText}`);
  }

  const result = (await response.json()) as { data: Plugin };
  return result.data;
}

/**
 * List all plugins with pagination
 */
export async function listPlugins(
  page: number = 1,
  limit: number = 20
): Promise<ListResponse> {
  const url = new URL(`${API_BASE}/api/plugins`);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to list plugins: ${response.statusText}`);
  }

  return response.json() as Promise<ListResponse>;
}

/**
 * Get trending plugins
 */
export async function getTrending(limit: number = 10): Promise<Plugin[]> {
  const url = new URL(`${API_BASE}/api/discovery/trending`);
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to get trending plugins: ${response.statusText}`);
  }

  const result = (await response.json()) as { data: Plugin[] };
  return result.data;
}

/**
 * Publish a plugin to the registry
 */
export async function publishPlugin(metadata: any): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/api/plugins/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: string };
    throw new Error(error.error || 'Failed to publish plugin');
  }

  return response.json() as Promise<{ success: boolean; message: string }>;
}
