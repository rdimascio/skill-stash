import { type DbClient } from './client';
import { plugins, authors, skills, agents, commands, mcpServers, pluginVersions, pluginTags } from './schema';

/**
 * Seeds the database with sample data for development and testing
 */
export async function seed(db: DbClient) {
  console.log('Seeding database...');

  // Insert sample authors
  await db.insert(authors).values([
    {
      id: 'anthropic',
      username: 'anthropic',
      email: 'dev@anthropic.com',
      githubUrl: 'https://github.com/anthropics',
      bio: 'Anthropic - AI safety company'
    },
    {
      id: 'skillstash',
      username: 'skillstash',
      email: 'hello@skillstash.com',
      githubUrl: 'https://github.com/skillstash',
      bio: 'SkillStash official plugins'
    }
  ]);
  console.log('✓ Inserted authors');

  // Insert sample plugins
  await db.insert(plugins).values([
    {
      id: 'git-workflow',
      name: 'Git Workflow',
      description: 'Professional git workflow with conventional commits and branch-based development',
      author: 'skillstash',
      repoUrl: 'https://github.com/skillstash/git-workflow',
      stars: 150,
      downloads: 1200,
      tags: ['git', 'workflow', 'version-control'],
      metadata: {
        license: 'MIT',
        homepage: 'https://skillstash.com/plugins/git-workflow'
      }
    },
    {
      id: 'api-builder',
      name: 'API Builder',
      description: 'Build RESTful APIs with best practices and OpenAPI documentation',
      author: 'skillstash',
      repoUrl: 'https://github.com/skillstash/api-builder',
      stars: 320,
      downloads: 2500,
      tags: ['api', 'rest', 'backend'],
      metadata: {
        license: 'MIT',
        homepage: 'https://skillstash.com/plugins/api-builder'
      }
    },
    {
      id: 'react-components',
      name: 'React Components',
      description: 'Modern React component library with TypeScript and Tailwind CSS',
      author: 'anthropic',
      repoUrl: 'https://github.com/anthropics/react-components',
      stars: 580,
      downloads: 4200,
      tags: ['react', 'components', 'ui', 'typescript'],
      metadata: {
        license: 'Apache-2.0',
        homepage: 'https://anthropic.com'
      }
    }
  ]);
  console.log('✓ Inserted plugins');

  // Insert plugin versions
  await db.insert(pluginVersions).values([
    {
      id: 'git-workflow-v1.0.0',
      pluginId: 'git-workflow',
      version: '1.0.0',
      changelog: 'Initial release with git skill and conventional commits'
    },
    {
      id: 'api-builder-v1.0.0',
      pluginId: 'api-builder',
      version: '1.0.0',
      changelog: 'Initial release with REST API scaffolding'
    },
    {
      id: 'react-components-v2.1.0',
      pluginId: 'react-components',
      version: '2.1.0',
      changelog: 'Added dark mode support and accessibility improvements'
    }
  ]);
  console.log('✓ Inserted plugin versions');

  // Insert plugin tags
  await db.insert(pluginTags).values([
    { id: 'tag-1', pluginId: 'git-workflow', tag: 'git' },
    { id: 'tag-2', pluginId: 'git-workflow', tag: 'workflow' },
    { id: 'tag-3', pluginId: 'api-builder', tag: 'api' },
    { id: 'tag-4', pluginId: 'api-builder', tag: 'backend' },
    { id: 'tag-5', pluginId: 'react-components', tag: 'react' },
    { id: 'tag-6', pluginId: 'react-components', tag: 'ui' }
  ]);
  console.log('✓ Inserted plugin tags');

  // Insert sample skills
  await db.insert(skills).values([
    {
      id: 'git-skill',
      pluginId: 'git-workflow',
      name: 'git',
      description: 'Git workflow with branch-based development',
      instructions: 'Professional git workflow following conventional commits',
      basePath: '.claude/skills/git',
      isGitignored: false,
      scope: 'project'
    },
    {
      id: 'api-skill',
      pluginId: 'api-builder',
      name: 'api',
      description: 'RESTful API development',
      instructions: 'Build REST APIs with OpenAPI docs',
      basePath: '.claude/skills/api',
      isGitignored: false,
      scope: 'project'
    }
  ]);
  console.log('✓ Inserted skills');

  // Insert sample agents
  await db.insert(agents).values([
    {
      id: 'backend-agent',
      pluginId: 'api-builder',
      name: 'Backend Specialist',
      role: 'Backend Infrastructure Specialist',
      expertise: ['api', 'database', 'cloudflare', 'typescript'],
      instructions: 'Expert in building scalable backend systems'
    },
    {
      id: 'frontend-agent',
      pluginId: 'react-components',
      name: 'Frontend Specialist',
      role: 'Frontend UI Specialist',
      expertise: ['react', 'typescript', 'tailwind', 'accessibility'],
      instructions: 'Expert in building modern React applications'
    }
  ]);
  console.log('✓ Inserted agents');

  // Insert sample commands
  await db.insert(commands).values([
    {
      id: 'git-commit-cmd',
      pluginId: 'git-workflow',
      name: '/commit',
      description: 'Create a git commit with conventional format',
      prompt: 'Create a git commit following conventional commit format',
      isGitignored: false,
      scope: 'project'
    },
    {
      id: 'api-endpoint-cmd',
      pluginId: 'api-builder',
      name: '/add-endpoint',
      description: 'Add a new API endpoint',
      prompt: 'Create a new REST API endpoint with validation and tests',
      isGitignored: false,
      scope: 'project'
    }
  ]);
  console.log('✓ Inserted commands');

  // Insert sample MCP servers
  await db.insert(mcpServers).values([
    {
      id: 'github-mcp',
      pluginId: 'git-workflow',
      name: 'GitHub MCP',
      description: 'GitHub integration for Claude Code',
      command: 'gh',
      args: ['mcp'],
      env: { GITHUB_TOKEN: '' }
    }
  ]);
  console.log('✓ Inserted MCP servers');

  console.log('Database seeding completed successfully!');
}

/**
 * Seed script for local development
 * Run with: pnpm db:seed:local
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running seed script...');
  // This would need to be called with a proper D1 database instance
  console.log('Note: This seed function needs to be called from a worker with D1 binding');
}
