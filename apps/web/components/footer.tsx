import Link from 'next/link';
import { Package, Github, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg mb-4">
              <Package className="h-6 w-6" />
              <span>SkillStash</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              The npm for Claude Code. Discover, share, and install plugins for Claude Code.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a
                href="https://github.com/rdimascio/skill-stash"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/skillstash"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/plugins" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse Plugins
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
                  Search
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Developers</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/import" className="text-muted-foreground hover:text-foreground transition-colors">
                  Publish Plugin
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/rdimascio/skill-stash/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/rdimascio/skill-stash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>Built with Next.js, Cloudflare Workers, and shadcn/ui</p>
        </div>
      </div>
    </footer>
  );
}
