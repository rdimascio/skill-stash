# Task 009: Migrate Web Frontend from Next.js to TanStack Start

**Priority**: High
**Estimated Time**: 8-12 hours
**Assigned To**: Frontend Web Developer
**Dependencies**: Task 008 (Alchemy Infrastructure) complete
**Status**: Not Started

---

## Overview

Migrate the SkillStash web frontend from Next.js 15 to TanStack Start and deploy using Alchemy to Cloudflare Workers. This migration provides better type safety, faster development with Vite, improved deployment flexibility, and unified deployment with the existing Alchemy infrastructure.

**Key Benefits**:
- **Full Type Safety**: End-to-end type safety across routing, data loading, and server functions
- **Vite-Powered**: Ultra-fast hot module replacement and development experience
- **Unified Deployment**: Deploy web app alongside Workers using Alchemy
- **No Vendor Lock-in**: Deploy anywhere (Cloudflare, AWS, traditional servers)
- **Integrated Data Management**: TanStack Query built-in for data fetching and caching
- **Better Performance**: Cloudflare Workers edge deployment with lower latency

---

## Objectives

1. **Install TanStack Start**
   - Set up TanStack Start with TypeScript
   - Configure TanStack Router
   - Set up Vite build system

2. **Migrate Routing**
   - Convert Next.js file-based routing to TanStack Router
   - Migrate dynamic routes ([slug] → $slug)
   - Update navigation and Link components

3. **Migrate Data Fetching**
   - Convert Next.js Server Components to TanStack Start server functions
   - Migrate API calls to use TanStack Query
   - Update data fetching patterns

4. **Update Components**
   - Migrate all pages and components
   - Update imports and exports
   - Ensure all shadcn/ui components work

5. **Integrate with Alchemy**
   - Add web app to `/alchemy.run.ts`
   - Configure bindings for API endpoints
   - Deploy alongside existing workers

6. **Update Configuration**
   - Remove Next.js config
   - Add TanStack Start config
   - Update package scripts

---

## Technical Requirements

### 1. TanStack Start Installation

**Install dependencies**:
```bash
cd apps/web

# Remove Next.js
pnpm remove next

# Install TanStack Start
pnpm add @tanstack/start @tanstack/react-router
pnpm add -D @tanstack/router-vite-plugin @tanstack/router-devtools
pnpm add -D vinxi vite
```

**Update `package.json` scripts**:
```json
{
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  }
}
```

### 2. Project Structure Transformation

**Before (Next.js)**:
```
apps/web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── plugins/
│   │   ├── page.tsx
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── search/page.tsx
│   ├── categories/page.tsx
│   └── import/page.tsx
├── components/
├── lib/
└── next.config.js
```

**After (TanStack Start)**:
```
apps/web/
├── app/
│   ├── routes/
│   │   ├── __root.tsx        # Root layout
│   │   ├── index.tsx          # Home page
│   │   ├── plugins/
│   │   │   ├── index.tsx      # /plugins
│   │   │   └── $slug.tsx      # /plugins/:slug
│   │   ├── search.tsx         # /search
│   │   ├── categories.tsx     # /categories
│   │   └── import.tsx         # /import
│   ├── router.tsx             # Router configuration
│   ├── client.tsx             # Client entry
│   └── server.tsx             # Server entry
├── components/
├── lib/
└── app.config.ts              # TanStack Start config
```

### 3. Router Configuration

**Create `app/router.tsx`**:
```typescript
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function createRouter() {
  return createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
```

**Create `app/routes/__root.tsx`** (replaces `app/layout.tsx`):
```typescript
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import '@/styles/globals.css';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>SkillStash - The npm for Claude Code</title>
      </head>
      <body>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        <TanStackRouterDevtools position="bottom-right" />
      </body>
    </html>
  );
}
```

