# Product Requirements Document: SkillStash Ecosystem

## Vision
Build the **shadcn/ui for Claude Code** — a beautifully simple registry that becomes the de facto source for discovering, installing, and sharing Claude Code plugins, skills, agents, and commands through an elegant CLI and web experience.

---

## The Big Idea

Claude Code's plugin system is Git-based and decentralized. Anyone can host a marketplace. But discoverability is terrible. **SkillStash** becomes the curated registry that indexes all marketplaces, provides a stunning visual discovery experience, and offers the best DX for publishing.

Think: **shadcn/ui's `npx shadcn-ui@latest add button`** meets **npm search** meets **Vercel's deployment flow**.

---

## Understanding the Stack

### The Hierarchy
```
Plugin (bundle, installed via /plugin)
├── Skills (auto-loaded expertise packages)
├── Agents (specialized subagents) 
├── Commands (custom slash commands)
└── MCP Servers (tool/data connections)
```

**Key Insight**: Plugins are the distribution mechanism. Skills/agents/commands are the actual functionality. Most developers will want to discover at the component level (skills, agents) but install at the plugin level.

---

## Core Product: Three Surfaces

### 1. **skillstash.com** - Discovery & Documentation Hub
Beautiful, fast web interface for browsing the ecosystem.

#### Home Page
- **Hero search bar** with instant results (à la Algolia DocSearch)
- **Trending this week** - plugins gaining traction
- **Featured collections** - curated by community leaders
- **Browse by category**: DevOps, Testing, Security, AI/ML, Documentation, etc.
- **Recently published** - what's new
- **Official marketplace** - Anthropic-verified plugins

#### Component Pages (Skills, Agents, Commands)
Individual pages for each skill/agent/command with:
- **Live preview** of what it does (embedded videos/GIFs)
- **Installation command** (one-click copy): `npx @skillstash/cli add pr-reviewer`
- **Source marketplace** it came from
- **Dependencies** it requires
- **Stats**: downloads, GitHub stars, last updated
- **README** with rich formatting
- **Related components** - "People who installed X also installed Y"
- **Trust signals**: verified publisher, security audit status, community rating

#### Plugin Bundle Pages
- **Visual tree** showing all included skills/agents/commands
- **Complete setup guide**
- **Configuration options**
- **Version history** with changelogs

#### Collections
User-curated lists like:
- "Essential DevOps Toolkit"
- "Security Hardening Suite" 
- "Full-Stack React Developer Setup"
- "Enterprise Compliance Pack"

Collections show install commands for all items: `npx @skillstash/cli add collection/devops-toolkit`

### 2. **@skillstash/cli** - Installation & Publishing Tool
The `shadcn` experience but for Claude Code plugins.

#### Installation Commands
```bash
# Install the CLI globally
npm install -g @skillstash/cli

# Search from terminal
skillstash search "testing"

# Add a plugin (pulls from registry)
skillstash add pr-reviewer

# Install directly to Claude Code
skillstash add pr-reviewer --install

# Add multiple at once
skillstash add pr-reviewer code-security doc-sync

# Install a collection
skillstash add collection/devops-essentials

# Preview before installing
skillstash info pr-reviewer

# List installed
skillstash list

# Update all
skillstash update
```

#### Publishing Commands
```bash
# Initialize a new plugin/skill
skillstash init

# Interactive wizard creates proper structure:
# - .claude-plugin/ directory
# - marketplace.json
# - README template
# - Example skill/agent/command

# Validate before publishing
skillstash validate

# Publish to SkillStash registry (indexes it)
skillstash publish

# This creates a GitHub repo if needed
# Generates marketplace.json
# Indexes in skillstash.com
# Returns share URL

# Update existing
skillstash publish --bump patch

# Add to collection
skillstash collection add my-collection pr-reviewer
```

#### Key DX Features
- **Zero config** - works out of the box
- **Type-safe manifests** - validation with helpful errors
- **Hot reload** in dev mode
- **Automatic versioning** - semantic version bumps
- **Dependency resolution** - warns about conflicts
- **Dry-run mode** - see what will happen before publishing

