import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchBar } from '@/components/search-bar';
import { PluginCard } from '@/components/plugin-card';
import { Skeleton } from '@/components/ui/skeleton';
import { searchPlugins } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Search Plugins - SkillStash',
  description: 'Search for Claude Code plugins on SkillStash',
};

interface PageProps {
  searchParams: {
    q?: string;
    page?: string;
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const query = searchParams.q || '';
  const page = Number(searchParams.page) || 1;

  let results = null;
  let error = null;

  if (query) {
    try {
      results = await searchPlugins(query, { page, limit: 24 });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to search plugins';
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Search Plugins</h1>
        <SearchBar initialQuery={query} />
      </div>

      {/* Results */}
      {query ? (
        <>
          <div className="mb-6">
            <p className="text-muted-foreground">
              {results ? (
                <>
                  Found <span className="font-medium">{results.pagination.total}</span> result
                  {results.pagination.total !== 1 ? 's' : ''} for &quot;{query}&quot;
                </>
              ) : error ? (
                <span className="text-destructive">{error}</span>
              ) : (
                'Searching...'
              )}
            </p>
          </div>

          {results && results.data.length > 0 ? (
            <Suspense fallback={<SearchGridSkeleton />}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.data.map((plugin) => (
                  <PluginCard key={plugin.id} plugin={plugin} />
                ))}
              </div>
            </Suspense>
          ) : results && results.data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">
                No plugins found matching &quot;{query}&quot;
              </p>
              <p className="text-sm text-muted-foreground">
                Try different keywords or browse all plugins
              </p>
            </div>
          ) : null}

          {/* Pagination */}
          {results && results.pagination.total > results.pagination.limit && (
            <div className="mt-12 flex justify-center gap-2">
              {page > 1 && (
                <a
                  href={`?q=${encodeURIComponent(query)}&page=${page - 1}`}
                  className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
                >
                  Previous
                </a>
              )}

              <span className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground">
                {page}
              </span>

              {results.pagination.has_more && (
                <a
                  href={`?q=${encodeURIComponent(query)}&page=${page + 1}`}
                  className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
                >
                  Next
                </a>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Enter a search term to find plugins
          </p>
        </div>
      )}
    </div>
  );
}

function SearchGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
