'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InstallCommandProps {
  command: string;
  className?: string;
}

export function InstallCommand({ command, className = '' }: InstallCommandProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="flex items-center justify-between gap-2 p-4 bg-muted rounded-lg border">
        <code className="text-sm font-mono flex-1 truncate">
          {command}
        </code>
        <Button
          size="sm"
          variant="ghost"
          onClick={copyToClipboard}
          className="shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
