/**
 * Database Updater
 * Handles upserts of parsed plugin data into the database
 */

import { eq } from 'drizzle-orm';
import type { DbClient } from '@skillstash/db';
import { plugins, skills, agents, commands, mcpServers } from '@skillstash/db';
import type { ParsedPlugin } from './parser';

export class DatabaseUpdater {
  constructor(private readonly db: DbClient) {}

  /**
   * Upsert a parsed plugin and all its components
   */
  async upsertPlugin(parsed: ParsedPlugin): Promise<string> {
    try {
      console.log(`Upserting plugin: ${parsed.plugin.name}`);

      // Generate plugin ID from repo URL
      const pluginId = this.generatePluginId(parsed.plugin.repoUrl);

      // Upsert plugin
      await this.upsertPluginRecord(pluginId, parsed.plugin);

      // Upsert related components
      await this.upsertSkills(pluginId, parsed.skills);
      await this.upsertAgents(pluginId, parsed.agents);
      await this.upsertCommands(pluginId, parsed.commands);
      await this.upsertMcpServers(pluginId, parsed.mcpServers);

      console.log(`Successfully upserted plugin: ${pluginId}`);
      return pluginId;
    } catch (error) {
      console.error(`Failed to upsert plugin ${parsed.plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Upsert plugin record
   */
  private async upsertPluginRecord(pluginId: string, pluginData: ParsedPlugin['plugin']): Promise<void> {
    // Check if plugin exists
    const existing = await this.db
      .select()
      .from(plugins)
      .where(eq(plugins.id, pluginId))
      .limit(1);

    const now = new Date().toISOString();

    if (existing.length > 0) {
      // Update existing plugin
      await this.db
        .update(plugins)
        .set({
          name: pluginData.name,
          description: pluginData.description,
          author: pluginData.author,
          repoUrl: pluginData.repoUrl,
          stars: pluginData.stars,
          tags: pluginData.tags,
          metadata: pluginData.metadata,
          updatedAt: now,
        })
        .where(eq(plugins.id, pluginId));

      console.log(`Updated existing plugin: ${pluginId}`);
    } else {
      // Insert new plugin
      await this.db.insert(plugins).values({
        id: pluginId,
        name: pluginData.name,
        description: pluginData.description,
        author: pluginData.author,
        repoUrl: pluginData.repoUrl,
        stars: pluginData.stars,
        downloads: pluginData.downloads,
        tags: pluginData.tags,
        metadata: pluginData.metadata,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`Inserted new plugin: ${pluginId}`);
    }
  }

  /**
   * Upsert skills for a plugin
   */
  private async upsertSkills(pluginId: string, skillsData: ParsedPlugin['skills']): Promise<void> {
    if (skillsData.length === 0) return;

    // Delete existing skills for this plugin
    await this.db.delete(skills).where(eq(skills.pluginId, pluginId));

    // Insert new skills
    const skillRecords = skillsData.map((skill, index) => ({
      id: `${pluginId}-skill-${index}`,
      pluginId,
      name: skill.name,
      description: skill.description,
      instructions: skill.description, // Use description as instructions for now
      basePath: skill.filePath,
      isGitignored: false,
      scope: 'project' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (skillRecords.length > 0) {
      await this.db.insert(skills).values(skillRecords);
      console.log(`Inserted ${skillRecords.length} skills for ${pluginId}`);
    }
  }

  /**
   * Upsert agents for a plugin
   */
  private async upsertAgents(pluginId: string, agentsData: ParsedPlugin['agents']): Promise<void> {
    if (agentsData.length === 0) return;

    // Delete existing agents for this plugin
    await this.db.delete(agents).where(eq(agents.pluginId, pluginId));

    // Insert new agents
    const agentRecords = agentsData.map((agent, index) => ({
      id: `${pluginId}-agent-${index}`,
      pluginId,
      name: agent.name,
      role: agent.role,
      expertise: [], // Can be extracted from config
      instructions: agent.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (agentRecords.length > 0) {
      await this.db.insert(agents).values(agentRecords);
      console.log(`Inserted ${agentRecords.length} agents for ${pluginId}`);
    }
  }

  /**
   * Upsert commands for a plugin
   */
  private async upsertCommands(pluginId: string, commandsData: ParsedPlugin['commands']): Promise<void> {
    if (commandsData.length === 0) return;

    // Delete existing commands for this plugin
    await this.db.delete(commands).where(eq(commands.pluginId, pluginId));

    // Insert new commands
    const commandRecords = commandsData.map((command, index) => ({
      id: `${pluginId}-command-${index}`,
      pluginId,
      name: command.name,
      description: command.description,
      prompt: command.description, // Use description as prompt for now
      isGitignored: false,
      scope: 'project' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (commandRecords.length > 0) {
      await this.db.insert(commands).values(commandRecords);
      console.log(`Inserted ${commandRecords.length} commands for ${pluginId}`);
    }
  }

  /**
   * Upsert MCP servers for a plugin
   */
  private async upsertMcpServers(pluginId: string, mcpServersData: ParsedPlugin['mcpServers']): Promise<void> {
    if (mcpServersData.length === 0) return;

    // Delete existing MCP servers for this plugin
    await this.db.delete(mcpServers).where(eq(mcpServers.pluginId, pluginId));

    // Insert new MCP servers
    const mcpServerRecords = mcpServersData.map((server, index) => ({
      id: `${pluginId}-mcp-${index}`,
      pluginId,
      name: server.name,
      description: server.description,
      command: server.endpoint, // Use endpoint as command for now
      args: [],
      env: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (mcpServerRecords.length > 0) {
      await this.db.insert(mcpServers).values(mcpServerRecords);
      console.log(`Inserted ${mcpServerRecords.length} MCP servers for ${pluginId}`);
    }
  }

  /**
   * Generate plugin ID from repo URL
   * Format: owner-repo (e.g., "anthropics-claude-code")
   */
  private generatePluginId(repoUrl: string): string {
    // Extract owner/repo from GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);

    if (!match) {
      throw new Error(`Invalid GitHub repo URL: ${repoUrl}`);
    }

    const [, owner, repo] = match;

    // Remove .git suffix if present
    const cleanRepo = repo.replace(/\.git$/, '');

    // Convert to lowercase and replace special characters
    return `${owner}-${cleanRepo}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  /**
   * Get plugin statistics
   */
  async getPluginStats(): Promise<{
    total: number;
    withSkills: number;
    withAgents: number;
    withCommands: number;
    withMcpServers: number;
  }> {
    const [
      totalResult,
      withSkillsResult,
      withAgentsResult,
      withCommandsResult,
      withMcpServersResult,
    ] = await Promise.all([
      this.db.select().from(plugins),
      this.db.select().from(skills),
      this.db.select().from(agents),
      this.db.select().from(commands),
      this.db.select().from(mcpServers),
    ]);

    // Count unique plugin IDs
    const pluginsWithSkills = new Set(withSkillsResult.map(s => s.pluginId)).size;
    const pluginsWithAgents = new Set(withAgentsResult.map(a => a.pluginId)).size;
    const pluginsWithCommands = new Set(withCommandsResult.map(c => c.pluginId)).size;
    const pluginsWithMcpServers = new Set(withMcpServersResult.map(m => m.pluginId)).size;

    return {
      total: totalResult.length,
      withSkills: pluginsWithSkills,
      withAgents: pluginsWithAgents,
      withCommands: pluginsWithCommands,
      withMcpServers: pluginsWithMcpServers,
    };
  }

  /**
   * Check if plugin exists
   */
  async pluginExists(repoUrl: string): Promise<boolean> {
    const pluginId = this.generatePluginId(repoUrl);
    const result = await this.db
      .select()
      .from(plugins)
      .where(eq(plugins.id, pluginId))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Get last indexed timestamp for a plugin
   */
  async getLastIndexed(repoUrl: string): Promise<string | null> {
    const pluginId = this.generatePluginId(repoUrl);
    const result = await this.db
      .select()
      .from(plugins)
      .where(eq(plugins.id, pluginId))
      .limit(1);

    if (result.length === 0) return null;

    const metadata = result[0].metadata as any;
    return metadata?.lastIndexed || result[0].updatedAt || null;
  }
}
