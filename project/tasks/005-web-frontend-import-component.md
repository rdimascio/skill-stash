# Import Plugin Component Implementation

## Import Form Component (`components/import-form.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { importPlugin } from '@/lib/api';

export function ImportForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!url.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    if (!url.includes('github.com')) {
      setError('URL must be a GitHub repository');
      return;
    }

    setLoading(true);

    try {
      const result = await importPlugin(url);
      setSuccess(`Successfully imported ${result.pluginId}!`);

      // Redirect to plugin page after 2 seconds
      setTimeout(() => {
        router.push(`/plugins/${result.pluginId}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import plugin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            GitHub Repository URL
          </label>
          <Input
            id="url"
            type="url"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Your repository must contain <code className="bg-muted px-1 py-0.5 rounded">.claude-plugin/marketplace.json</code>
          </p>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            'Import Plugin'
          )}
        </Button>
      </form>

      {/* Success Message */}
      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {error.includes('marketplace.json') && (
              <div className="mt-2">
                <a
                  href="/docs/publishing"
                  className="text-sm underline flex items-center gap-1"
                >
                  Learn how to create marketplace.json
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Help Section */}
      <div className="bg-muted/50 rounded-lg p-6 space-y-3">
        <h3 className="font-semibold">Requirements</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>✓ Repository must be public</li>
          <li>✓ Must contain <code className="bg-muted px-1 py-0.5 rounded">.claude-plugin/marketplace.json</code></li>
          <li>✓ Valid marketplace.json schema (name, version, description, etc.)</li>
        </ul>
        <Button variant="outline" size="sm" asChild>
          <a href="/docs/publishing" target="_blank">
            View Documentation
            <ExternalLink className="ml-2 h-3 w-3" />
          </a>
        </Button>
      </div>

      {/* Example */}
      <div className="bg-muted/50 rounded-lg p-6 space-y-3">
        <h3 className="font-semibold">Example URLs</h3>
        <ul className="text-sm text-muted-foreground space-y-1 font-mono">
          <li>https://github.com/anthropics/claude-code-git</li>
          <li>https://github.com/username/my-plugin</li>
        </ul>
      </div>
    </div>
  );
}
```

## Import Page (`app/import/page.tsx`)

```typescript
import { ImportForm } from '@/components/import-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Import Plugin - SkillStash',
  description: 'Add your Claude Code plugin to SkillStash',
};

export default function ImportPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Add Your Plugin to SkillStash
          </h1>
          <p className="text-xl text-muted-foreground">
            Share your Claude Code plugin with the community
          </p>
        </div>

        {/* Import Form */}
        <ImportForm />

        {/* Additional Info */}
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>
            Your plugin will be reviewed and appear in the registry within minutes.
          </p>
          <p className="mt-2">
            Need help? Check our{' '}
            <Link href="/docs" className="underline">
              documentation
            </Link>{' '}
            or{' '}
            <Link href="/support" className="underline">
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
```

## Environment Variables

Add to `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://api.skillstash.com
NEXT_PUBLIC_ingester_URL=https://ingester.skillstash.com
```

## Testing Checklist

- [ ] Valid GitHub URL imports successfully
- [ ] Invalid URL shows error
- [ ] Missing marketplace.json shows helpful error
- [ ] Invalid marketplace.json shows validation errors
- [ ] Success message redirects to plugin page
- [ ] Loading state shows spinner
- [ ] Documentation links work
- [ ] Mobile responsive
- [ ] Dark mode compatible
