/**
 * List Command
 * List all installed plugins
 */

import chalk from 'chalk';
import ora from 'ora';
import { getInstalledPlugins, getPluginMetadata } from '../lib/claude-code.js';

export async function listCommand(): Promise<void> {
  const spinner = ora('Loading installed plugins...').start();

  try {
    const installed = await getInstalledPlugins();
    spinner.stop();

    if (installed.length === 0) {
      console.log(chalk.yellow('\nNo plugins installed yet'));
      console.log(
        chalk.gray(`Try: ${chalk.white('skillstash search <query>')}`)
      );
      return;
    }

    console.log(
      chalk.bold(`\n📦 Installed plugins (${installed.length}):\n`)
    );

    // Display each plugin with metadata if available
    for (const pluginId of installed) {
      const metadata = await getPluginMetadata(pluginId);

      if (metadata) {
        console.log(`  ${chalk.green('✓')} ${chalk.cyan(metadata.name)}`);
        if (metadata.version) {
          console.log(`    ${chalk.gray(`v${metadata.version}`)}`);
        }
        if (metadata.description) {
          const desc =
            metadata.description.length > 60
              ? metadata.description.substring(0, 60) + '...'
              : metadata.description;
          console.log(`    ${chalk.gray(desc)}`);
        }
      } else {
        console.log(`  ${chalk.green('✓')} ${chalk.cyan(pluginId)}`);
      }
    }

    console.log(
      chalk.gray(`\nUse ${chalk.white('skillstash info <plugin>')} for details`)
    );
    console.log(
      chalk.gray(`Use ${chalk.white('skillstash update <plugin>')} to update`)
    );
  } catch (error) {
    spinner.fail('Failed to list plugins');
    if (error instanceof Error) {
      console.error(chalk.red(`\n${error.message}`));
    }
    process.exit(1);
  }
}
