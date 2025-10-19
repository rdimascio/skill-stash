import Link from 'next/link';
import { ArrowRight, Package, Zap, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PluginCard } from '@/components/plugin-card';
import { SearchBar } from '@/components/search-bar';
import { getFeaturedPlugins, getStats } from '@/lib/api';

export default async function HomePage() {
  // Fetch data in parallel
  const [featuredPlugins, stats] = await Promise.all([
    getFeaturedPlugins(6).catch(() => []),
    getStats().catch(() => ({ total_plugins: 0, total_downloads: 0, total_stars: 0 }))
  ]);

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
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover, share, and install plugins for Claude Code. Skills, agents, commands, and MCP servers in one place.
            </p>
            <div className="max-w-2xl mx-auto mb-8">
              <SearchBar placeholder="Search plugins, skills, agents..." />
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/plugins">
                  Browse Plugins
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/import">Publish Your Plugin</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">{stats.total_plugins.toLocaleString()}</div>
              <div className="text-muted-foreground">Plugins</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{stats.total_downloads.toLocaleString()}</div>
              <div className="text-muted-foreground">Downloads</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{stats.total_stars.toLocaleString()}</div>
              <div className="text-muted-foreground">Stars</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Plugins */}
      {featuredPlugins.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Featured Plugins</h2>
                <p className="text-muted-foreground">Popular and trending plugins from the community</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/plugins">View All</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPlugins.map((plugin) => (
                <PluginCard key={plugin.id} plugin={plugin} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why SkillStash?</h2>
            <p className="text-muted-foreground">
              The easiest way to extend Claude Code with community plugins
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Discovery</h3>
              <p className="text-muted-foreground">
                Search and browse thousands of plugins. Find exactly what you need for your workflow.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">One-Click Install</h3>
              <p className="text-muted-foreground">
                Install plugins with a single command using the SkillStash CLI.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trusted Sources</h3>
              <p className="text-muted-foreground">
                All plugins are sourced from GitHub and reviewed by the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center bg-muted/50 rounded-lg p-12">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl font-bold mb-4">Share Your Plugin</h2>
            <p className="text-muted-foreground mb-8">
              Have a Claude Code plugin? Share it with the community and help others improve their workflow.
            </p>
            <Button size="lg" asChild>
              <Link href="/import">
                Publish Plugin
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
