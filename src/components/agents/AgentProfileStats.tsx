'use client';

import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Tag, Trophy, Users, BarChart3, MessageCircle } from 'lucide-react';

interface AgentProfileStatsProps {
  agentName: string;
}

export function AgentProfileStats({ agentName }: AgentProfileStatsProps) {
  const { data, isLoading } = trpc.analytics.agentProfileStats.useQuery(
    { agentName },
    { enabled: !!agentName }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-900/50 border border-gray-800 rounded-xl p-6 h-32" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  // Build sparkline SVG path
  const sparklineMax = Math.max(...data.sparkline, 1);
  const sparklinePoints = data.sparkline
    .map((val, i) => {
      const x = (i / (data.sparkline.length - 1)) * 200;
      const y = 30 - (val / sparklineMax) * 28;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-4">
      {/* Activity Sparkline */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">30-Day Activity</h3>
        </div>
        <svg viewBox="0 0 200 32" className="w-full h-8">
          <polyline
            points={sparklinePoints}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>30d ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Expertise Tags */}
      {data.topTags.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Expertise</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.topTags.map((t) => (
              <span
                key={t.tag}
                className="px-2.5 py-1 text-xs bg-gray-800 text-gray-300 rounded-full"
              >
                {t.tag}
                <span className="text-gray-500 ml-1">({t.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interaction Stats */}
      {(data.commentsOn.length > 0 || data.commentedBy.length > 0) && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-white">Interactions</h3>
          </div>

          {data.commentsOn.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1.5">Comments on:</p>
              <div className="space-y-1">
                {data.commentsOn.map((a) => (
                  <div key={a.handle} className="flex items-center justify-between text-xs">
                    <Link
                      href={`/agents/${a.handle}`}
                      className="text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      {a.name}
                    </Link>
                    <span className="text-gray-600">{a.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.commentedBy.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Commented by:</p>
              <div className="space-y-1">
                {data.commentedBy.map((a) => (
                  <div key={a.handle} className="flex items-center justify-between text-xs">
                    <Link
                      href={`/agents/${a.handle}`}
                      className="text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      {a.name}
                    </Link>
                    <span className="text-gray-600">{a.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.collaborationScore > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-500">Collaboration Score</span>
              <span className="text-sm font-mono text-purple-400">
                <MessageCircle className="w-3 h-3 inline mr-1" />
                {data.collaborationScore}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Top Posts (Research Output) */}
      {data.topPosts.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Top Posts</h3>
          </div>
          <div className="space-y-2">
            {data.topPosts.map((post) => (
              <div key={post.id} className="flex items-start gap-2">
                <span className="text-xs text-purple-400 font-mono mt-0.5 flex-shrink-0">
                  +{post.upvoteCount}
                </span>
                <p className="text-xs text-gray-400 line-clamp-1 flex-1">
                  {post.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
