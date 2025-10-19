/**
 * Info Command
 * Display detailed information about a plugin
 */

import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { getPlugin } from '../lib/api.js';
import { isPluginInstalled } from '../lib/claude-code.js';

export async function infoCommand(pluginId: string): Promise<void> {
  const spinner = ora('Fetching plugin info...').start();

  try {
    const plugin = await getPlugin(pluginId);
    const installed = await isPluginInstalled(pluginId);
    spinner.stop();

    // Display plugin name and description in a box
    console.log(
      '\n' +
        boxen(
          chalk.bold.cyan(plugin.name) + '\n' + chalk.gray(plugin.description),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan',
          }
        )
    );

    // Display plugin details
    console.log(chalk.bold('Details:'));
    console.log(`  Author:    ${chalk.yellow(plugin.author)}`);
    console.log(
      `  Version:   ${chalk.green(plugin.metadata?.version || 'N/A')}`
    );
    console.log(`  Stars:     ${chalk.yellow(`⭐ ${plugin.stars}`)}`);
    console.log(`  Downloads: ${chalk.green(`↓ ${plugin.downloads}`)}`);
    console.log(
      `  Status:    ${installed ? chalk.green('✓ Installed') : chalk.gray('Not installed')}`
    );

    if (plugin.tags && plugin.tags.length > 0) {
      console.log(
        `  Tags:      ${plugin.tags.map((t) => chalk.blue(t)).join(', ')}`
      );
    }

    console.log(
      `\n  ${chalk.gray('Repository:')} ${chalk.underline(plugin.repoUrl)}`
    );

    // Display components
    const components = [];
    if (plugin.skills && plugin.skills.length > 0) {
      components.push(`${chalk.bold('Skills:')} ${plugin.skills.length}`);
    }
    if (plugin.agents && plugin.agents.length > 0) {
      components.push(`${chalk.bold('Agents:')} ${plugin.agents.length}`);
    }
    if (plugin.commands && plugin.commands.length > 0) {
      components.push(`${chalk.bold('Commands:')} ${plugin.commands.length}`);
    }
    if (plugin.mcpServers && plugin.mcpServers.length > 0) {
      components.push(`${chalk.bold('MCP Servers:')} ${plugin.mcpServers.length}`);
    }

    if (components.length > 0) {
      console.log('\n' + components.join(' • '));
    }

    // Display action suggestion
    if (!installed) {
      console.log(
        `\n${chalk.gray('Install with:')} ${chalk.white(`skillstash install ${pluginId}`)}`
      );
    } else {
      console.log(
        `\n${chalk.gray('Update with:')} ${chalk.white(`skillstash update ${pluginId}`)}`
      );
      console.log(
        `${chalk.gray('Remove with:')} ${chalk.white(`skillstash remove ${pluginId}`)}`
      );
    }
  } catch (error) {
    spinner.fail('Failed to fetch plugin');
    if (error instanceof Error) {
      console.error(chalk.red(`\n${error.message}`));
    }
    process.exit(1);
  }
}
