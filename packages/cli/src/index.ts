#!/usr/bin/env node

/**
 * SkillStash CLI
 * Discover and install Claude Code plugins from the SkillStash registry
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { searchCommand } from './commands/search.js';
import { infoCommand } from './commands/info.js';
import { installCommand } from './commands/install.js';
import { listCommand } from './commands/list.js';
import { initCommand } from './commands/init.js';
import { publishCommand } from './commands/publish.js';
import { updateCommand } from './commands/update.js';
import { removeCommand } from './commands/remove.js';

const program = new Command();

program
  .name('skillstash')
  .description('Discover and install Claude Code plugins from SkillStash')
  .version('0.1.0');

// Search command
program
  .command('search')
  .description('Search for plugins in the registry')
  .argument('<query>', 'search query')
  .option('-l, --limit <number>', 'maximum results to show', '10')
  .action(searchCommand);

// Info command
program
  .command('info')
  .description('Show detailed information about a plugin')
  .argument('<plugin>', 'plugin name or id')
  .action(infoCommand);

// Install command
program
  .command('install')
  .description('Install a plugin')
  .argument('<plugin>', 'plugin name or id')
  .action(installCommand);

// List command
program
  .command('list')
  .description('List all installed plugins')
  .action(listCommand);

// Init command
program
  .command('init')
  .description('Initialize a new plugin project')
  .action(initCommand);

// Publish command
program
  .command('publish')
  .description('Publish a plugin to the registry')
  .action(publishCommand);

// Update command
program
  .command('update')
  .description('Update installed plugins')
  .argument('[plugin]', 'plugin name or id (updates all if not specified)')
  .action(updateCommand);

// Remove command
program
  .command('remove')
  .description('Uninstall a plugin')
  .argument('<plugin>', 'plugin name or id')
  .option('-y, --yes', 'skip confirmation prompt', false)
  .action(removeCommand);

// Add command (alias for install)
program
  .command('add')
  .description('Install a plugin (alias for install)')
  .argument('<plugin>', 'plugin name or id')
  .action(installCommand);

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('unknown command')) {
      console.error(chalk.red(`\n${error.message}`));
      console.log(chalk.gray(`\nRun ${chalk.white('skillstash --help')} for usage`));
    }
  }
  process.exit(1);
}
