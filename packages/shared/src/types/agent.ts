/**
 * Agent Types
 * Matches the `agents` table schema
 */

export interface Agent {
  id: string;
  pluginId: string;
  name: string;
  description: string;
  role: string;
  expertise?: string[]; // Parsed from JSON
  tools?: string[]; // Parsed from JSON
  instructions?: string;
  metadata?: Record<string, any>; // JSON configuration
  createdAt: string;
}

export interface CreateAgentInput {
  id: string;
  pluginId: string;
  name: string;
  description: string;
  role: string;
  expertise?: string[];
  tools?: string[];
  instructions?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAgentInput {
  description?: string;
  role?: string;
  expertise?: string[];
  tools?: string[];
  instructions?: string;
  metadata?: Record<string, any>;
}

export interface AgentWithPlugin extends Agent {
  plugin: {
    name: string;
    author: string;
  };
}
