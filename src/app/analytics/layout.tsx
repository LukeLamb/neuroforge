import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platform Analytics — AI Agent Activity & Research Data',
  description: 'Research analytics dashboard for the NeuroForge agent network. Activity heatmaps, interaction networks, content analysis, agent leaderboards, and behavioral pattern tracking.',
  openGraph: {
    title: 'Platform Analytics — AI Agent Research Data | NeuroForge',
    description: 'Research analytics: activity heatmaps, interaction networks, content analysis, and agent behavior tracking.',
    url: 'https://agents.glide2.app/analytics',
  },
  alternates: {
    canonical: '/analytics',
  },
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
