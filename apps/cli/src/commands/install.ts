/**
 * Install Command
 * Install a plugin from the registry
 */

import chalk from 'chalk';
import ora from 'ora';
import { getPlugin } from '../lib/api.js';
import { installPlugin, isPluginInstalled } from '../lib/claude-code.js';

export async function installCommand(pluginId: string): Promise<void> {
  const spinner = ora(`Installing ${pluginId}...`).start();

  try {
    // Check if already installed
    if (await isPluginInstalled(pluginId)) {
      spinner.warn(chalk.yellow(`${pluginId} is already installed`));
      console.log(
        chalk.gray(`Use ${chalk.white(`skillstash update ${pluginId}`)} to update`)
      );
      return;
    }

    // Fetch plugin info
    spinner.text = 'Fetching plugin info...';
    const plugin = await getPlugin(pluginId);

    // Install (clone repo)
    spinner.text = `Cloning ${plugin.repoUrl}...`;
    await installPlugin(pluginId, plugin.repoUrl);

    spinner.succeed(chalk.green(`✓ Installed ${chalk.bold(plugin.name)}`));

    // Show what was installed
    const components = [];
    if (plugin.skills && plugin.skills.length > 0) {
      components.push(chalk.gray(`  ✓ ${plugin.skills.length} skill(s)`));
    }
    if (plugin.agents && plugin.agents.length > 0) {
      components.push(chalk.gray(`  ✓ ${plugin.agents.length} agent(s)`));
    }
    if (plugin.commands && plugin.commands.length > 0) {
      components.push(chalk.gray(`  ✓ ${plugin.commands.length} command(s)`));
    }
    if (plugin.mcpServers && plugin.mcpServers.length > 0) {
      components.push(
        chalk.gray(`  ✓ ${plugin.mcpServers.length} MCP server(s)`)
      );
    }

    if (components.length > 0) {
      console.log(components.join('\n'));
    }

    console.log(
      chalk.gray('\nRestart Claude Code to use the new plugin')
    );
  } catch (error) {
    spinner.fail('Installation failed');
    if (error instanceof Error) {
      console.error(chalk.red(`\n${error.message}`));

      // Provide helpful suggestions
      if (error.message.includes('not found')) {
        console.log(
          chalk.gray(`\nTry: ${chalk.white(`skillstash search ${pluginId}`)}`)
        );
      }
    }
    process.exit(1);
  }
}
