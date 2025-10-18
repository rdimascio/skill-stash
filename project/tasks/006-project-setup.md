### GitHub Actions Setup

#### Deploy Web (`.github/workflows/deploy-web.yml`)
```yaml
name: Deploy Web

on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'
      - 'packages/shared/**'
      - '.github/workflows/deploy-web.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm turbo run build --filter=web
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./apps/web
```

#### Deploy Workers (`.github/workflows/deploy-workers.yml`)
```yaml
name: Deploy Workers

on:
  push:
    branches: [main]
    paths:
      - 'workers/**'
      - 'packages/shared/**'
      - '.github/workflows/deploy-workers.yml'

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Deploy API Worker
        working-directory: ./workers/api
        run: pnpm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  
  deploy-indexer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Deploy Indexer Worker
        working-directory: ./workers/indexer
        run: pnpm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

#### Publish CLI (`.github/workflows/publish-cli.yml`)
```yaml
name: Publish CLI

on:
  push:
    tags:
      - 'cli-v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build CLI
        run: pnpm turbo run build --filter=@skillstash/cli
      
      - name: Publish to npm
        working-directory: ./packages/cli
        run: pnpm publish --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Environment Variables

### Web App (`apps/web/.env.local`)
```bash
NEXT_PUBLIC_API_URL=https://api.skillstash.com
NEXT_PUBLIC_CLI_VERSION=1.0.0
```

### API Worker (`workers/api/.dev.vars`)
```bash
ENVIRONMENT=development
API_VERSION=v1
```

### Indexer Worker (`workers/indexer/.dev.vars`)
```bash
GITHUB_TOKEN=your_github_token_here
ENVIRONMENT=development
```

## Development Commands

```bash
# Install all dependencies
pnpm install

# Run everything in dev mode
pnpm dev

# Run specific app
pnpm --filter web dev
pnpm --filter @skillstash/cli dev
pnpm --filter api dev

# Build everything
pnpm build

# Lint all packages
pnpm lint

# Format code
pnpm format

# Test
pnpm test

# Deploy
pnpm deploy:web
pnpm deploy:workers
pnpm publish:cli
```

## DNS Configuration

### skillstash.com
```
Type    Name    Value                       TTL
A       @       76.76.21.21                 Auto
CNAME   www     cname.vercel-dns.com        Auto
CNAME   api     api.skillstash.com.workers.dev# Task 006: Project Setup & Infrastructure

## Objective
Set up the monorepo structure, development environment, and deploy infrastructure for the entire SkillStash project.

## Monorepo Structure

```
skillstash/
├── apps/
│   ├── web/                    # Next.js frontend (skillstash.com)
│   └── docs/                   # Documentation site (optional)
├── packages/
│   ├── cli/                    # @skillstash/cli npm package
│   ├── shared/                 # Shared types and utilities
│   └── config/                 # Shared configs (tsconfig, eslint)
├── workers/
│   ├── api/                    # Registry API worker
│   └── indexer/                # Plugin indexer worker
├── .github/
│   └── workflows/
│       ├── deploy-web.yml      # Deploy frontend
│       ├── deploy-workers.yml  # Deploy workers
│       └── publish-cli.yml     # Publish CLI to npm
├── package.json                # Root package.json (workspace)
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # pnpm workspaces
└── README.md
```

## Setup Instructions

### 1. Initialize Monorepo

```bash
# Create project
mkdir skillstash && cd skillstash

# Initialize pnpm workspace
pnpm init

# Create workspace config
cat > pnpm-workspace.yaml << EOF
packages:
  - 'apps/*'
  - 'packages/*'
  - 'workers/*'
EOF
```

### 2. Root `package.json`

```json
{
  "name": "skillstash",
  "private": true,
  "version": "1.0.0",
  "description": "The registry for Claude Code plugins",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "deploy:web": "turbo run build --filter=web && vercel --prod",
    "deploy:workers": "turbo run deploy --filter=@skillstash/workers-*",
    "publish:cli": "turbo run build --filter=@skillstash/cli && cd packages/cli && npm publish"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "prettier": "^3.1.0",
    "@typescript-eslint/parser": "^6.13.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "eslint": "^8.55.0",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### 3. Turborepo Config (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    },
    "deploy": {
      "dependsOn": ["build"]
    }
  }
}
```

### 4. Shared TypeScript Config (`packages/config/tsconfig.base.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "incremental": true
  }
}
```

### 5. Shared Types Package (`packages/shared/`)

```typescript
// packages/shared/src/types.ts

export interface Plugin {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  author_id: string;
  author_type: 'user' | 'org';
  repo_url: string;
  marketplace_url: string;
  homepage_url: string | null;
  category: string;
  tags: string[];
  version: string;
  latest_commit_sha: string | null;
  downloads: number;
  stars: number;
  verified: boolean;
  security_audited: boolean;
  official: boolean;
  created_at: string;
  updated_at: string;
  last_indexed_at: string | null;
}

export interface Skill {
  id: string;
  plugin_id: string;
  name: string;
  description: string | null;
  path: string;
  capabilities: string[];
  auto_load: boolean;
  created_at: string;
}

export interface Agent {
  id: string;
  plugin_id: string;
  name: string;
  description: string | null;
  path: string;
  type: 'subagent' | 'chat' | 'workflow' | null;
  created_at: string;
}

export interface Command {
  id: string;
  plugin_id: string;
  name: string;
  description: string | null;
  path: string;
  usage_example: string | null;
  created_at: string;
}

export interface MCPServer {
  id: string;
  plugin_id: string;
  name: string;
  description: string | null;
  path: string;
  service_type: string | null;
  created_at: string;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  author_id: string;
  featured: boolean;
  downloads: number;
  created_at: string;
  updated_at: string;
}
```

```json
// packages/shared/package.json
{
  "name": "@skillstash/shared",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

## Infrastructure Setup

### Cloudflare Setup

#### 1. Create D1 Database
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create skillstash-registry

# Note the database_id from output
# Add it to wrangler.toml files
```

#### 2. Run Migrations
```bash
# Navigate to a worker directory
cd workers/api

# Run migrations
wrangler d1 migrations apply skillstash-registry --local  # Test locally
wrangler d1 migrations apply skillstash-registry          # Apply to production
```

#### 3. Create R2 Bucket
```bash
# Create R2 bucket for caching
wrangler r2 bucket create skillstash-cache
```

#### 4. Set Secrets
```bash
# Set GitHub token for indexer
cd workers/indexer
wrangler secret put GITHUB_TOKEN

# Enter your GitHub personal access token when prompted
```

### Vercel Setup

#### 1. Link Project
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to web app
cd apps/web

# Link to Vercel project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://api.skillstash.com
```

#### 2. Configure Domains
In Vercel dashboard:
- Add `skillstash.com` to project
- Configure DNS:
  - A record: @ → 76.76.21.21
  - CNAME record: www → cname.vercel-dns.com

### GitHub Actions Setup

#### Deploy Web (`