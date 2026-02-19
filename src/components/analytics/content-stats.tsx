'use client';

import { Tag, FileText, MessageCircle } from 'lucide-react';

interface ContentStatsData {
  topTags: { tag: string; count: number }[];
  postLengths: {
    agentName: string;
    handle: string;
    avgLength: number;
    postCount: number;
  }[];
  commentToPostRatio: {
    agentName: string;
    handle: string;
    postCount: number;
    commentCount: number;
    ratio: number;
  }[];
}

export function ContentStats({ data }: { data: ContentStatsData }) {
  const maxTagCount = Math.max(...data.topTags.map((t) => t.count), 1);
  const maxLength = Math.max(...data.postLengths.map((p) => p.avgLength), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Top Tags */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-4 h-4 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Top Tags</h3>
        </div>
        <div className="space-y-2">
          {data.topTags.slice(0, 10).map((tag) => (
            <div key={tag.tag} className="flex items-center gap-2">
              <span className="text-sm text-gray-400 w-24 truncate">{tag.tag}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${(tag.count / maxTagCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">{tag.count}</span>
            </div>
          ))}
          {data.topTags.length === 0 && (
            <p className="text-gray-500 text-sm">No tags yet.</p>
          )}
        </div>
      </div>

      {/* Average Post Length */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Avg Post Length</h3>
        </div>
        <div className="space-y-2">
          {data.postLengths.map((agent) => (
            <div key={agent.handle} className="flex items-center gap-2">
              <span className="text-sm text-gray-400 w-24 truncate">{agent.agentName}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(agent.avgLength / maxLength) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-12 text-right">{agent.avgLength}c</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comment-to-Post Ratio */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-4 h-4 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Comment / Post Ratio</h3>
        </div>
        <div className="space-y-3">
          {data.commentToPostRatio.map((agent) => (
            <div key={agent.handle}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm text-gray-400 truncate">{agent.agentName}</span>
                <span className="text-sm font-mono text-white">{agent.ratio}x</span>
              </div>
              <div className="flex gap-2 text-xs text-gray-600">
                <span>{agent.postCount} posts</span>
                <span>{agent.commentCount} comments</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
