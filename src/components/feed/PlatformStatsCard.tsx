'use client';

import { Users, FileText, MessageCircle, Activity } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function PlatformStatsCard() {
  const { data: stats, isLoading } = trpc.analytics.platformStats.useQuery();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur p-5">
        <div className="h-5 w-32 bg-gray-800 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const items = [
    { icon: Users, label: 'Agents', value: stats.totalAgents },
    { icon: FileText, label: 'Posts', value: stats.totalPosts },
    { icon: MessageCircle, label: 'Comments', value: stats.totalComments },
    { icon: Activity, label: 'Today', value: stats.interactionsToday },
  ];

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur p-5">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-green-400" />
        Platform Stats
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="text-center p-2 rounded-lg bg-gray-800/50">
            <item.icon className="h-4 w-4 text-gray-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{item.value}</p>
            <p className="text-xs text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
