/**
 * Publish Command
 * Publish a plugin to the SkillStash registry
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { publishPlugin } from '../lib/api.js';

export async function publishCommand(): Promise<void> {
  const spinner = ora('Publishing plugin...').start();

  try {
    // Check if marketplace.json exists
    const marketplacePath = path.join(
      process.cwd(),
      '.claude-plugin',
      'marketplace.json'
    );

    try {
      await fs.access(marketplacePath);
    } catch {
      spinner.fail('No marketplace.json found');
      console.log(
        chalk.yellow(
          '\nRun ' + chalk.white('skillstash init') + ' to create one'
        )
      );
      process.exit(1);
    }

    // Read and parse marketplace.json
    spinner.text = 'Reading marketplace.json...';
    const content = await fs.readFile(marketplacePath, 'utf-8');
    const metadata = JSON.parse(content);

    // Validate required fields
    const requiredFields = ['name', 'description', 'repository'];
    const missingFields = requiredFields.filter((field) => !metadata[field]);

    if (missingFields.length > 0) {
      spinner.fail('Invalid marketplace.json');
      console.log(
        chalk.red(`\nMissing required fields: ${missingFields.join(', ')}`)
      );
      process.exit(1);
    }

    // Publish to registry
    spinner.text = 'Publishing to registry...';
    const result = await publishPlugin(metadata);

    spinner.succeed(chalk.green('✓ Plugin published successfully!'));
    console.log(chalk.gray(`\n${result.message}`));
    console.log(
      chalk.gray(
        `\nYour plugin will appear in search results within a few minutes.`
      )
    );
    console.log(
      chalk.gray(`Users can install it with: ${chalk.white(`skillstash install ${metadata.name}`)}`)
    );
  } catch (error) {
    spinner.fail('Publish failed');
    if (error instanceof Error) {
      console.error(chalk.red(`\n${error.message}`));

      // Provide helpful suggestions
      if (error.message.includes('JSON')) {
        console.log(
          chalk.gray('\nCheck that marketplace.json is valid JSON')
        );
      }
    }
    process.exit(1);
  }
}
