/**
 * Init Command
 * Initialize a new plugin project
 */

import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs/promises';

export async function initCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n📦 Initialize new plugin\n'));

  const response = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'Plugin name:',
      validate: (value) => (value.length > 0 ? true : 'Name is required'),
    },
    {
      type: 'text',
      name: 'description',
      message: 'Description:',
      validate: (value) =>
        value.length >= 10
          ? true
          : 'Description must be at least 10 characters',
    },
    {
      type: 'text',
      name: 'author',
      message: 'Author:',
      initial: process.env.USER || '',
    },
    {
      type: 'text',
      name: 'repoUrl',
      message: 'Repository URL:',
      validate: (value) =>
        value.includes('github.com') ? true : 'Must be a GitHub URL',
    },
    {
      type: 'multiselect',
      name: 'components',
      message: 'What components will this plugin include?',
      choices: [
        { title: 'Skills', value: 'skills', selected: false },
        { title: 'Agents', value: 'agents', selected: false },
        { title: 'Commands', value: 'commands', selected: false },
        { title: 'MCP Servers', value: 'mcpServers', selected: false },
      ],
      min: 1,
    },
  ]);

  if (!response.name) {
    console.log(chalk.red('\nCancelled'));
    return;
  }

  // Create marketplace.json
  const marketplace: any = {
    name: response.name,
    version: '1.0.0',
    description: response.description,
    author: {
      name: response.author,
    },
    repository: {
      type: 'git',
      url: response.repoUrl,
    },
    keywords: [],
  };

  // Add component arrays based on selection
  if (response.components.includes('skills')) {
    marketplace.skills = [];
  }
  if (response.components.includes('agents')) {
    marketplace.agents = [];
  }
  if (response.components.includes('commands')) {
    marketplace.commands = [];
  }
  if (response.components.includes('mcpServers')) {
    marketplace.mcpServers = [];
  }

  try {
    // Create directory structure
    await fs.mkdir('.claude-plugin', { recursive: true });
    await fs.writeFile(
      '.claude-plugin/marketplace.json',
      JSON.stringify(marketplace, null, 2)
    );

    console.log(chalk.green('\n✓ Created .claude-plugin/marketplace.json'));

    // Create example directories based on component selection
    if (response.components.includes('skills')) {
      await fs.mkdir('.claude/skills', { recursive: true });
      console.log(chalk.green('✓ Created .claude/skills/'));
    }
    if (response.components.includes('agents')) {
      await fs.mkdir('.claude/agents', { recursive: true });
      console.log(chalk.green('✓ Created .claude/agents/'));
    }
    if (response.components.includes('commands')) {
      await fs.mkdir('.claude/commands', { recursive: true });
      console.log(chalk.green('✓ Created .claude/commands/'));
    }
    if (response.components.includes('mcpServers')) {
      await fs.mkdir('.claude/mcp-servers', { recursive: true });
      console.log(chalk.green('✓ Created .claude/mcp-servers/'));
    }

    // Create README
    const readme = `# ${response.name}

${response.description}

## Installation

\`\`\`bash
skillstash install ${response.name}
\`\`\`

## Components

${response.components.map((c: string) => `- ${c.charAt(0).toUpperCase() + c.slice(1)}`).join('\n')}

## Usage

TODO: Add usage instructions

## Author

${response.author}

## License

MIT
`;

    await fs.writeFile('README.md', readme);
    console.log(chalk.green('✓ Created README.md'));

    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('  1. Add your skills, agents, or commands'));
    console.log(
      chalk.gray('  2. Update .claude-plugin/marketplace.json with details')
    );
    console.log(chalk.gray('  3. Test locally'));
    console.log(
      chalk.gray(`  4. Run ${chalk.white('skillstash publish')} to publish`)
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`\nFailed to initialize: ${error.message}`));
    }
    process.exit(1);
  }
}
