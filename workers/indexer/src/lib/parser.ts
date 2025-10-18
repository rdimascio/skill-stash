/**
 * Plugin Parser
 * Extracts plugin metadata from GitHub repositories
 */

import type { GitHubRepo, GitHubContent, GitHubClient } from './github';

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
   * Parse CLAUDE.md for plugin metadata
   */
  parseClaudeMd(content: string): Partial<ParsedPlugin['plugin']> {
    const metadata: Partial<ParsedPlugin['plugin']> = {};

    // Extract first heading as potential plugin name
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      metadata.name = headingMatch[1].trim();
    }

    // Extract description from first paragraph after heading
    const descMatch = content.match(/^#.+\n\n(.+?)(\n\n|$)/s);
    if (descMatch) {
      metadata.description = descMatch[1].trim().replace(/\n/g, ' ');
    }

    // Extract tags from topics section
    const topicsMatch = content.match(/##\s+Topics?\s*\n\n(.+?)(\n\n##|$)/is);
    if (topicsMatch) {
      const topics = topicsMatch[1]
        .split(/[,\n]/)
        .map(t => t.trim().replace(/^[-*]\s*/, ''))
        .filter(t => t.length > 0);
      metadata.tags = topics;
    }

    return metadata;
  }

  /**
   * Parse skill files from .claude/skills/
   */
  async parseSkills(files: GitHubContent[], githubClient: GitHubClient, repo: string): Promise<ParsedPlugin['skills']> {
    const skills: ParsedPlugin['skills'] = [];

    for (const file of files) {
      try {
        const content = await githubClient.getFileContent(repo, file.path);
        if (!content) continue;

        // Extract name from filename
        const name = file.name.replace(/\.md$/, '');

        // Extract description from first paragraph
        const descMatch = content.match(/^#.+\n\n(.+?)(\n\n|$)/s);
        const description = descMatch
          ? descMatch[1].trim().replace(/\n/g, ' ')
          : 'No description available';

        // Extract config from frontmatter or metadata section
        const config = this.extractMetadata(content);

        skills.push({
          name,
          description,
          filePath: file.path,
          config,
        });
      } catch (error) {
        console.error(`Failed to parse skill ${file.name}:`, error);
      }
    }

    return skills;
  }

  /**
   * Parse agent files from .claude/agents/
   */
  async parseAgents(files: GitHubContent[], githubClient: GitHubClient, repo: string): Promise<ParsedPlugin['agents']> {
    const agents: ParsedPlugin['agents'] = [];

    for (const file of files) {
      try {
        const content = await githubClient.getFileContent(repo, file.path);
        if (!content) continue;

        const name = file.name.replace(/\.md$/, '');

        // Extract role from heading or metadata
        const roleMatch = content.match(/##\s+Role\s*\n\n(.+?)(\n\n|$)/is);
        const role = roleMatch ? roleMatch[1].trim() : 'General Agent';

        // Extract description
        const descMatch = content.match(/^#.+\n\n(.+?)(\n\n|$)/s);
        const description = descMatch
          ? descMatch[1].trim().replace(/\n/g, ' ')
          : 'No description available';

        const config = this.extractMetadata(content);

        agents.push({
          name,
          description,
          role,
          filePath: file.path,
          config,
        });
      } catch (error) {
        console.error(`Failed to parse agent ${file.name}:`, error);
      }
    }

    return agents;
  }

  /**
   * Parse command files from .claude/commands/
   */
  async parseCommands(files: GitHubContent[], githubClient: GitHubClient, repo: string): Promise<ParsedPlugin['commands']> {
    const commands: ParsedPlugin['commands'] = [];

    for (const file of files) {
      try {
        const content = await githubClient.getFileContent(repo, file.path);
        if (!content) continue;

        const name = file.name.replace(/\.md$/, '');

        // Extract description
        const descMatch = content.match(/^#.+\n\n(.+?)(\n\n|$)/s);
        const description = descMatch
          ? descMatch[1].trim().replace(/\n/g, ' ')
          : 'No description available';

        // Extract options from metadata or usage section
        const options = this.extractMetadata(content);

        commands.push({
          name,
          description,
          handler: file.path,
          options,
        });
      } catch (error) {
        console.error(`Failed to parse command ${file.name}:`, error);
      }
    }

    return commands;
  }

  /**
   * Parse MCP server configs from .claude/mcp-servers/
   */
  async parseMcpServers(files: GitHubContent[], githubClient: GitHubClient, repo: string): Promise<ParsedPlugin['mcpServers']> {
    const mcpServers: ParsedPlugin['mcpServers'] = [];

    for (const file of files) {
      try {
        const content = await githubClient.getFileContent(repo, file.path);
        if (!content) continue;

        const name = file.name.replace(/\.(md|json)$/, '');

        if (file.name.endsWith('.json')) {
          // Parse JSON config
          const config = JSON.parse(content);
          mcpServers.push({
            name: config.name || name,
            description: config.description || 'No description available',
            endpoint: config.endpoint || '',
            config,
          });
        } else {
          // Parse markdown
          const descMatch = content.match(/^#.+\n\n(.+?)(\n\n|$)/s);
          const description = descMatch
            ? descMatch[1].trim().replace(/\n/g, ' ')
            : 'No description available';

          const config = this.extractMetadata(content);

          mcpServers.push({
            name,
            description,
            endpoint: config.endpoint as string || '',
            config,
          });
        }
      } catch (error) {
        console.error(`Failed to parse MCP server ${file.name}:`, error);
      }
    }

    return mcpServers;
  }

  /**
   * Extract tags from topics and content
   */
  extractTags(repo: GitHubRepo, claudeMd?: string): string[] {
    const tags = new Set<string>();

    // Add GitHub topics
    repo.topics.forEach(t => tags.add(t));

    // Extract tags from CLAUDE.md
    if (claudeMd) {
      const parsedMeta = this.parseClaudeMd(claudeMd);
      if (parsedMeta.tags) {
        parsedMeta.tags.forEach(t => tags.add(t));
      }
    }

    // Add language tag if available
    if (repo.language) {
      tags.add(repo.language.toLowerCase());
    }

    return Array.from(tags);
  }

  /**
   * Parse full plugin from GitHub repo
   */
  async parsePlugin(repo: GitHubRepo, githubClient: GitHubClient): Promise<ParsedPlugin | null> {
    try {
      console.log(`Parsing plugin: ${repo.full_name}`);

      // Get CLAUDE.md (optional but recommended)
      const claudeMd = await githubClient.getClaudeMd(repo.full_name);

      // Parse basic metadata
      const claudeMeta = claudeMd ? this.parseClaudeMd(claudeMd) : {};

      // Build plugin object
      const plugin: ParsedPlugin['plugin'] = {
        name: claudeMeta.name || repo.name,
        description: claudeMeta.description || repo.description || 'No description provided',
        author: repo.owner.login,
        repoUrl: repo.html_url,
        stars: repo.stargazers_count,
        downloads: 0, // Will be tracked separately
        tags: this.extractTags(repo, claudeMd || undefined),
        metadata: {
          topics: repo.topics,
          language: repo.language,
          defaultBranch: repo.default_branch,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          pushedAt: repo.pushed_at,
          lastIndexed: new Date().toISOString(),
          hasClaudeMd: !!claudeMd,
        },
      };

      // Get .claude directory structure
      const claudeDir = await githubClient.getClaudeDirectory(repo.full_name);

      let skills: ParsedPlugin['skills'] = [];
      let agents: ParsedPlugin['agents'] = [];
      let commands: ParsedPlugin['commands'] = [];
      let mcpServers: ParsedPlugin['mcpServers'] = [];

      if (claudeDir) {
        // Parse each component type
        skills = await this.parseSkills(claudeDir.skills, githubClient, repo.full_name);
        agents = await this.parseAgents(claudeDir.agents, githubClient, repo.full_name);
        commands = await this.parseCommands(claudeDir.commands, githubClient, repo.full_name);
        mcpServers = await this.parseMcpServers(claudeDir.mcpServers, githubClient, repo.full_name);

        console.log(
          `Parsed ${skills.length} skills, ${agents.length} agents, ${commands.length} commands, ${mcpServers.length} MCP servers`
        );
      } else {
        console.log(`No .claude directory found in ${repo.full_name}`);
      }

      return {
        plugin,
        skills,
        agents,
        commands,
        mcpServers,
      };
    } catch (error) {
      console.error(`Failed to parse plugin ${repo.full_name}:`, error);
      return null;
    }
  }

  /**
   * Extract metadata from markdown frontmatter or metadata sections
   */
  private extractMetadata(content: string): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    // Try to extract YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
    if (frontmatterMatch) {
      try {
        // Simple key-value parser (not full YAML)
        const lines = frontmatterMatch[1].split('\n');
        for (const line of lines) {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            const value = valueParts.join(':').trim();
            metadata[key.trim()] = value;
          }
        }
      } catch (error) {
        console.error('Failed to parse frontmatter:', error);
      }
    }

    // Extract metadata from JSON code blocks
    const jsonMatch = content.match(/```json\n([\s\S]+?)\n```/);
    if (jsonMatch) {
      try {
        const json = JSON.parse(jsonMatch[1]);
        Object.assign(metadata, json);
      } catch (error) {
        console.error('Failed to parse JSON metadata:', error);
      }
    }

    return metadata;
  }
}
