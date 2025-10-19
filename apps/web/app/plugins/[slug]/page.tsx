import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Star, Download, ExternalLink, Github } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InstallCommand } from '@/components/install-command';
import { getPlugin } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const plugin = await getPlugin(params.slug);

  if (!plugin) {
    return {
      title: 'Plugin Not Found - SkillStash',
    };
  }

  return {
    title: `${plugin.name} - SkillStash`,
    description: plugin.description,
    openGraph: {
      title: plugin.name,
      description: plugin.description,
      type: 'website',
    },
  };
}

export default async function PluginDetailPage({ params }: PageProps) {
  const plugin = await getPlugin(params.slug);

  if (!plugin) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold mb-2">{plugin.name}</h1>
            <p className="text-lg text-muted-foreground">{plugin.description}</p>
          </div>
          {plugin.repository_url && (
            <Button variant="outline" asChild>
              <a
                href={plugin.repository_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          )}
        </div>

        {/* Author and stats */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>by</span>
            {plugin.author_url ? (
              <a
                href={plugin.author_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-foreground transition-colors"
              >
                {plugin.author}
              </a>
            ) : (
              <span className="font-medium">{plugin.author}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{plugin.stars.toLocaleString()} stars</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>{plugin.downloads.toLocaleString()} downloads</span>
          </div>
          {plugin.version && (
            <div>
              <span>v{plugin.version}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {plugin.category && (
            <Badge variant="default">{plugin.category}</Badge>
          )}
          {plugin.tags?.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Install Command */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Installation</h2>
        <InstallCommand command={`npx @skillstash/cli add ${plugin.slug}`} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="readme" className="mb-12">
        <TabsList>
          <TabsTrigger value="readme">README</TabsTrigger>
          {plugin.skills?.length > 0 && (
            <TabsTrigger value="skills">
              Skills ({plugin.skills.length})
            </TabsTrigger>
          )}
          {plugin.agents?.length > 0 && (
            <TabsTrigger value="agents">
              Agents ({plugin.agents.length})
            </TabsTrigger>
          )}
          {plugin.commands?.length > 0 && (
            <TabsTrigger value="commands">
              Commands ({plugin.commands.length})
            </TabsTrigger>
          )}
          {plugin.mcp_servers?.length > 0 && (
            <TabsTrigger value="mcp">
              MCP Servers ({plugin.mcp_servers.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="readme" className="mt-6">
          {plugin.readme ? (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {plugin.readme}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground">No README available</p>
          )}
        </TabsContent>

        {plugin.skills?.length > 0 && (
          <TabsContent value="skills" className="mt-6">
            <div className="space-y-4">
              {plugin.skills.map((skill, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{skill.name || 'Unnamed Skill'}</h3>
                  {skill.description && (
                    <p className="text-sm text-muted-foreground">{skill.description}</p>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {plugin.agents?.length > 0 && (
          <TabsContent value="agents" className="mt-6">
            <div className="space-y-4">
              {plugin.agents.map((agent, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{agent.name || 'Unnamed Agent'}</h3>
                  {agent.description && (
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {plugin.commands?.length > 0 && (
          <TabsContent value="commands" className="mt-6">
            <div className="space-y-4">
              {plugin.commands.map((command, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{command.name || 'Unnamed Command'}</h3>
                  {command.description && (
                    <p className="text-sm text-muted-foreground">{command.description}</p>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {plugin.mcp_servers?.length > 0 && (
          <TabsContent value="mcp" className="mt-6">
            <div className="space-y-4">
              {plugin.mcp_servers.map((server, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{server.name || 'Unnamed MCP Server'}</h3>
                  {server.description && (
                    <p className="text-sm text-muted-foreground">{server.description}</p>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
