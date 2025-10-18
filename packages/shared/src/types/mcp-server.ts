/**
 * MCP Server Types
 * Matches the `mcp_servers` table schema
 */

export type MCPTransport = 'stdio' | 'http' | 'websocket';

export type MCPCapability = 'prompts' | 'resources' | 'tools';

export interface MCPServer {
  id: string;
  pluginId: string;
  name: string;
  description: string;
  transport: MCPTransport;
  command?: string; // Command to start the server (stdio)
  url?: string; // URL for HTTP/WebSocket servers
  config?: Record<string, any>; // Parsed from JSON
  capabilities?: MCPCapability[]; // Parsed from JSON
  metadata?: Record<string, any>; // JSON configuration
  createdAt: string;
}

export interface CreateMCPServerInput {
  id: string;
  pluginId: string;
  name: string;
  description: string;
  transport: MCPTransport;
  command?: string;
  url?: string;
  config?: Record<string, any>;
  capabilities?: MCPCapability[];
  metadata?: Record<string, any>;
}

export interface UpdateMCPServerInput {
  description?: string;
  transport?: MCPTransport;
  command?: string;
  url?: string;
  config?: Record<string, any>;
  capabilities?: MCPCapability[];
  metadata?: Record<string, any>;
}

export interface MCPServerWithPlugin extends MCPServer {
  plugin: {
    name: string;
    author: string;
  };
}
