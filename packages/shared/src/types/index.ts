// Plugin types
export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  repository: string;
  tags: string[];
  type: 'skill' | 'agent' | 'command' | 'mcp-server';
  createdAt: string;
  updatedAt: string;
  stars: number;
  downloads: number;
}

// Skill types
export interface Skill {
  name: string;
  description: string;
  instructions: string;
  location: 'user' | 'project';
}

// Agent types
export interface Agent {
  name: string;
  description: string;
  role: string;
  expertise: string[];
}

// Command types
export interface Command {
  name: string;
  description: string;
  args?: string[];
  flags?: Record<string, string>;
}

// MCP Server types
export interface MCPServer {
  name: string;
  description: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Search result types
export interface SearchResult {
  plugins: Plugin[];
  total: number;
  page: number;
  pageSize: number;
}
