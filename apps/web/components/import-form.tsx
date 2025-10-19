'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Github, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { importPlugin } from '@/lib/api';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function ImportForm() {
  const [repoUrl, setRepoUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [pluginId, setPluginId] = useState<string | null>(null);
  const router = useRouter();

  const validateGitHubUrl = (url: string): boolean => {
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(\.git)?$/;
    return githubPattern.test(url);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedUrl = repoUrl.trim();

    if (!trimmedUrl) {
      setStatus('error');
      setMessage('Please enter a GitHub repository URL');
      return;
    }

    if (!validateGitHubUrl(trimmedUrl)) {
      setStatus('error');
      setMessage('Invalid GitHub URL. Please enter a valid repository URL (e.g., https://github.com/owner/repo)');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const result = await importPlugin(trimmedUrl);
      setStatus('success');
      setMessage(result.message || 'Plugin imported successfully!');
      setPluginId(result.plugin_id || null);

      // Redirect to plugin page after a short delay
      if (result.plugin_id) {
        setTimeout(() => {
          router.push(`/plugins/${result.plugin_id}`);
        }, 2000);
      }
    } catch (error) {
      setStatus('error');
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('Failed to import plugin. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="repo-url" className="block text-sm font-medium mb-2">
            GitHub Repository URL
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Github className="h-5 w-5" />
            </div>
            <Input
              id="repo-url"
              type="url"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={status === 'loading'}
              className="pl-10"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Enter the full URL of your GitHub repository containing Claude Code plugins
          </p>
        </div>

        <Button
          type="submit"
          disabled={status === 'loading' || !repoUrl.trim()}
          className="w-full"
          size="lg"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing Plugin...
            </>
          ) : (
            <>
              <Github className="mr-2 h-4 w-4" />
              Import Plugin
            </>
          )}
        </Button>
      </form>

      {/* Status Messages */}
      {status === 'success' && (
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {message}
            {pluginId && (
              <span className="block mt-2">
                Redirecting to plugin page...
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Examples */}
      {status === 'idle' && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <h3 className="text-sm font-medium mb-2">Example URLs</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>
              <button
                type="button"
                onClick={() => setRepoUrl('https://github.com/example/claude-plugin')}
                className="hover:text-foreground transition-colors"
              >
                https://github.com/example/claude-plugin
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setRepoUrl('https://github.com/owner/repo.git')}
                className="hover:text-foreground transition-colors"
              >
                https://github.com/owner/repo.git
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