**Create `app/routes/index.tsx`** (replaces `app/page.tsx`):
```typescript
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/start';
import Link from 'next/link';
import { ArrowRight, Package, Zap, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PluginCard } from '@/components/plugin-card';
import { SearchBar } from '@/components/search-bar';

// Server function to fetch data
const getFeaturedPluginsData = createServerFn('GET', async () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skillstash.com';

  const [featuredPlugins, stats] = await Promise.all([
    fetch(`${API_URL}/api/plugins?featured=true&limit=6`)
      .then(res => res.json())
      .catch(() => ({ data: [] })),
    fetch(`${API_URL}/api/stats`)
      .then(res => res.json())
      .catch(() => ({ total_plugins: 0, total_downloads: 0, total_stars: 0 }))
  ]);

  return { featuredPlugins: featuredPlugins.data, stats };
});

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: async () => {
    const data = await getFeaturedPluginsData();
    return data;
  },
});

function HomePage() {
  const { featuredPlugins, stats } = Route.useLoaderData();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              The npm for{' '}
              <span className="text-primary">Claude Code</span>
            </h1>
            {/* ... rest of homepage content ... */}
          </div>
        </div>
      </section>
      {/* ... rest of sections ... */}
    </div>
  );
}
```

**Create `app/routes/plugins/$slug.tsx`** (replaces `app/plugins/[slug]/page.tsx`):
```typescript
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/start';
import { notFound } from '@tanstack/react-router';

const getPluginData = createServerFn('GET', async (slug: string) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skillstash.com';
  const response = await fetch(`${API_URL}/api/plugins/${slug}`);

  if (!response.ok) {
    throw notFound();
  }

  return response.json();
});

export const Route = createFileRoute('/plugins/$slug')({
  component: PluginDetailPage,
  loader: async ({ params }) => {
    const plugin = await getPluginData(params.slug);
    return { plugin };
  },
});

function PluginDetailPage() {
  const { plugin } = Route.useLoaderData();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Plugin detail content */}
    </div>
  );
}
```

### 4. Server Functions for Data Fetching

**Pattern for data fetching**:
```typescript
import { createServerFn } from '@tanstack/start';

// Define server function
const fetchPlugins = createServerFn('GET', async (params: {
  query?: string;
  limit?: number
}) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const url = new URL(`${API_URL}/api/plugins`);

  if (params.query) url.searchParams.set('q', params.query);
  if (params.limit) url.searchParams.set('limit', params.limit.toString());

  const response = await fetch(url.toString());
  return response.json();
});

// Use in route loader
export const Route = createFileRoute('/plugins')({
  loader: async ({ search }) => {
    const data = await fetchPlugins({
      query: search.q,
      limit: 20
    });
    return data;
  },
});
```

### 5. Navigation and Links

**Update Link components**:
```typescript
// Before (Next.js)
import Link from 'next/link';
<Link href="/plugins">Browse</Link>

// After (TanStack Start)
import { Link } from '@tanstack/react-router';
<Link to="/plugins">Browse</Link>
```

**Update useRouter**:
```typescript
// Before (Next.js)
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/plugins');

// After (TanStack Start)
import { useNavigate } from '@tanstack/react-router';
const navigate = useNavigate();
navigate({ to: '/plugins' });
```

### 6. TanStack Start Configuration

**Create `app.config.ts`**:
```typescript
import { defineConfig } from '@tanstack/start/config';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  vite: {
    plugins: [
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
    ],
  },
  server: {
    preset: 'cloudflare-workers',
  },
});
```

### 7. Alchemy Integration

**Update `/alchemy.run.ts`** to include web app:
```typescript
import alchemy from "alchemy";
import { Worker, D1Database, R2Bucket, TanStackStart } from "alchemy/cloudflare";

const app = await alchemy("skillstash");

// Existing resources
const database = await D1Database("skillstash-registry");
const cache = await R2Bucket("skillstash-cache");

// API Worker
const apiWorker = await Worker("skillstash-api", {
  entrypoint: "./workers/api/src/index.ts",
  bindings: { DB: database, CACHE: cache },
  secrets: ["GITHUB_TOKEN"],
});

// Indexer Worker
const indexerWorker = await Worker("skillstash-indexer", {
  entrypoint: "./workers/indexer/src/index.ts",
  bindings: { DB: database, CACHE: cache },
  secrets: ["GITHUB_TOKEN"],
  triggers: { crons: ["0 2 * * *"] },
});

// Web App (NEW)
const webApp = await TanStackStart("skillstash-web", {
  path: "./apps/web",
  vars: {
    NEXT_PUBLIC_API_URL: apiWorker.url,
    NEXT_PUBLIC_INDEXER_URL: indexerWorker.url,
  },
});

console.log(`✅ API Worker deployed: ${apiWorker.url}`);
console.log(`✅ Indexer Worker deployed: ${indexerWorker.url}`);
console.log(`✅ Web App deployed: ${webApp.url}`);

await app.finalize();
```

