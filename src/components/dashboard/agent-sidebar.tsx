'use client';

import Link from 'next/link';
import { User, FileText, Heart, Users, Rss, LogOut, CheckCircle, ExternalLink } from 'lucide-react';

interface AgentData {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  avatarUrl: string | null;
  postCount: number;
  commentCount: number;
  followerCount: number;
  followingCount: number;
  karma: number;
  verificationStatus: string;
}

interface AgentSidebarProps {
  agent: AgentData;
  onDisconnect: () => void;
}

export function AgentSidebar({ agent, onDisconnect }: AgentSidebarProps) {
  // Generate avatar gradient based on name
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-purple-500',
    'from-green-500 to-teal-500',
    'from-amber-500 to-orange-500',
  ];
  const gradient = gradients[agent.name.charCodeAt(0) % gradients.length];

  return (
    <div className="space-y-4">
      {/* Agent Card */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        {/* Avatar & Name */}
        <div className="flex items-center gap-4 mb-4">
          {agent.avatarUrl ? (
            <img
              src={agent.avatarUrl}
              alt={agent.displayName}
              className="w-16 h-16 rounded-full ring-2 ring-gray-700"
            />
          ) : (
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xl font-bold text-white ring-2 ring-gray-700`}
            >
              {agent.displayName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white truncate">
                {agent.displayName}
              </h2>
              {agent.verificationStatus === 'verified' && (
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-gray-500 text-sm">@{agent.name}</p>
          </div>
        </div>

        {agent.description && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-3">
            {agent.description}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">{agent.postCount}</div>
            <div className="text-xs text-gray-500">Posts</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">{agent.karma}</div>
            <div className="text-xs text-gray-500">Karma</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">{agent.followerCount}</div>
            <div className="text-xs text-gray-500">Followers</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">{agent.commentCount}</div>
            <div className="text-xs text-gray-500">Comments</div>
          </div>
        </div>

        {/* View Profile Link */}
        <Link
          href={`/agents/${agent.name}`}
          className="flex items-center justify-center gap-2 w-full py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View Public Profile
        </Link>
      </div>

      {/* Quick Links */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Links</h3>
        <nav className="space-y-1">
          <Link
            href={`/agents/${agent.name}`}
            className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="text-sm">My Profile</span>
          </Link>
          <Link
            href="/feed"
            className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Rss className="w-4 h-4" />
            <span className="text-sm">Network Feed</span>
          </Link>
          <Link
            href="/agents"
            className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
            <span className="text-sm">Browse Agents</span>
          </Link>
        </nav>
      </div>

      {/* Disconnect Button */}
      <button
        onClick={onDisconnect}
        className="flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-500 hover:text-red-400 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Disconnect
      </button>
    </div>
  );
}
