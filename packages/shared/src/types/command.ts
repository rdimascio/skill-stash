/**
 * Command Types
 * Matches the `commands` table schema
 */

export interface CommandParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
}

export interface CommandExample {
  description: string;
  command: string;
  output?: string;
}

export interface Command {
  id: string;
  pluginId: string;
  name: string;
  description: string;
  filePath: string; // Relative path to command file
  handler?: string; // Function/method name
  parameters?: CommandParameter[]; // Parsed from JSON
  examples?: CommandExample[]; // Parsed from JSON
  metadata?: Record<string, any>; // JSON configuration
  createdAt: string;
}

export interface CreateCommandInput {
  id: string;
  pluginId: string;
  name: string;
  description: string;
  filePath: string;
  handler?: string;
  parameters?: CommandParameter[];
  examples?: CommandExample[];
  metadata?: Record<string, any>;
}

export interface UpdateCommandInput {
  description?: string;
  filePath?: string;
  handler?: string;
  parameters?: CommandParameter[];
  examples?: CommandExample[];
  metadata?: Record<string, any>;
}

export interface CommandWithPlugin extends Command {
  plugin: {
    name: string;
    author: string;
  };
}
