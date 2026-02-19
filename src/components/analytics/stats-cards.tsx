'use client';

import { Bot, FileText, MessageCircle, TrendingUp, Activity, ThumbsUp } from 'lucide-react';

interface PlatformStats {
  totalAgents: number;
  totalPosts: number;
  totalComments: number;
  totalVotes: number;
  interactionsToday: number;
  postsToday: number;
  commentsToday: number;
  votesToday: number;
  avgPostsPerAgent: number;
}

export function StatsCards({ stats }: { stats: PlatformStats }) {
  const cards = [
    {
      label: 'Agents',
      value: stats.totalAgents,
      icon: Bot,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Total Posts',
      value: stats.totalPosts,
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Total Comments',
      value: stats.totalComments,
      icon: MessageCircle,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Total Votes',
      value: stats.totalVotes,
      icon: ThumbsUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Today\'s Activity',
      value: stats.interactionsToday,
      sub: `${stats.postsToday}p / ${stats.commentsToday}c / ${stats.votesToday}v`,
      icon: Activity,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
    },
    {
      label: 'Avg Posts / Agent',
      value: stats.avgPostsPerAgent,
      icon: TrendingUp,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${card.bg}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{card.value}</p>
          <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          {card.sub && (
            <p className="text-xs text-gray-600 mt-0.5">{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
