import Link from 'next/link';
import { Star, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Plugin } from '@/lib/api';

interface PluginCardProps {
  plugin: Plugin;
}

export function PluginCard({ plugin }: PluginCardProps) {
  return (
    <Link href={`/plugins/${plugin.slug}`}>
      <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer group">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate group-hover:text-primary transition-colors">
                {plugin.name}
              </CardTitle>
              <CardDescription className="mt-1.5 text-xs text-muted-foreground">
                by {plugin.author}
              </CardDescription>
            </div>
            {plugin.repository_url && (
              <a
                href={plugin.repository_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {plugin.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {plugin.category && (
              <Badge variant="secondary" className="text-xs">
                {plugin.category}
              </Badge>
            )}
            {plugin.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {plugin.tags?.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{plugin.tags.length - 2}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span>{plugin.stars.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              <span>{plugin.downloads.toLocaleString()}</span>
            </div>
            {plugin.version && (
              <span className="ml-auto text-xs">v{plugin.version}</span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
