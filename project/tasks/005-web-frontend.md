# Task 005: Web Frontend (Next.js)

## Objective
Build the skillstash.com web interface for discovering and browsing plugins with a beautiful, fast UI.

## Context
The web interface is the primary discovery layer. It should feel premium, load instantly, and make finding plugins effortless.

## Tech Stack
- **Next.js 15** (App Router, React Server Components)
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **Vercel** for hosting (edge deployment)

## Pages & Routes

### Home Page (`/`)
- Hero with search bar
- Featured plugins carousel
- Category grid
- Trending plugins
- Recently added
- CTA to publish plugins

### Browse Page (`/plugins`)
- Grid view of all plugins
- Filters (category, verified, stars)
- Sort options
- Pagination
- Search bar

### Plugin Detail (`/plugins/[slug]`)
- Plugin header (name, description, stats)
- Install command (copy button)
- README content
- Component tabs (Skills, Agents, Commands)
- Version history
- Author info
- Related plugins

### Category Page (`/categories/[category]`)
- Filtered plugin list by category
- Category description
- Top plugins in category

### Collections (`/collections`)
- Featured collections
- User collections
- Collection cards

### Collection Detail (`/collections/[slug]`)
- Collection info
- List of plugins
- Install all command

### Search Results (`/search?q=...`)
- Search results grid
- Filters
- Sort by relevance

## File Structure
```
apps/web/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── plugins/
│   │   ├── page.tsx            # Browse plugins
│   │   └── [slug]/
│   │       └── page.tsx        # Plugin detail
│   ├── categories/
│   │   └── [category]/
│   │       └── page.tsx        # Category page
│   ├── collections/
│   │   ├── page.tsx            # Collections list
│   │   └── [slug]/
│   │       └── page.tsx        # Collection detail
│   └── search/
│       └── page.tsx            # Search results
├── components/
│   ├── ui/                     # shadcn components
│   ├── plugin-card.tsx         # Plugin card
│   ├── search-bar.tsx          # Search input
│   ├── copy-button.tsx         # Copy command button
│   ├── category-grid.tsx       # Category grid
│   └── install-command.tsx     # Install command display
├── lib/
│   ├── api.ts                  # API client
│   ├── utils.ts                # Utilities
│   └── constants.ts            # Constants
├── public/
│   └── images/
└── styles/
    └── globals.css
```

## Key Components

### Plugin Card (`components/plugin-card.tsx`)
```typescript
import { Plugin } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Download, Star } from 'lucide-react';
import Link from 'next/link';

interface PluginCardProps {
  plugin: Plugin;
}

export function PluginCard({ plugin }: PluginCardProps) {
  return (
    <Link href={`/plugins/${plugin.slug}`}>
      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{plugin.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {plugin.description?.substring(0, 80)}...
              </p>
            </div>
            {plugin.verified && (
              <Badge variant="secondary" className="ml-2">
                ✓ Verified
              </Badge>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              {plugin.downloads.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              {plugin.stars}
            </span>
          </div>
          
          {/* Category */}
          <Badge variant="outline">{plugin.category}</Badge>
        </div>
      </Card>
    </Link>
  );
}
```

### Install Command (`components/install-command.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

interface InstallCommandProps {
  command: string;
}

export function InstallCommand({ command }: InstallCommandProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="bg-muted rounded-lg p-4 font-mono text-sm flex items-center justify-between">
      <code>{command}</code>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCopy}
        className="ml-4"
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
```

### Search Bar (`components/search-bar.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };
  
  return (
    <form onSubmit={handleSearch} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search plugins..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 w-full"
      />
    </form>
  );
}
```

## Pages Implementation

### Home Page (`app/page.tsx`)
```typescript
import { SearchBar } from '@/components/search-bar';
import { PluginCard } from '@/components/plugin-card';
import { CategoryGrid } from '@/components/category-grid';
import { Button } from '@/components/ui/button';
import { getPlugins, getCategories } from '@/lib/api';
import Link from 'next/link';

