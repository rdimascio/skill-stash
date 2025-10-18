import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SkillStash',
  description: 'The registry for Claude Code plugins',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
