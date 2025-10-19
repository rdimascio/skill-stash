# SkillStash

> The registry for Claude Code plugins

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/@skillstash%2Fcli.svg)](https://www.npmjs.com/package/@skillstash/cli)

Discover, install, and share plugins for Claude Code with a single command. Think shadcn/ui for Claude Code.

🌐 **[skillstash.dev](https://skillstash.dev)** | 📦 **[npm](https://www.npmjs.com/package/@skillstash/cli)** | 📚 **[Documentation](https://docs.skillstash.dev)**

---

## ✨ Features

- 🔍 **Discover** - Browse 150+ plugins for testing, DevOps, security, and more
- ⚡ **Install** - Add plugins to Claude Code in seconds
- 🎨 **Beautiful CLI** - Intuitive commands with gorgeous terminal UI
- 🌐 **Web Registry** - Visual discovery at skillstash.dev
- 📦 **Easy Publishing** - Share your plugins with the community
- 🔒 **Secure** - Verified publishers and security audits

## 🚀 Quick Start

### Install the CLI

```bash
npm install -g @skillstash/cli
```

### Search for plugins

```bash
skillstash search testing
```

### Install a plugin

```bash
skillstash add pr-reviewer
```

### Browse online

Visit [skillstash.dev](https://skillstash.dev) to explore plugins visually.

## 📚 Usage

### Search

Find plugins matching your needs:

```bash
skillstash search "code review"
skillstash search security
```

### Install

Add plugins to your Claude Code setup:

```bash
# Download and install in one command
skillstash install pr-reviewer

# Or download first, install later
skillstash add pr-reviewer
skillstash install pr-reviewer
```

### List installed plugins

```bash
skillstash list
```

### Get plugin info

```bash
skillstash info pr-reviewer
```

### Create a new plugin

```bash
skillstash init
```

Follow the interactive prompts to create your plugin structure.

### Publish your plugin

```bash
cd my-awesome-plugin
skillstash publish
```

## 🏗️ Plugin Structure

Plugins follow the Claude Code plugin format:

```
my-plugin/
├── .claude-plugin/
│   └── marketplace.json      # Plugin metadata
├── skills/                   # Skills that auto-load
│   └── my-skill.md
├── agents/                   # Specialized sub-agents
│   └── my-agent.md
├── commands/                 # Custom slash commands
│   └── my-command.md
└── README.md                 # Documentation
```

## 🌟 Featured Plugins

- **pr-reviewer** - AI-powered code review for pull requests
- **test-generator** - Automatically generate comprehensive test suites
- **doc-sync** - Keep documentation in sync with code changes
- **deploy-assistant** - Streamline deployments across platforms
- **security-scanner** - Scan for vulnerabilities and security issues

[Browse all plugins →](https://skillstash.dev/plugins)

## 💡 Examples

### DevOps Workflow

```bash
# Install DevOps essentials
skillstash add deploy-assistant
skillstash add ci-helper
skillstash add docker-expert

# Or install a curated collection
skillstash add collection/devops-essentials
```

### Security Hardening

```bash
skillstash search security
skillstash add security-scanner
skillstash add code-auditor
```

### Testing Suite

```bash
skillstash add test-generator
skillstash add coverage-analyzer
skillstash add e2e-helper
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Report Issues

Found a bug? Have a feature request? [Open an issue](https://github.com/yourusername/skillstash/issues).

### Create Plugins

Build something useful? Share it with the community:

```bash
skillstash init
# Build your plugin
skillstash publish
```

### Improve Documentation

Documentation improvements are always welcome. Submit a PR!

## 🏢 For Organizations

### Private Plugin Hosting

Need private plugins for your team? Check out [pluginmarket.place](https://pluginmarket.place) for:

- Private plugin hosting
- Team management
- SSO integration
- Enterprise support
- License management

[Learn more →](https://pluginmarket.place)

## 🛠️ Development

### Prerequisites

- Node.js 18+
- pnpm 8+
- Claude Code

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/skillstash
cd skillstash

# Install dependencies
pnpm install

# Run in development mode
pnpm dev
```

### Monorepo Structure

```
skillstash/
├── apps/web/              # Next.js web app
├── apps/cli/          # CLI tool
├── workers/api/           # Registry API
└── workers/ingester/       # Plugin ingester
```

See [CLAUDE.md](./CLAUDE.md) for detailed development documentation.

## 📖 Documentation

- **Getting Started**: [docs.skillstash.dev/getting-started](https://docs.skillstash.dev/getting-started)
- **Plugin Development**: [docs.skillstash.dev/plugin-development](https://docs.skillstash.dev/plugin-development)
- **API Reference**: [docs.skillstash.dev/api](https://docs.skillstash.dev/api)
- **CLI Reference**: [docs.skillstash.dev/cli](https://docs.skillstash.dev/cli)

## 🙏 Acknowledgments

Built with amazing open source tools:

- [Claude Code](https://www.anthropic.com/claude-code) - AI-powered coding assistant
- [Cloudflare](https://cloudflare.com) - Edge computing platform
- [Next.js](https://nextjs.org) - React framework
- [Vercel](https://vercel.com) - Deployment platform
- [shadcn/ui](https://ui.shadcn.com) - Design system inspiration

## 📄 License

MIT © SkillStash

---

## 🔗 Links

- **Website**: [skillstash.dev](https://skillstash.dev)
- **CLI Package**: [@skillstash/cli](https://www.npmjs.com/package/@skillstash/cli)
- **Documentation**: [docs.skillstash.dev](https://docs.skillstash.dev)
- **GitHub**: [github.com/yourusername/skillstash](https://github.com/yourusername/skillstash)
- **Twitter**: [@skillstash](https://twitter.com/skillstash)
- **Discord**: [discord.gg/skillstash](https://discord.gg/skillstash)

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/skillstash/issues)
- **Email**: hello@skillstash.dev
- **Discord**: Join our [community server](https://discord.gg/skillstash)

---

**Made with ❤️ for the Claude Code community**