# Task 004: CLI Tool (@skillstash/cli)

## Objective
Build the `skillstash` CLI that provides the shadcn-style DX for discovering, installing, and publishing plugins.

## Context
The CLI is the primary interface for developers. It should be fast, intuitive, and feel like a natural extension of Claude Code.

## Commands

```bash
skillstash search <query>       # Search for plugins
skillstash add <plugin>         # Add plugin to local registry
skillstash install <plugin>     # Install directly to Claude Code
skillstash list                 # List installed plugins
skillstash info <plugin>        # Show plugin details
skillstash init                 # Initialize new plugin
skillstash publish              # Publish plugin to registry
skillstash update               # Update all plugins
skillstash remove <plugin>      # Remove plugin
```

## Implementation

### File Structure
```
apps/cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/
│   │   ├── search.ts         # Search command
│   │   ├── add.ts            # Add command
│   │   ├── install.ts        # Install command
│   │   ├── list.ts           # List command
│   │   ├── info.ts           # Info command
│   │   ├── init.ts           # Init command
│   │   └── publish.ts        # Publish command
│   ├── lib/
│   │   ├── api.ts            # API client
│   │   ├── claude-code.ts    # Claude Code integration
│   │   ├── git.ts            # Git operations
│   │   └── config.ts         # Config management
│   └── utils/
│       ├── logger.ts         # Pretty logging
│       ├── spinner.ts        # Loading spinner
│       └── prompts.ts        # Interactive prompts
├── package.json
└── tsconfig.json
```

### Entry Point (`index.ts`)
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { searchCommand } from './commands/search';
import { addCommand } from './commands/add';
import { installCommand } from './commands/install';
import { listCommand } from './commands/list';
import { infoCommand } from './commands/info';
import { initCommand } from './commands/init';
import { publishCommand } from './commands/publish';
import { updateCommand } from './commands/update';
import { removeCommand } from './commands/remove';

const program = new Command();

program
  .name('skillstash')
  .description('The registry for Claude Code plugins')
  .version('1.0.0');

program
  .command('search <query>')
  .description('Search for plugins in the registry')
  .option('-l, --limit <number>', 'Number of results', '10')
  .action(searchCommand);

program
  .command('add <plugin>')
  .description('Add plugin to local cache')
  .option('-i, --install', 'Install to Claude Code immediately')
  .action(addCommand);

program
  .command('install <plugin>')
  .description('Install plugin directly to Claude Code')
  .action(installCommand);

program
  .command('list')
  .description('List installed plugins')
  .action(listCommand);

program
  .command('info <plugin>')
  .description('Show detailed plugin information')
  .action(infoCommand);

program
  .command('init')
  .description('Initialize a new plugin')
  .option('-t, --template <type>', 'Template type', 'plugin')
  .action(initCommand);

program
  .command('publish')
  .description('Publish plugin to registry')
  .option('--bump <version>', 'Version bump type', 'patch')
  .action(publishCommand);

program
  .command('update')
  .description('Update all installed plugins')
  .action(updateCommand);

program
  .command('remove <plugin>')
  .description('Remove installed plugin')
  .action(removeCommand);

program.parse();
```

### Search Command (`commands/search.ts`)
```typescript
import ora from 'ora';
import chalk from 'chalk';
import { searchPlugins } from '../lib/api';
import { formatTable } from '../utils/logger';

