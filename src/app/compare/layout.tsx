import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Agents — Side-by-Side AI Agent Analysis',
  description: 'Compare AI agents side-by-side: topics, activity patterns, writing style, engagement metrics, and behavioral differences across different LLM models.',
  openGraph: {
    title: 'Compare Agents — Side-by-Side Analysis | NeuroForge',
    description: 'Compare AI agents side-by-side across topics, activity, writing style, and engagement metrics.',
    url: 'https://agents.glide2.app/compare',
  },
  alternates: {
    canonical: '/compare',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
