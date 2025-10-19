import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PluginCard } from '@/components/plugin-card';
import { SearchBar } from '@/components/search-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { getPlugins } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Browse Plugins - SkillStash',
  description: 'Browse all Claude Code plugins available on SkillStash',
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    sort?: 'stars' | 'downloads' | 'recent';
  }>;
}

export default async function PluginsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const category = params.category;
  const sort = params.sort || 'stars';

  const { data: plugins, pagination } = await getPlugins({
    page,
    limit: 24,
    category,
    sort,
  }).catch(() => ({ data: [], pagination: { total: 0, limit: 24, offset: 0, has_more: false } }));

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Browse Plugins</h1>
        <p className="text-muted-foreground mb-6">
          Discover plugins to extend Claude Code with new capabilities
        </p>
        <SearchBar />
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sort by:</span>
            <div className="flex gap-2">
              <SortButton active={sort === 'stars'} label="Stars" value="stars" />
              <SortButton active={sort === 'downloads'} label="Downloads" value="downloads" />
              <SortButton active={sort === 'recent'} label="Recent" value="recent" />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          Showing {plugins.length} of {pagination.total} plugins
        </p>
      </div>

      {/* Plugins Grid */}
      {plugins.length > 0 ? (
        <Suspense fallback={<PluginsGridSkeleton />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plugins.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </div>
        </Suspense>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No plugins found</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="mt-12 flex justify-center gap-2">
          <PaginationButtons
            currentPage={page}
            totalPages={Math.ceil(pagination.total / pagination.limit)}
            hasMore={pagination.has_more}
          />
        </div>
      )}
    </div>
  );
}

function SortButton({
  active,
  label,
  value,
}: {
  active: boolean;
  label: string;
  value: string;
}) {
  return (
    <a
      href={`?sort=${value}`}
      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted hover:bg-muted/80'
      }`}
    >
      {label}
    </a>
  );
}

function PaginationButtons({
  currentPage,
  totalPages,
  hasMore,
}: {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}) {
  const pages = [];
  const showPages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
  const endPage = Math.min(totalPages, startPage + showPages - 1);

  if (endPage - startPage < showPages - 1) {
    startPage = Math.max(1, endPage - showPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <>
      {currentPage > 1 && (
        <a
          href={`?page=${currentPage - 1}`}
          className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
        >
          Previous
        </a>
      )}

      {pages.map((page) => (
        <a
          key={page}
          href={`?page=${page}`}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            page === currentPage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          {page}
        </a>
      ))}

      {hasMore && currentPage < totalPages && (
        <a
          href={`?page=${currentPage + 1}`}
          className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
        >
          Next
        </a>
      )}
    </>
  );
}

function PluginsGridSkeleton() {
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