### 3. **pluginmarket.place** - Premium Marketplace
Focus this domain on **premium, paid plugins** for enterprise. This is the monetization layer.

- Teams can publish private plugins
- Paid skills marketplace (revenue share with creators)
- Enterprise support and SLAs
- Custom marketplace hosting for organizations
- Analytics and usage insights
- License management
- Bulk purchasing for teams

---

## Technical Architecture

### Registry Infrastructure
```
┌─────────────────────────────────────────┐
│         skillstash.com (Web)            │
│    Next.js 15 + React Server Components │
└─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────┐
│      SkillStash Registry API            │
│    (Cloudflare Workers + D1)            │
│  - Fast edge compute                     │
│  - SQLite for metadata                   │
│  - R2 for cached plugin data             │
└─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────┐
│         Plugin ingester Service          │
│  - Crawls Git repos for plugins          │
│  - Parses marketplace.json files         │
│  - Extracts skills/agents/commands       │
│  - Updates search index                  │
│  - GitHub webhooks for auto-updates      │
└─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────┐
│    Elasticsearch / Typesense            │
│         Search Index                     │
└─────────────────────────────────────────┘
```

### CLI Architecture
```typescript
// @skillstash/cli structure
├── commands/
│   ├── add.ts        // Install plugins
│   ├── search.ts     // Search registry
│   ├── init.ts       // Create new plugin
│   ├── publish.ts    // Publish to registry
│   └── validate.ts   // Validate plugin structure
├── utils/
│   ├── registry.ts   // API client
│   ├── git.ts        // Git operations
│   └── installer.ts  // Claude Code integration
└── templates/
    ├── plugin/       // Plugin templates
    ├── skill/        // Skill templates
    └── agent/        // Agent templates
```

### Data Models

#### Plugin Index
```typescript
interface PluginIndex {
  id: string;
  name: string;
  description: string;
  author: string | Organization;
  repository: GitRepository;
  marketplaceUrl: string;
  
  // Components included
  skills: Skill[];
  agents: Agent[];
  commands: Command[];
  mcpServers: MCPServer[];
  
  // Metadata
  category: string[];
  tags: string[];
  version: string;
  downloads: number;
  stars: number;
  
  // Trust signals
  verified: boolean;
  securityAudited: boolean;
  officialAnthropicPlugin: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastIndexed: Date;
}

interface Skill {
  name: string;
  description: string;
  path: string; // in repo
  capabilities: string[];
  autoLoad: boolean;
}
```

#### User Collections
```typescript
interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  author: User;
  plugins: string[]; // plugin IDs
  featured: boolean;
  downloads: number;
  installCommand: string;
}
```

---

## Novel Features (The Secret Sauce)

### 1. **Visual Plugin Builder** (Web-Based)
- Build plugins visually on skillstash.com
- Drag-and-drop skills/agents/commands
- Live preview in browser
- Export as GitHub repo
- One-click deploy

### 2. **Skill Composition Engine**
- AI-powered recommendations: "You added X, you might need Y"
- Automatic dependency resolution
- Conflict detection: "This skill conflicts with your current setup"
- Smart bundling: combine related skills into custom plugins

### 3. **Plugin Studio** (VS Code Extension)
- Preview installed plugins
- Browse registry without leaving editor
- Inline documentation
- Quick actions to toggle plugins on/off
- Performance insights (which plugins are slow)

### 4. **Community Curation System**
- GitHub-style "awesome lists" but visual
- Upvote/downvote plugins (HN-style)
- Trust score based on usage + reviews + author reputation
- "Plugin of the Week" featured showcase
- Community-driven quality scores

### 5. **Smart Search with AI**
Natural language search:
- "I need to improve my PR reviews" → shows PR reviewer agents
- "Security scanning for Python" → shows security plugins with Python support
- "Deploy to AWS Lambda" → shows deployment automation plugins

### 6. **Usage Analytics for Authors**
Dashboard showing:
- Downloads over time
- Most popular combined plugins
- User retention (are people keeping your plugin installed?)
- Feedback sentiment analysis
- Performance metrics (how fast does your skill run?)

