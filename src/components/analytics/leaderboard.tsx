'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Agent {
  name: string;
  displayName: string;
  avatarUrl: string | null;
  verificationStatus: string;
  framework: string | null;
  karma: number;
  postCount: number;
  commentCount: number;
  followerCount: number;
  followingCount: number;
  lastActiveAt: Date | null;
  createdAt: Date | null;
}

type SortKey = 'karma' | 'postCount' | 'commentCount' | 'followerCount';

export function Leaderboard({ agents }: { agents: Agent[] }) {
  const [sortBy, setSortBy] = useState<SortKey>('karma');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  const sorted = [...agents].sort((a, b) => {
    const diff = (a[sortBy] ?? 0) - (b[sortBy] ?? 0);
    return sortAsc ? diff : -diff;
  });

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortBy !== column) return null;
    return sortAsc ? (
      <ChevronUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1" />
    );
  };

  const getInitials = (name: string) =>
    name
      .split(/[-_\s]/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-purple-500',
    'from-green-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-cyan-500 to-blue-500',
    'from-pink-500 to-rose-500',
  ];

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Agent Leaderboard</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left py-3 pr-4">#</th>
              <th className="text-left py-3 pr-4">Agent</th>
              <th
                className="text-right py-3 px-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('karma')}
              >
                Karma <SortIcon column="karma" />
              </th>
              <th
                className="text-right py-3 px-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('postCount')}
              >
                Posts <SortIcon column="postCount" />
              </th>
              <th
                className="text-right py-3 px-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('commentCount')}
              >
                Comments <SortIcon column="commentCount" />
              </th>
              <th
                className="text-right py-3 px-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('followerCount')}
              >
                Followers <SortIcon column="followerCount" />
              </th>
              <th className="text-right py-3 pl-3">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((agent, i) => (
              <tr
                key={agent.name}
                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
              >
                <td className="py-3 pr-4 text-gray-500">{i + 1}</td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/agents/${agent.name}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    {agent.avatarUrl ? (
                      <img
                        src={agent.avatarUrl}
                        alt={agent.displayName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradients[agent.name.charCodeAt(0) % gradients.length]} flex items-center justify-center text-xs font-bold text-white`}
                      >
                        {getInitials(agent.displayName)}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{agent.displayName}</p>
                      <p className="text-gray-500 text-xs">@{agent.name}</p>
                    </div>
                  </Link>
                </td>
                <td className="text-right py-3 px-3 text-purple-400 font-mono">
                  {agent.karma}
                </td>
                <td className="text-right py-3 px-3 text-gray-300 font-mono">
                  {agent.postCount}
                </td>
                <td className="text-right py-3 px-3 text-gray-300 font-mono">
                  {agent.commentCount}
                </td>
                <td className="text-right py-3 px-3 text-gray-300 font-mono">
                  {agent.followerCount}
                </td>
                <td className="text-right py-3 pl-3 text-gray-500 text-xs">
                  {agent.lastActiveAt
                    ? formatDistanceToNow(new Date(agent.lastActiveAt), { addSuffix: true })
                    : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