### 8. Environment Variables

**Update `.env.example`**:
```bash
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id

# GitHub Token
GITHUB_TOKEN=your-github-personal-access-token

# Environment
ENVIRONMENT=production

# API URLs (automatically set by Alchemy for web app)
NEXT_PUBLIC_API_URL=https://skillstash-api.your-subdomain.workers.dev
NEXT_PUBLIC_INDEXER_URL=https://skillstash-indexer.your-subdomain.workers.dev
```

---

## Migration Steps

### Phase 1: Setup TanStack Start (2 hours)

1. **Install Dependencies**
   ```bash
   cd apps/web
   pnpm remove next
   pnpm add @tanstack/start @tanstack/react-router vinxi
   pnpm add -D @tanstack/router-vite-plugin @tanstack/router-devtools vite
   ```

2. **Create Basic Structure**
   - Create `app/router.tsx`
   - Create `app/routes/__root.tsx`
   - Create `app/routes/index.tsx`
   - Create `app.config.ts`

3. **Test Basic Setup**
   ```bash
   pnpm dev  # Should start Vite dev server
   ```

### Phase 2: Migrate Routes (3 hours)

1. **Convert File-Based Routes**
   - `app/page.tsx` → `app/routes/index.tsx`
   - `app/plugins/page.tsx` → `app/routes/plugins/index.tsx`
   - `app/plugins/[slug]/page.tsx` → `app/routes/plugins/$slug.tsx`
   - `app/search/page.tsx` → `app/routes/search.tsx`
   - `app/categories/page.tsx` → `app/routes/categories.tsx`
   - `app/import/page.tsx` → `app/routes/import.tsx`

2. **Update Route Definitions**
   - Add `createFileRoute` to each route
   - Add loaders for data fetching
   - Update component exports

3. **Test All Routes**
   - Navigate to each page
   - Verify data loading
   - Check dynamic routes

### Phase 3: Migrate Data Fetching (2 hours)

1. **Create Server Functions**
   - Convert async Server Components to server functions
   - Move API calls to `createServerFn`
   - Update data fetching patterns

2. **Add Route Loaders**
   - Add `loader` to route definitions
   - Use `Route.useLoaderData()` in components

3. **Test Data Fetching**
   - Verify all API calls work
   - Check error handling
   - Test loading states

### Phase 4: Update Components (2 hours)

1. **Update Navigation**
   - Replace `next/link` with `@tanstack/react-router`
   - Update `useRouter` to `useNavigate`
   - Update dynamic routes syntax

2. **Update Components**
   - Ensure all components work
   - Fix import paths
   - Test interactivity

3. **Verify shadcn/ui**
   - Test all UI components
   - Ensure Tailwind CSS works
   - Check dark mode

### Phase 5: Alchemy Integration (1 hour)

1. **Update `/alchemy.run.ts`**
   - Add TanStackStart resource
   - Configure environment variables
   - Link to API worker URLs

2. **Test Local Deployment**
   ```bash
   pnpm build:web
   alchemy dev  # Test locally
   ```

3. **Deploy to Production**
   ```bash
   alchemy deploy
   ```

### Phase 6: Update Configuration (1 hour)

1. **Update `package.json`**
   - Remove Next.js scripts
   - Add TanStack Start scripts
   - Update build command

2. **Update Root `package.json`**
   - Remove `deploy:web` Vercel script
   - Web app now deployed with `alchemy deploy`

3. **Update GitHub Actions**
   - Remove separate web deployment workflow
   - Web app deploys with workers in single workflow

### Phase 7: Documentation & Cleanup (1 hour)

1. **Update Documentation**
   - Update DEPLOYMENT.md
   - Update CLAUDE.md
   - Update README.md

2. **Clean Up**
   - Remove `next.config.js`
   - Remove Next.js specific files
   - Remove Vercel configuration

