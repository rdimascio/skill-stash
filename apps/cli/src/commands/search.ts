/**
 * Search Command
 * Search for plugins in the SkillStash registry
 */

import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { searchPlugins } from '../lib/api.js';

export async function searchCommand(
  query: string,
  options: { limit: string }
): Promise<void> {
  const spinner = ora('Searching plugins...').start();

  try {
    const results = await searchPlugins(query, parseInt(options.limit));
    spinner.stop();

    if (results.data.length === 0) {
      console.log(chalk.yellow(`\nNo plugins found for "${query}"`));
      console.log(
        chalk.gray(`\nTry searching for: "git", "docker", "testing"`)
      );
      return;
    }

    console.log(
      chalk.bold(
        `\n✨ Found ${results.data.length} plugin${results.data.length === 1 ? '' : 's'}:\n`
      )
    );

    const table = new Table({
      head: [
        chalk.bold('Name'),
        chalk.bold('Description'),
        chalk.bold('Stars'),
        chalk.bold('Downloads'),
      ],
      colWidths: [25, 50, 10, 12],
      style: {
        head: [],
        border: ['gray'],
      },
    });

    results.data.forEach((plugin) => {
      const description =
        plugin.description.length > 47
          ? plugin.description.substring(0, 47) + '...'
          : plugin.description;

      table.push([
        chalk.cyan(plugin.name),
        description,
        chalk.yellow(`⭐ ${plugin.stars}`),
        chalk.green(`↓ ${plugin.downloads}`),
      ]);
    });

    console.log(table.toString());
    console.log(
      chalk.gray(`\nUse ${chalk.white('skillstash info <plugin>')} for more details`)
    );
    console.log(
      chalk.gray(`Use ${chalk.white('skillstash install <plugin>')} to install`)
    );
  } catch (error) {
    spinner.fail('Search failed');
    if (error instanceof Error) {
      console.error(chalk.red(`\n${error.message}`));
    }
    process.exit(1);
  }
}
