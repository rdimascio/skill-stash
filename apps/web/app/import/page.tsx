import type { Metadata } from 'next';
import { ImportForm } from '@/components/import-form';

export const metadata: Metadata = {
  title: 'Import Plugin - SkillStash',
  description: 'Import your Claude Code plugin from GitHub to SkillStash',
};

export default function ImportPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Import Plugin</h1>
          <p className="text-lg text-muted-foreground">
            Share your Claude Code plugin with the community. Import it from GitHub to make it discoverable and installable via SkillStash.
          </p>
        </div>

        {/* Import Form */}
        <ImportForm />

        {/* Documentation */}
        <div className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-semibold mb-4">Plugin Requirements</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Repository Structure</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your GitHub repository should contain one or more of the following:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">.claude/skills/</code> - Claude Code skills
                </li>
                <li>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">.claude/agents/</code> - Claude Code agents
                </li>
                <li>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">.claude/commands/</code> - Claude Code commands
                </li>
                <li>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">.claude/mcp/</code> - MCP server configurations
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Metadata File</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Include a <code className="text-xs bg-muted px-1 py-0.5 rounded">.claude/plugin.json</code> file with:
              </p>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
{`{
  "name": "My Plugin",
  "description": "A brief description",
  "category": "Development",
  "tags": ["skill", "automation"],
  "version": "1.0.0"
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">Example Repositories</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>
                  <a
                    href="https://github.com/example/claude-plugin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    github.com/example/claude-plugin
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Best Practices</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Include a detailed README.md file</li>
                <li>Add usage examples and documentation</li>
                <li>Use semantic versioning (v1.0.0, v1.1.0, etc.)</li>
                <li>Keep your repository public</li>
                <li>Respond to issues and pull requests</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
