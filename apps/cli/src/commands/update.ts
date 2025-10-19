/**
 * Update Command
 * Update installed plugins to their latest versions
 */

import chalk from 'chalk';
import ora from 'ora';
import {
  getInstalledPlugins,
  isPluginInstalled,
  updatePlugin,
} from '../lib/claude-code.js';

export async function updateCommand(pluginId?: string): Promise<void> {
  if (pluginId) {
    // Update specific plugin
    await updateSinglePlugin(pluginId);
  } else {
    // Update all plugins
    await updateAllPlugins();
  }
}

async function updateSinglePlugin(pluginId: string): Promise<void> {
  const spinner = ora(`Updating ${pluginId}...`).start();

  try {
    // Check if plugin is installed
    if (!(await isPluginInstalled(pluginId))) {
      spinner.fail(chalk.yellow(`${pluginId} is not installed`));
      console.log(
        chalk.gray(`Install it with: ${chalk.white(`skillstash install ${pluginId}`)}`)
      );
      return;
    }

    // Update plugin
    await updatePlugin(pluginId);
    spinner.succeed(chalk.green(`✓ Updated ${chalk.bold(pluginId)}`));
    console.log(chalk.gray('Restart Claude Code to use the updated plugin'));
  } catch (error) {
    spinner.fail('Update failed');
    if (error instanceof Error) {
      console.error(chalk.red(`\n${error.message}`));
    }
    process.exit(1);
  }
}

async function updateAllPlugins(): Promise<void> {
  const spinner = ora('Loading installed plugins...').start();

  try {
    const installed = await getInstalledPlugins();

    if (installed.length === 0) {
      spinner.stop();
      console.log(chalk.yellow('\nNo plugins installed'));
      return;
    }

    spinner.text = `Updating ${installed.length} plugin(s)...`;

    const results = {
      success: [] as string[],
      failed: [] as string[],
    };

    // Update each plugin
    for (const pluginId of installed) {
      spinner.text = `Updating ${pluginId}...`;

      try {
        await updatePlugin(pluginId);
        results.success.push(pluginId);
      } catch (error) {
        results.failed.push(pluginId);
      }
    }

    spinner.stop();

    // Display results
    if (results.success.length > 0) {
      console.log(
        chalk.green(`\n✓ Successfully updated ${results.success.length} plugin(s):`)
      );
      results.success.forEach((plugin) => {
        console.log(chalk.gray(`  • ${plugin}`));
      });
    }

    if (results.failed.length > 0) {
      console.log(
        chalk.yellow(`\n⚠ Failed to update ${results.failed.length} plugin(s):`)
      );
      results.failed.forEach((plugin) => {
        console.log(chalk.gray(`  • ${plugin}`));
      });
    }

    if (results.success.length > 0) {
      console.log(chalk.gray('\nRestart Claude Code to use the updated plugins'));
    }
  } catch (error) {
    spinner.fail('Update failed');
    if (error instanceof Error) {
      console.error(chalk.red(`\n${error.message}`));
    }
    process.exit(1);
  }
}
