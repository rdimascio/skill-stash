/**
 * Skill Types
 * Matches the `skills` table schema
 */

export interface Skill {
  id: string;
  pluginId: string;
  name: string;
  description: string;
  filePath: string; // Relative path within plugin
  instructions?: string;
  metadata?: Record<string, any>; // JSON configuration
  createdAt: string;
}

export interface CreateSkillInput {
  id: string;
  pluginId: string;
  name: string;
  description: string;
  filePath: string;
  instructions?: string;
  metadata?: Record<string, any>;
}

export interface UpdateSkillInput {
  description?: string;
  filePath?: string;
  instructions?: string;
  metadata?: Record<string, any>;
}

export interface SkillWithPlugin extends Skill {
  plugin: {
    name: string;
    author: string;
  };
}
