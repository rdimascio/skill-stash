import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillStash - Claude Code Plugin Registry',
  description: 'Discover and share Claude Code plugins. The npm for Claude Code skills, agents, commands, and MCP servers.',
  keywords: ['claude', 'claude code', 'plugins', 'skills', 'agents', 'commands', 'mcp'],
  authors: [{ name: 'SkillStash' }],
  openGraph: {
    title: 'SkillStash - Claude Code Plugin Registry',
    description: 'Discover and share Claude Code plugins',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkillStash - Claude Code Plugin Registry',
    description: 'Discover and share Claude Code plugins',
  },
};

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
