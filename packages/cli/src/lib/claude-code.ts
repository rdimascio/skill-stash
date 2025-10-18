/**
 * Claude Code Integration
 * Manages plugin installation and interaction with Claude Code's plugin directory
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Claude Code config location
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const PLUGINS_DIR = path.join(CLAUDE_DIR, 'plugins');

/**
 * Get list of installed plugins
 */
export async function getInstalledPlugins(): Promise<string[]> {
  try {
    await fs.access(PLUGINS_DIR);
    const entries = await fs.readdir(PLUGINS_DIR, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

/**
 * Check if a plugin is installed
 */
export async function isPluginInstalled(pluginId: string): Promise<boolean> {
  try {
    const pluginPath = path.join(PLUGINS_DIR, pluginId);
    await fs.access(pluginPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Install a plugin by cloning its repository
 */
export async function installPlugin(
  pluginId: string,
  repoUrl: string
): Promise<string> {
  const pluginPath = path.join(PLUGINS_DIR, pluginId);

  // Ensure plugins directory exists
  await fs.mkdir(PLUGINS_DIR, { recursive: true });

  // Clone repository
  await execAsync(`git clone ${repoUrl} "${pluginPath}"`);

  return pluginPath;
}

/**
 * Uninstall a plugin by removing its directory
 */
export async function uninstallPlugin(pluginId: string): Promise<void> {
  const pluginPath = path.join(PLUGINS_DIR, pluginId);
  await fs.rm(pluginPath, { recursive: true, force: true });
}

/**
 * Update a plugin by pulling latest changes
 */
export async function updatePlugin(pluginId: string): Promise<void> {
  const pluginPath = path.join(PLUGINS_DIR, pluginId);

  // Check if plugin exists
  try {
    await fs.access(pluginPath);
  } catch {
    throw new Error(`Plugin "${pluginId}" is not installed`);
  }

  // Pull latest changes
  await execAsync(`cd "${pluginPath}" && git pull`);
}

/**
 * Get plugin metadata from installed plugin
 */
export async function getPluginMetadata(pluginId: string): Promise<any> {
  const pluginPath = path.join(PLUGINS_DIR, pluginId);
  const metadataPath = path.join(pluginPath, '.claude-plugin', 'marketplace.json');

  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Ensure Claude directory exists
 */
export async function ensureClaudeDirectory(): Promise<void> {
  await fs.mkdir(CLAUDE_DIR, { recursive: true });
  await fs.mkdir(PLUGINS_DIR, { recursive: true });
}
