/**
 * Plugin Parser
 * Extracts plugin metadata from marketplace.json
 */

import type { GitHubRepo, GitHubClient, MarketplaceJson } from './github';

export interface ParsedPlugin {
  plugin: {
    name: string;
    description: string;
    author: string;
    repoUrl: string;
    stars: number;
    downloads: number;
    tags: string[];
    metadata: Record<string, unknown>;
  };
  skills: Array<{
    name: string;
    description: string;
    filePath: string;
    config: Record<string, unknown>;
  }>;
  agents: Array<{
    name: string;
    description: string;
    role: string;
    filePath: string;
    config: Record<string, unknown>;
  }>;
  commands: Array<{
    name: string;
    description: string;
    handler: string;
    options: Record<string, unknown>;
  }>;
  mcpServers: Array<{
    name: string;
    description: string;
    endpoint: string;
    config: Record<string, unknown>;
  }>;
}

export class PluginParser {
  /**
   * Parse plugin from marketplace.json and GitHub repo metadata
   */
  parseFromMarketplaceJson(marketplaceJson: MarketplaceJson, repo: GitHubRepo): ParsedPlugin {
    // Build plugin object
    const plugin: ParsedPlugin['plugin'] = {
      name: marketplaceJson.name,
      description: marketplaceJson.description,
      author: marketplaceJson.author.name || repo.owner.login,
      repoUrl: marketplaceJson.repository.url || repo.html_url,
      stars: repo.stargazers_count,
      downloads: 0, // Will be tracked separately
      tags: this.extractTags(marketplaceJson, repo),
      metadata: {
        version: marketplaceJson.version,
        authorEmail: marketplaceJson.author.email,
        authorUrl: marketplaceJson.author.url,
        topics: repo.topics,
        language: repo.language,
        defaultBranch: repo.default_branch,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
        lastIndexed: new Date().toISOString(),
      },
    };

    // Map skills from marketplace.json
    const skills = (marketplaceJson.skills || []).map((skill) => ({
      name: skill.name,
      description: skill.description,
      filePath: skill.filePath,
      config: (skill.config || {}) as Record<string, unknown>,
    }));

    // Map agents from marketplace.json
    const agents = (marketplaceJson.agents || []).map((agent) => ({
      name: agent.name,
      description: agent.description,
      role: agent.description, // Use description as role for now
      filePath: agent.name, // Use name as filePath placeholder
      config: (agent.config || {}) as Record<string, unknown>,
    }));

    // Map commands from marketplace.json
    const commands = (marketplaceJson.commands || []).map((command) => ({
      name: command.name,
      description: command.description,
      handler: command.handler,
      options: (command.options || {}) as Record<string, unknown>,
    }));

    // Map MCP servers from marketplace.json
    const mcpServers = (marketplaceJson.mcpServers || []).map((server) => ({
      name: server.name,
      description: server.description,
      endpoint: server.transport, // Use transport as endpoint for now
      config: server.config as Record<string, unknown>,
    }));

    return {
      plugin,
      skills,
      agents,
      commands,
      mcpServers,
    };
  }

  /**
   * Extract tags from marketplace.json and GitHub repo
   */
  private extractTags(marketplaceJson: MarketplaceJson, repo: GitHubRepo): string[] {
    const tags = new Set<string>();

    // Add keywords from marketplace.json
    if (marketplaceJson.keywords) {
      marketplaceJson.keywords.forEach((k) => tags.add(k));
    }

    // Add GitHub topics
    repo.topics.forEach((t) => tags.add(t));

    // Add language tag if available
    if (repo.language) {
      tags.add(repo.language.toLowerCase());
    }

    return Array.from(tags);
  }

  /**
   * Main parse method - fetches marketplace.json and parses it
   */
  async parsePlugin(repo: GitHubRepo, githubClient: GitHubClient): Promise<ParsedPlugin | null> {
    try {
      console.log(`Parsing plugin: ${repo.full_name}`);

      // Get marketplace.json
      const marketplaceJson = await githubClient.getMarketplaceJson(repo.full_name);

      if (!marketplaceJson) {
        console.log(`No marketplace.json found for ${repo.full_name}`);
        return null;
      }

      // Parse from marketplace.json
      const parsed = this.parseFromMarketplaceJson(marketplaceJson, repo);

      console.log(
        `Parsed ${parsed.skills.length} skills, ${parsed.agents.length} agents, ${parsed.commands.length} commands, ${parsed.mcpServers.length} MCP servers`
      );

      return parsed;
    } catch (error) {
      console.error(`Failed to parse ${repo.full_name}:`, error);
      return null;
    }
  }
}
