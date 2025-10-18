/**
 * GitHub API Client
 * Handles all interactions with the GitHub API for repository discovery and file fetching
 */

export interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  language: string | null;
  default_branch: string;
}

export interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

export interface GitHubContent {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  download_url: string | null;
  html_url: string;
}

export class GitHubClient {
  private readonly baseUrl = 'https://api.github.com';
  private readonly userAgent = 'SkillStash-Indexer/1.0';

  constructor(private readonly token: string) {
    if (!token) {
      throw new Error('GitHub token is required');
    }
  }

  /**
   * Search for repositories with Claude Code topics
   */
  async searchClaudeCodeRepos(page: number = 1, perPage: number = 100): Promise<GitHubRepo[]> {
    const query = 'topic:claude-code OR topic:claude-plugin';
    const url = `${this.baseUrl}/search/repositories?q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&sort=updated`;

    try {
      const response = await this.makeRequest<GitHubSearchResponse>(url);
      return response.items;
    } catch (error) {
      console.error('Failed to search repositories:', error);
      throw error;
    }
  }

  /**
   * Get file content from a repository
   */
  async getFileContent(repo: string, path: string, branch?: string): Promise<string | null> {
    const branchParam = branch ? `?ref=${branch}` : '';
    const url = `${this.baseUrl}/repos/${repo}/contents/${path}${branchParam}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      // GitHub Content API returns base64 encoded content
      const data = await response.json() as any;

      if (data.content) {
        // Decode base64 content
        return atob(data.content.replace(/\n/g, ''));
      }

      return null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      console.error(`Failed to fetch ${path} from ${repo}:`, error);
      throw error;
    }
  }

  /**
   * Get README content
   */
  async getReadme(repo: string, branch?: string): Promise<string | null> {
    // Try README.md first, then README
    const readmeVariants = ['README.md', 'readme.md', 'README', 'readme'];

    for (const variant of readmeVariants) {
      const content = await this.getFileContent(repo, variant, branch);
      if (content) {
        return content;
      }
    }

    return null;
  }

  /**
   * Get CLAUDE.md content
   */
  async getClaudeMd(repo: string, branch?: string): Promise<string | null> {
    const claudeVariants = ['CLAUDE.md', 'claude.md'];

    for (const variant of claudeVariants) {
      const content = await this.getFileContent(repo, variant, branch);
      if (content) {
        return content;
      }
    }

    return null;
  }

  /**
   * Get directory contents
   */
  async getDirectoryContents(repo: string, path: string, branch?: string): Promise<GitHubContent[] | null> {
    const branchParam = branch ? `?ref=${branch}` : '';
    const url = `${this.baseUrl}/repos/${repo}/contents/${path}${branchParam}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as GitHubContent[];
      return Array.isArray(data) ? data : null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      console.error(`Failed to fetch directory ${path} from ${repo}:`, error);
      throw error;
    }
  }

  /**
   * Get .claude directory structure
   */
  async getClaudeDirectory(repo: string, branch?: string): Promise<{
    skills: GitHubContent[];
    agents: GitHubContent[];
    commands: GitHubContent[];
    mcpServers: GitHubContent[];
  } | null> {
    try {
      const claudeDir = await this.getDirectoryContents(repo, '.claude', branch);

      if (!claudeDir) {
        return null;
      }

      // Get subdirectories
      const skillsDir = await this.getDirectoryContents(repo, '.claude/skills', branch) || [];
      const agentsDir = await this.getDirectoryContents(repo, '.claude/agents', branch) || [];
      const commandsDir = await this.getDirectoryContents(repo, '.claude/commands', branch) || [];
      const mcpServersDir = await this.getDirectoryContents(repo, '.claude/mcp-servers', branch) || [];

      return {
        skills: skillsDir.filter(f => f.type === 'file' && f.name.endsWith('.md')),
        agents: agentsDir.filter(f => f.type === 'file' && f.name.endsWith('.md')),
        commands: commandsDir.filter(f => f.type === 'file' && f.name.endsWith('.md')),
        mcpServers: mcpServersDir.filter(f => f.type === 'file' && (f.name.endsWith('.md') || f.name.endsWith('.json'))),
      };
    } catch (error) {
      console.error(`Failed to get .claude directory from ${repo}:`, error);
      return null;
    }
  }

  /**
   * Get repository information
   */
  async getRepository(repo: string): Promise<GitHubRepo> {
    const url = `${this.baseUrl}/repos/${repo}`;
    return this.makeRequest<GitHubRepo>(url);
  }

  /**
   * Check API rate limit
   */
  async getRateLimit(): Promise<{
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const url = `${this.baseUrl}/rate_limit`;
    const response = await this.makeRequest<any>(url);
    return response.rate;
  }

  /**
   * Make authenticated request to GitHub API
   */
  private async makeRequest<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}\n${errorBody}`
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get request headers with authentication
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': this.userAgent,
    };
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on 404 or authentication errors
      if (lastError.message.includes('404') || lastError.message.includes('401')) {
        throw lastError;
      }

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