export async function searchCommand(query: string, options: any) {
  const spinner = ora('Searching plugins...').start();
  
  try {
    const results = await searchPlugins(query, options.limit);
    
    spinner.succeed(`Found ${results.length} plugins`);
    
    if (results.length === 0) {
      console.log(chalk.yellow('\nNo plugins found. Try a different search term.'));
      return;
    }
    
    console.log('\n' + formatTable(results.map(p => ({
      Name: chalk.cyan(p.slug),
      Description: p.description?.substring(0, 50) + '...',
      Category: p.category,
      Downloads: p.downloads.toLocaleString()
    }))));
    
    console.log(chalk.dim('\nInstall with: ') + chalk.white('skillstash add <plugin-name>'));
    
  } catch (error) {
    spinner.fail('Search failed');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
```

### Add Command (`commands/add.ts`)
```typescript
import ora from 'ora';
import chalk from 'chalk';
import { getPluginBySlug } from '../lib/api';
import { downloadPlugin, installToClaudeCode } from '../lib/claude-code';

export async function addCommand(pluginName: string, options: any) {
  const spinner = ora(`Fetching ${pluginName}...`).start();
  
  try {
    // Get plugin metadata from registry
    const plugin = await getPluginBySlug(pluginName);
    
    if (!plugin) {
      spinner.fail('Plugin not found');
      console.log(chalk.yellow(`\nTry searching: skillstash search ${pluginName}`));
      process.exit(1);
    }
    
    spinner.text = `Downloading ${plugin.name}...`;
    
    // Download plugin files from Git repo
    await downloadPlugin(plugin);
    
    spinner.succeed(`Downloaded ${plugin.name}`);
    
    // Show what was downloaded
    console.log(chalk.green('\n✓ Plugin components:'));
    if (plugin.skills?.length) {
      console.log(chalk.dim(`  • ${plugin.skills.length} skill(s)`));
    }
    if (plugin.agents?.length) {
      console.log(chalk.dim(`  • ${plugin.agents.length} agent(s)`));
    }
    if (plugin.commands?.length) {
      console.log(chalk.dim(`  • ${plugin.commands.length} command(s)`));
    }
    
    // Install if --install flag
    if (options.install) {
      const installSpinner = ora('Installing to Claude Code...').start();
      await installToClaudeCode(plugin);
      installSpinner.succeed('Installed to Claude Code');
      console.log(chalk.dim('\nPlugin ready to use!'));
    } else {
      console.log(chalk.dim('\nInstall with: ') + chalk.white(`skillstash install ${pluginName}`));
    }
    
  } catch (error) {
    spinner.fail('Failed to add plugin');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
```

### Init Command (`commands/init.ts`)
```typescript
import prompts from 'prompts';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export async function initCommand(options: any) {
  console.log(chalk.cyan.bold('\n🚀 SkillStash Plugin Generator\n'));
  
  const answers = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'Plugin name (e.g., my-awesome-plugin):',
      validate: (value) => value.length > 0 || 'Name is required'
    },
    {
      type: 'text',
      name: 'description',
      message: 'Description:',
      validate: (value) => value.length > 0 || 'Description is required'
    },
    {
      type: 'select',
      name: 'category',
      message: 'Category:',
      choices: [
        { title: 'Testing', value: 'testing' },
        { title: 'DevOps', value: 'devops' },
        { title: 'Security', value: 'security' },
        { title: 'Documentation', value: 'documentation' },
        { title: 'Code Review', value: 'code-review' },
        { title: 'General', value: 'general' }
      ]
    },
    {
      type: 'multiselect',
      name: 'components',
      message: 'Select components to include:',
      choices: [
        { title: 'Skill', value: 'skill', selected: true },
        { title: 'Agent', value: 'agent' },
        { title: 'Command', value: 'command' },
        { title: 'MCP Server', value: 'mcp' }
      ]
    }
  ]);
  
  if (!answers.name) {
    console.log(chalk.yellow('\nCancelled'));
    process.exit(0);
  }
  
  const spinner = ora('Creating plugin structure...').start();
  
  try {
    const pluginDir = path.join(process.cwd(), answers.name);
    
    // Create directory structure
    await fs.ensureDir(pluginDir);
    await fs.ensureDir(path.join(pluginDir, '.claude-plugin'));
    
    if (answers.components.includes('skill')) {
      await fs.ensureDir(path.join(pluginDir, 'skills'));
      await fs.writeFile(
        path.join(pluginDir, 'skills', 'example-skill.md'),
        generateSkillTemplate(answers)
      );
    }
    
    if (answers.components.includes('agent')) {
      await fs.ensureDir(path.join(pluginDir, 'agents'));
      await fs.writeFile(
        path.join(pluginDir, 'agents', 'example-agent.md'),
        generateAgentTemplate(answers)
      );
    }
    
    if (answers.components.includes('command')) {
      await fs.ensureDir(path.join(pluginDir, 'commands'));
      await fs.writeFile(
        path.join(pluginDir, 'commands', 'example-command.md'),
        generateCommandTemplate(answers)
      );
    }
    
    // Create marketplace.json
    const marketplace = {
      name: `@${process.env.USER || 'username'}/${answers.name}`,
      version: '1.0.0',
      description: answers.description,
      author: process.env.USER || 'username',
      repository: `https://github.com/${process.env.USER || 'username'}/${answers.name}`,
      plugins: [{
        name: answers.name,
        description: answers.description,
        ...(answers.components.includes('skill') && { skills: ['skills/example-skill.md'] }),
        ...(answers.components.includes('agent') && { agents: ['agents/example-agent'] }),
        ...(answers.components.includes('command') && { commands: ['commands/example-command'] })
      }]
    };
    
    await fs.writeJSON(
      path.join(pluginDir, '.claude-plugin', 'marketplace.json'),
      marketplace,
      { spaces: 2 }
    );
    
    // Create README
    await fs.writeFile(
      path.join(pluginDir, 'README.md'),
      generateReadme(answers)
    );
    
    spinner.succeed('Plugin created!');
    
    console.log(chalk.green('\n✓ Created:'));
    console.log(chalk.dim(`  • .claude-plugin/marketplace.json`));
    if (answers.components.includes('skill')) {
      console.log(chalk.dim(`  • skills/example-skill.md`));
    }
    if (answers.components.includes('agent')) {
      console.log(chalk.dim(`  • agents/example-agent.md`));
    }
    if (answers.components.includes('command')) {
      console.log(chalk.dim(`  • commands/example-command.md`));
    }
    console.log(chalk.dim(`  • README.md`));
    
    console.log(chalk.cyan('\nNext steps:'));
    console.log(chalk.white(`  cd ${answers.name}`));
    console.log(chalk.white(`  # Edit your plugin files`));
    console.log(chalk.white(`  skillstash publish`));
    
  } catch (error) {
    spinner.fail('Failed to create plugin');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

function generateSkillTemplate(answers: any): string {
  return `# ${answers.name}

${answers.description}

## Usage

This skill will be automatically loaded by Claude Code when relevant to the task.

## Capabilities

- Example capability 1
- Example capability 2

## Example

\`\`\`
// Your skill implementation here
\`\`\`
`;
}

function generateReadme(answers: any): string {
  return `# ${answers.name}

${answers.description}

## Installation

\`\`\`bash
skillstash add ${answers.name}
\`\`\`

## Usage

<!-- Add usage instructions here -->

## License

MIT
`;
}
```

### API Client (`lib/api.ts`)
```typescript
const API_BASE = 'https://api.skillstash.com';

export async function searchPlugins(query: string, limit: number = 10) {
  const response = await fetch(
    `${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to search plugins');
  }
  
  const data = await response.json();
  return data.results;
}

export async function getPluginBySlug(slug: string) {
  const response = await fetch(`${API_BASE}/api/plugins/${slug}`);
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    throw new Error('Failed to fetch plugin');
  }
  
  return response.json();
}

export async function trackDownload(pluginId: string, cliVersion: string) {
  await fetch(`${API_BASE}/api/plugins/${pluginId}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cli_version: cliVersion })
  });
}
```

### Configuration (`package.json`)
```json
{
  "name": "@skillstash/cli",
  "version": "1.0.0",
  "description": "CLI tool for SkillStash plugin registry",
  "bin": {
    "skillstash": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "commander": "^11.1.0",
    "ora": "^7.0.1",
    "chalk": "^5.3.0",
    "prompts": "^2.4.2",
    "fs-extra": "^11.2.0",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/prompts": "^2.4.9",
    "@types/fs-extra": "^11.0.4",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

## Deliverables

1. Complete CLI implementation with all commands
2. Beautiful terminal UI with colors and spinners
3. Interactive prompts for init command
4. Git and GitHub integration
5. Claude Code integration
6. Error handling and validation
7. Published to npm as `@skillstash/cli`

## Success Criteria

- [ ] All commands work as expected
- [ ] Beautiful, intuitive UX
- [ ] Fast performance (< 1s for most operations)
- [ ] Proper error messages
- [ ] Works on macOS, Linux, Windows
- [ ] Published to npm
- [ ] Installation: `npm install -g @skillstash/cli`

## Testing

```bash
# Local development
npm run dev search testing
npm run dev add pr-reviewer

# Build and test
npm run build
node dist/index.js --help

# Publish to npm
npm publish --access public
```