3. **Final Testing**
   - Full smoke test of all pages
   - Verify deployment
   - Performance check

---

## Acceptance Criteria

### Functionality
- [x] All routes work correctly
- [x] Dynamic routes ($slug) function properly
- [x] Navigation between pages works
- [x] Data fetching successful on all pages
- [x] Server functions execute correctly
- [x] Forms and interactivity work (import page)

### Components
- [x] All shadcn/ui components render correctly
- [x] Tailwind CSS styles apply properly
- [x] Dark mode toggle works
- [x] Responsive design maintained
- [x] Icons and images load

### Data & API
- [x] API calls succeed
- [x] Error handling works
- [x] Loading states display
- [x] Data caching functional (TanStack Query)
- [x] Environment variables accessible

### Deployment
- [x] Builds successfully with Vinxi
- [x] Deploys to Cloudflare Workers via Alchemy
- [x] Web app accessible at worker URL
- [x] Environment variables injected correctly
- [x] Performance meets targets (< 1s page load)

### Configuration
- [x] Package.json scripts updated
- [x] Alchemy configuration complete
- [x] TypeScript types working
- [x] No build errors or warnings
- [x] ESLint passes

### Git Workflow
- [x] Feature branch created
- [x] Conventional commits used
- [x] PR created with description
- [x] All checks passing
- [x] Ready for review

---

## Testing Checklist

### Local Development
- [ ] `pnpm dev` starts dev server
- [ ] Hot reload works
- [ ] All pages load
- [ ] Navigation works
- [ ] API calls succeed
- [ ] TypeScript compiles

### Build
- [ ] `pnpm build` completes successfully
- [ ] No build errors
- [ ] TypeScript checks pass
- [ ] Bundle size acceptable

### Deployment
- [ ] `alchemy deploy` succeeds
- [ ] Web app accessible
- [ ] All routes work in production
- [ ] API integration works
- [ ] Environment variables set

### Functionality
- [ ] Home page loads with featured plugins
- [ ] Browse page shows plugins
- [ ] Search functionality works
- [ ] Plugin detail pages render
- [ ] Import form functions
- [ ] Categories page displays

### Performance
- [ ] First paint < 1 second
- [ ] TTI < 2 seconds
- [ ] Cloudflare edge performance
- [ ] No JavaScript errors in console

---

## Rollback Plan

If issues arise:

1. **Keep Next.js branch**: Don't delete existing code until migration complete
2. **Feature branch**: All work in separate branch for easy revert
3. **Alchemy rollback**: Can remove TanStackStart from alchemy.run.ts
4. **Vercel fallback**: Can redeploy Next.js version to Vercel if needed
5. **Database unchanged**: No changes to D1 or R2 resources

---

## References

### Documentation
- [TanStack Start](https://tanstack.com/start/latest)
- [TanStack Router](https://tanstack.com/router/latest)
- [Alchemy TanStack Start](https://alchemy.run/providers/cloudflare/tanstack-start/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

### Migration Guides
- [Next.js to TanStack Start](https://tanstack.com/router/latest/docs/framework/react/guide/migrating-from-nextjs)
- [TanStack Router Guide](https://tanstack.com/router/latest/docs/framework/react/guide/routing)

---

## Benefits Summary

**Before (Next.js + Vercel)**:
- Separate deployment from Workers
- Vendor lock-in to Vercel
- File-based routing with less type safety
- Slower development (Webpack)
- Manual environment configuration

**After (TanStack Start + Alchemy)**:
- Unified deployment with `alchemy deploy`
- No vendor lock-in (deploy anywhere)
- Full type safety across stack
- Faster development (Vite HMR)
- Automatic environment configuration
- Edge deployment on Cloudflare Workers
- Lower latency with edge network

---

## Notes

- TanStack Start is in RC (Release Candidate) but production-ready
- Vite provides significantly faster HMR than Next.js Webpack
- TanStack Router offers better type safety than Next.js App Router
- Cloudflare Workers edge deployment = lower latency globally
- Unified Alchemy deployment simplifies infrastructure management
- All existing worker code remains unchanged
- Database and R2 resources unaffected

---

**Created**: October 18, 2025
**Last Updated**: October 18, 2025
**Status**: Ready for Frontend Developer
