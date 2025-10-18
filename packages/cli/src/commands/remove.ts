/**
 * Remove Command
 * Uninstall a plugin from Claude Code
 */

import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { uninstallPlugin, isPluginInstalled } from '../lib/claude-code.js';

export async function removeCommand(
  pluginId: string,
  options: { yes: boolean }
): Promise<void> {
  const spinner = ora(`Checking ${pluginId}...`).start();

  try {
    // Check if plugin is installed
    if (!(await isPluginInstalled(pluginId))) {
      spinner.warn(chalk.yellow(`${pluginId} is not installed`));
      return;
    }

    spinner.stop();

    // Confirm removal unless --yes flag is provided
    if (!options.yes) {
      const response = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: `Remove ${chalk.cyan(pluginId)}?`,
        initial: false,
      });

      if (!response.confirm) {
        console.log(chalk.gray('Cancelled'));
        return;
      }
    }

    const removeSpinner = ora(`Removing ${pluginId}...`).start();

    // Remove plugin
    await uninstallPlugin(pluginId);
    removeSpinner.succeed(chalk.green(`✓ Removed ${chalk.bold(pluginId)}`));
    console.log(chalk.gray('Restart Claude Code to complete removal'));
  } catch (error) {
    spinner.fail('Remove failed');
    if (error instanceof Error) {
      console.error(chalk.red(`\n${error.message}`));
    }
    process.exit(1);
  }
}
