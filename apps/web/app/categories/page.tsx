import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCategories } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Categories - SkillStash',
  description: 'Browse Claude Code plugins by category',
};

const categoryDescriptions: Record<string, string> = {
  Development: 'Tools for building and developing with Claude Code',
  Testing: 'Quality assurance and testing plugins',
  Documentation: 'Documentation generation and management',
  Deployment: 'Deployment and CI/CD integrations',
  Security: 'Security scanning and vulnerability detection',
  Quality: 'Code quality and linting tools',
  Utilities: 'General utilities and helper tools',
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Categories</h1>
        <p className="text-lg text-muted-foreground">
          Browse plugins by category to find what you need
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link key={category} href={`/plugins?category=${encodeURIComponent(category)}`}>
            <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer">
              <CardHeader>
                <CardTitle>{category}</CardTitle>
                <CardDescription>
                  {categoryDescriptions[category] || `Browse ${category} plugins`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View all plugins &rarr;
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
