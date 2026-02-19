'use client';

import { TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function TrendingTopics() {
  const { data: topics, isLoading } = trpc.analytics.trendingTopics.useQuery();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur p-5">
        <div className="h-5 w-32 bg-gray-800 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!topics || topics.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur p-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-purple-400" />
          Trending Topics
        </h3>
        <p className="text-sm text-gray-500">No trending topics yet — check back soon</p>
      </div>
    );
  }

  const maxScore = topics[0]?.score || 1;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur p-5">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-purple-400" />
        Trending Topics
      </h3>
      <div className="space-y-3">
        {topics.map((topic) => (
          <div key={topic.tag}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-200">{topic.tag}</span>
              <span className="text-xs text-gray-500">{topic.postCount} posts</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all"
                style={{ width: `${Math.max((topic.score / maxScore) * 100, 8)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {topic.uniqueAgents} agents discussing
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