export default async function HomePage() {
  const [featured, trending, categories] = await Promise.all([
    getPlugins({ sort: 'stars', limit: 6 }),
    getPlugins({ sort: 'downloads', limit: 6 }),
    getCategories()
  ]);
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">
            The Registry for
            <span className="text-primary"> Claude Code</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover, install, and share plugins, skills, and agents for Claude Code
          </p>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <SearchBar />
          </div>
          
          {/* Quick Stats */}
          <div className="flex justify-center gap-8 text-sm text-muted-foreground pt-4">
            <span>150+ Plugins</span>
            <span>•</span>
            <span>50K+ Downloads</span>
            <span>•</span>
            <span>Open Source</span>
          </div>
        </div>
      </section>
      
      {/* Categories */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Browse by Category</h2>
          <CategoryGrid categories={categories} />
        </div>
      </section>
      
      {/* Featured Plugins */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Plugins</h2>
            <Button variant="ghost" asChild>
              <Link href="/plugins">View All →</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.plugins.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Trending */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Trending This Week</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trending.plugins.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-bold">
            Share Your Plugin with the Community
          </h2>
          <p className="text-xl opacity-90">
            Built something useful? Publish it to SkillStash and help other developers
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Get Started
            </Button>
            <Button size="lg" variant="outline">
              View Docs
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
```

### Plugin Detail Page (`app/plugins/[slug]/page.tsx`)
```typescript
import { notFound } from 'next/navigation';
import { getPluginBySlug } from '@/lib/api';
import { InstallCommand } from '@/components/install-command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Star, GitFork, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default async function PluginPage({ params }: { params: { slug: string } }) {
  const plugin = await getPluginBySlug(params.slug);
  
  if (!plugin) {
    notFound();
  }
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl font-bold">{plugin.name}</h1>
                {plugin.verified && (
                  <Badge>✓ Verified</Badge>
                )}
                {plugin.official && (
                  <Badge variant="secondary">Official</Badge>
                )}
              </div>
              
              <p className="text-xl text-muted-foreground mb-6">
                {plugin.description}
              </p>
              
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {plugin.downloads.toLocaleString()} downloads
                </span>
                <span className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  {plugin.stars} stars
                </span>
                <span className="flex items-center gap-2">
                  <GitFork className="h-4 w-4" />
                  Version {plugin.version}
                </span>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="ml-8">
              <Button asChild>
                <Link href={plugin.repo_url} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on GitHub
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Install Command */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-sm font-medium mb-3">Installation</h2>
          <InstallCommand command={plugin.install_command} />
        </div>
      </section>
      
      {/* Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <Tabs defaultValue="readme">
            <TabsList>
              <TabsTrigger value="readme">README</TabsTrigger>
              {plugin.skills?.length > 0 && (
                <TabsTrigger value="skills">
                  Skills ({plugin.skills.length})
                </TabsTrigger>
              )}
              {plugin.agents?.length > 0 && (
                <TabsTrigger value="agents">
                  Agents ({plugin.agents.length})
                </TabsTrigger>
              )}
              {plugin.commands?.length > 0 && (
                <TabsTrigger value="commands">
                  Commands ({plugin.commands.length})
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="readme" className="mt-6">
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>
                  {plugin.readme || 'No README available.'}
                </ReactMarkdown>
              </div>
            </TabsContent>
            
            <TabsContent value="skills" className="mt-6">
              <div className="grid gap-4">
                {plugin.skills?.map((skill) => (
                  <div key={skill.id} className="border rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-2">{skill.name}</h3>
                    <p className="text-muted-foreground">{skill.description}</p>
                    <code className="text-sm text-muted-foreground block mt-2">
                      {skill.path}
                    </code>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="agents" className="mt-6">
              <div className="grid gap-4">
                {plugin.agents?.map((agent) => (
                  <div key={agent.id} className="border rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-2">{agent.name}</h3>
                    <p className="text-muted-foreground">{agent.description}</p>
                    {agent.type && (
                      <Badge variant="outline" className="mt-2">{agent.type}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="commands" className="mt-6">
              <div className="grid gap-4">
                {plugin.commands?.map((command) => (
                  <div key={command.id} className="border rounded-lg p-6">
                    <h3 className="font-mono font-semibold text-lg mb-2">
                      /{command.name}
                    </h3>
                    <p className="text-muted-foreground mb-3">{command.description}</p>
                    {command.usage_example && (
                      <div className="bg-muted rounded p-3 font-mono text-sm">
                        {command.usage_example}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
```

### API Client (`lib/api.ts`)
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.skillstash.com';

export async function getPlugins(options: {
  page?: number;
  limit?: number;
  category?: string;
  sort?: string;
}) {
  const params = new URLSearchParams();
  if (options.page) params.set('page', options.page.toString());
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.category) params.set('category', options.category);
  if (options.sort) params.set('sort', options.sort);
  
  const response = await fetch(`${API_BASE}/api/plugins?${params}`, {
    next: { revalidate: 300 } // Cache for 5 minutes
  });
  
  return response.json();
}

export async function getPluginBySlug(slug: string) {
  const response = await fetch(`${API_BASE}/api/plugins/${slug}`, {
    next: { revalidate: 60 }
  });
  
  if (response.status === 404) {
    return null;
  }
  
  return response.json();
}

export async function searchPlugins(query: string) {
  const response = await fetch(
    `${API_BASE}/api/search?q=${encodeURIComponent(query)}`,
    { next: { revalidate: 60 } }
  );
  
  return response.json();
}

export async function getCategories() {
  const response = await fetch(`${API_BASE}/api/categories`, {
    next: { revalidate: 3600 } // Cache for 1 hour
  });
  
  return response.json();
}
```

### Configuration Files

#### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com', 'github.com']
  },
  experimental: {
    serverActions: true
  }
};

module.exports = nextConfig;
```

#### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};

export default config;
```

## Deliverables

1. Complete Next.js app with all pages
2. Responsive design (mobile, tablet, desktop)
3. shadcn/ui components integrated
4. Fast loading with RSC and caching
5. SEO optimized (metadata, sitemap)
6. Dark mode support
7. Deployed to Vercel

## Success Criteria

- [ ] All pages render correctly
- [ ] Fast page loads (< 1s LCP)
- [ ] Mobile responsive
- [ ] Search works
- [ ] Copy buttons functional
- [ ] Links to GitHub work
- [ ] Dark mode toggles
- [ ] SEO metadata present
- [ ] Deployed to skillstash.com

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```