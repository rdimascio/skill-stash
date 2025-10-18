# @skillstash/cli

Command-line tool for discovering, installing, and managing Claude Code plugins from SkillStash.

## Installation

```bash
# Install globally via npm
npm install -g @skillstash/cli

# Or use via npx (no installation required)
npx @skillstash/cli search <query>
```

## Quick Start

```bash
# Search for plugins
skillstash search git

# Get plugin details
skillstash info git-workflow

# Install a plugin
skillstash install git-workflow

# List installed plugins
skillstash list

# Update all plugins
skillstash update
```

## Commands

### `search <query>`

Search for plugins in the SkillStash registry.

```bash
skillstash search git
skillstash search docker
skillstash search testing --limit 20
```

**Options:**
- `-l, --limit <number>` - Maximum results to show (default: 10)

**Example Output:**
```
✨ Found 3 plugins:

┌──────────────────────┬───────────────────────────────────────────────┬──────────┬────────────┐
│ Name                 │ Description                                   │ Stars    │ Downloads  │
├──────────────────────┼───────────────────────────────────────────────┼──────────┼────────────┤
│ git-workflow         │ Enforce branch-based workflow with convent... │ ⭐ 42    │ ↓ 128      │
│ git-hooks            │ Manage Git hooks with pre-commit and pre-p... │ ⭐ 28    │ ↓ 89       │
│ git-flow             │ Gitflow workflow commands and automation      │ ⭐ 15    │ ↓ 45       │
└──────────────────────┴───────────────────────────────────────────────┴──────────┴────────────┘

Use skillstash info <plugin> for more details
Use skillstash install <plugin> to install
```

---

### `info <plugin>`

Show detailed information about a plugin.

```bash
skillstash info git-workflow
```

**Example Output:**
```
╭─────────────────────────────────────────────────────╮
│                                                     │
│   git-workflow                                      │
│   Enforce branch-based workflow with conventions   │
│                                                     │
╰─────────────────────────────────────────────────────╯

Details:
  Author:    rdimascio
  Version:   1.0.0
  Stars:     ⭐ 42
  Downloads: ↓ 128
  Status:    Not installed
  Tags:      git, workflow, conventional-commits

  Repository: https://github.com/rdimascio/git-workflow-plugin

Skills: 1 • Commands: 3

Install with: skillstash install git-workflow
```

---

### `install <plugin>`

Install a plugin to your Claude Code setup.

```bash
skillstash install git-workflow
```

The CLI will:
1. Fetch plugin information from the registry
2. Clone the plugin repository to `~/.claude/plugins/<plugin-name>`
3. Display what was installed (skills, agents, commands, MCP servers)

**Example Output:**
```
✔ Installed git-workflow
  ✓ 1 skill(s)
  ✓ 3 command(s)

Restart Claude Code to use the new plugin
```

**Alias:** `skillstash add <plugin>`

---

### `list`

List all installed plugins.

```bash
skillstash list
```

**Example Output:**
```
📦 Installed plugins (2):

  ✓ git-workflow
    v1.0.0
    Enforce branch-based workflow with conventions

  ✓ docker-dev
    v2.1.3
    Docker development environment management

Use skillstash info <plugin> for details
Use skillstash update <plugin> to update
```

---

### `update [plugin]`

Update one or all installed plugins.

```bash
# Update a specific plugin
skillstash update git-workflow

# Update all plugins
skillstash update
```

**Example Output (single plugin):**
```
✔ Updated git-workflow
Restart Claude Code to use the updated plugin
```

**Example Output (all plugins):**
```
✓ Successfully updated 2 plugin(s):
  • git-workflow
  • docker-dev

Restart Claude Code to use the updated plugins
```

---

### `remove <plugin>`

Uninstall a plugin from Claude Code.

```bash
skillstash remove git-workflow

# Skip confirmation prompt
skillstash remove git-workflow --yes
```

**Options:**
- `-y, --yes` - Skip confirmation prompt

**Example Output:**
```
? Remove git-workflow? › (y/N)
✔ Removed git-workflow
Restart Claude Code to complete removal
```

---

### `init`

Initialize a new plugin project.

```bash
skillstash init
```

This interactive command will:
1. Prompt for plugin metadata (name, description, author, repository)
2. Let you select which components to include (skills, agents, commands, MCP servers)
3. Create `.claude-plugin/marketplace.json`
4. Create directory structure for selected components
5. Generate a README template