### 7. **Instant Dev Environments**
```bash
skillstash clone <github-user>/<repo>

# Automatically:
# - Clones repo
# - Detects .claude/skills or .claude-plugin/
# - Installs all dependencies
# - Sets up Claude Code with plugins
# - Ready to develop
```

### 8. **Plugin Playground**
- Try plugins in browser without installing
- Sandboxed WebContainer environment
- See skills in action on sample code
- "Try before you install"

---

## Monetization Strategy

### Free Tier (skillstash.com)
- Unlimited plugin discovery
- CLI tool free forever
- Community plugins
- Basic analytics for authors

### Pro ($9/month per developer)
- Priority search ranking for published plugins
- Advanced analytics
- Custom branding on plugin pages
- API access
- Remove SkillStash branding from CLI

### Enterprise (pluginmarket.place)
- Private plugin hosting
- Custom marketplace URLs
- Team management
- SSO integration
- Support SLAs
- License management
- Bulk billing

### Marketplace Fees (Premium Plugins)
- 10% platform fee on paid plugins
- Authors keep 90%
- Stripe for payments
- Automatic invoicing

---

## Launch Strategy

### Phase 1: The Registry (Weeks 1-4)
- Index existing public marketplaces
- Build basic web UI for browsing
- Launch CLI for searching/installing
- Announce on X, Reddit, HN

**Goal**: Become the place to search for plugins

### Phase 2: Publishing (Weeks 5-8)
- Add publishing flow to CLI
- Web-based plugin submission
- Verification system for publishers
- Launch "Plugin of the Week"

**Goal**: Make publishing dead simple

### Phase 3: Community (Weeks 9-12)
- Collections feature
- User profiles
- Rating/review system
- Featured plugins
- Community curation

**Goal**: Build a engaged community

### Phase 4: Premium (Weeks 13-16)
- Launch pluginmarket.place
- Paid plugins marketplace
- Enterprise features
- Private marketplaces

**Goal**: Revenue from power users

---

## Competitive Moats

1. **Best DX**: CLI experience better than npm
2. **Visual discovery**: Better than text-only GitHub repos
3. **Curation**: Signal vs noise problem solved
4. **Speed**: Edge-hosted, blazing fast
5. **Trust**: Security scanning, verified publishers
6. **Network effects**: More plugins = more users = more plugins
7. **Brand**: Become the "npm for Claude Code"

---

## Success Metrics

### Platform Health
- Total plugins indexed
- Active publishers
- CLI downloads
- Daily active searchers
- Average search-to-install conversion

### Engagement
- Time on site
- Searches per visit
- Plugins installed per user
- Collection creation rate

### Quality
- Plugin survival rate (% still installed after 30 days)
- Average plugin rating
- Security issues caught
- Publisher response time to issues

---

## Why This Will Work

1. **Timing**: Plugin system is brand new (Oct 2025), land grab opportunity
2. **Pain point**: Existing discovery is terrible (scattered GitHub repos)
3. **Developer love**: They loved shadcn's approach, proven model
4. **Network effects**: First-mover advantage in curation
5. **Monetization**: Clear path to revenue without destroying UX
6. **Technical feasibility**: Not overly complex to build v1
7. **Anthropic alignment**: They want an ecosystem, we provide infrastructure

---

## Open Questions

1. How do we handle plugin namespacing conflicts?
2. Should we mirror plugins on SkillStash or always point to source repos?
3. What's the approval process for "featured" plugins?
4. How do we prevent spam/malicious plugins?
5. Should we build our own marketplace.json standard or use Anthropic's exactly?
6. What's the relationship with the official Anthropic marketplace?

---

## Next Steps

1. **Weekend 1**: Ship basic registry + search (index existing marketplaces)
2. **Weekend 2**: Build CLI with add/search commands
3. **Weekend 3**: Launch on X with "The shadcn for Claude Code" positioning
4. **Weekend 4**: Add publishing flow
5. **Month 2**: Community features + premium tier

**Ship fast, iterate based on feedback from early adopters.**