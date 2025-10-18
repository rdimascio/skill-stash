/**
 * Validation schemas for plugin data
 */

import { z } from 'zod';

export const pluginSchema = z.object({
  name: z.string().min(1, 'Plugin name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  author: z.string().min(1, 'Author is required'),
  repoUrl: z.string().url('Invalid repository URL'),
  stars: z.number().min(0, 'Stars must be non-negative'),
  downloads: z.number().min(0, 'Downloads must be non-negative'),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  description: z.string().min(1, 'Skill description is required'),
  filePath: z.string().min(1, 'File path is required'),
  config: z.record(z.unknown()).default({}),
});

export const agentSchema = z.object({
  name: z.string().min(1, 'Agent name is required'),
  description: z.string().min(1, 'Agent description is required'),
  role: z.string().min(1, 'Agent role is required'),
  filePath: z.string().min(1, 'File path is required'),
  config: z.record(z.unknown()).default({}),
});

export const commandSchema = z.object({
  name: z.string().min(1, 'Command name is required'),
  description: z.string().min(1, 'Command description is required'),
  handler: z.string().min(1, 'Command handler is required'),
  options: z.record(z.unknown()).default({}),
});

export const mcpServerSchema = z.object({
  name: z.string().min(1, 'MCP server name is required'),
  description: z.string().min(1, 'MCP server description is required'),
  endpoint: z.string().min(1, 'Endpoint is required'),
  config: z.record(z.unknown()).default({}),
});

export const parsedPluginSchema = z.object({
  plugin: pluginSchema,
  skills: z.array(skillSchema).default([]),
  agents: z.array(agentSchema).default([]),
  commands: z.array(commandSchema).default([]),
  mcpServers: z.array(mcpServerSchema).default([]),
});

/**
 * Validate a parsed plugin
 */
export function validatePlugin(data: unknown): {
  success: boolean;
  data?: z.infer<typeof parsedPluginSchema>;
  errors?: string[];
} {
  const result = parsedPluginSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const errors = result.error.errors.map(
    err => `${err.path.join('.')}: ${err.message}`
  );

  return {
    success: false,
    errors,
  };
}