**Example Output:**
```
📦 Initialize new plugin

✔ Plugin name: … my-awesome-plugin
✔ Description: … Automates awesome workflows
✔ Author: … Your Name
✔ Repository URL: … https://github.com/username/my-awesome-plugin
✔ What components will this plugin include? › Skills, Commands

✓ Created .claude-plugin/marketplace.json
✓ Created .claude/skills/
✓ Created .claude/commands/
✓ Created README.md

Next steps:
  1. Add your skills, agents, or commands
  2. Update .claude-plugin/marketplace.json with details
  3. Test locally
  4. Run skillstash publish to publish
```

---

### `publish`

Publish your plugin to the SkillStash registry.

```bash
skillstash publish
```

Requirements:
- Must have `.claude-plugin/marketplace.json` file
- Repository must be on GitHub
- Plugin must have required fields: `name`, `description`, `repository`

**Example Output:**
```
✔ Plugin published successfully!

Your plugin has been submitted to the registry
Your plugin will appear in search results within a few minutes.
Users can install it with: skillstash install my-awesome-plugin
```

---

## Plugin Development

### Creating a Plugin

1. **Initialize the project:**
   ```bash
   mkdir my-plugin
   cd my-plugin
   skillstash init
   ```

2. **Add your components:**
   - Skills: Place files in `.claude/skills/`
   - Agents: Place files in `.claude/agents/`
   - Commands: Place files in `.claude/commands/`
   - MCP Servers: Place files in `.claude/mcp-servers/`

3. **Update marketplace.json:**
   ```json
   {
     "name": "my-plugin",
     "version": "1.0.0",
     "description": "Does awesome things",
     "author": {
       "name": "Your Name"
     },
     "repository": {
       "type": "git",
       "url": "https://github.com/username/my-plugin"
     },
     "keywords": ["automation", "workflow"],
     "skills": [],
     "commands": [],
     "agents": [],
     "mcpServers": []
   }
   ```

4. **Test locally:**
   ```bash
   # Install your plugin locally
   cd ~/.claude/plugins
   git clone https://github.com/username/my-plugin

   # Restart Claude Code and test
   ```

5. **Publish:**
   ```bash
   skillstash publish
   ```

### Marketplace Metadata

The `.claude-plugin/marketplace.json` file contains all the metadata for your plugin:

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "Plugin description (required, min 10 chars)",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://example.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/username/plugin-name"
  },
  "keywords": ["tag1", "tag2"],
  "skills": [
    {
      "name": "skill-name",
      "path": ".claude/skills/skill-name",
      "description": "Skill description"
    }
  ],
  "agents": [],
  "commands": [],
  "mcpServers": []
}
```

---

## Configuration

The CLI uses the following configuration:

- **Plugin Directory:** `~/.claude/plugins/`
- **API Base URL:** `https://api.skillstash.com` (default)

To use a custom API endpoint:
```bash
export SKILLSTASH_API_URL=https://custom-api.example.com
```

---

## Examples

### Discover Trending Plugins
```bash
# Search for popular categories
skillstash search testing
skillstash search docker
skillstash search git
```

### Install Multiple Plugins
```bash
skillstash install git-workflow
skillstash install docker-dev
skillstash install test-runner
```

### Keep Plugins Updated
```bash
# Update all at once
skillstash update

# Or individually
skillstash update git-workflow
```

### Manage Installed Plugins
```bash
# See what's installed
skillstash list

# Get details
skillstash info git-workflow

# Remove old plugins
skillstash remove old-plugin --yes
```

---

## Troubleshooting

### Command not found: skillstash

If installed globally, ensure npm global bin directory is in your PATH:
```bash
npm config get prefix
# Add <prefix>/bin to your PATH
```

Or use via npx:
```bash
npx @skillstash/cli search git
```

### Plugin not found

The plugin might not be published yet or the name is incorrect. Try searching:
```bash
skillstash search <plugin-name>
```

### Install fails with git error

Ensure git is installed and configured:
```bash
git --version
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### Cannot publish plugin

Ensure:
- You have `.claude-plugin/marketplace.json` file
- All required fields are filled (name, description, repository)
- Repository URL is a valid GitHub URL

---

## License

MIT

## Links

- [SkillStash Website](https://skillstash.com)
- [Documentation](https://skillstash.com/docs)
- [GitHub Repository](https://github.com/rdimascio/skill-stash)
- [Report Issues](https://github.com/rdimascio/skill-stash/issues)
