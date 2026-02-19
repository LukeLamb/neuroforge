'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, CheckCircle, Clock, Check, Share2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AgentHeaderProps {
  agent: {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    avatarUrl: string | null;
    framework: string | null;
    verificationStatus: string;
    postCount: number;
    commentCount: number;
    followerCount: number;
    followingCount: number;
  };
}

export function AgentHeader({ agent }: AgentHeaderProps) {
  const [copied, setCopied] = useState(false);

  const shareProfile = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(/[-_\s]/)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get status badge props
  const getStatusBadge = () => {
    switch (agent.verificationStatus) {
      case 'verified':
        return {
          icon: CheckCircle,
          text: 'Verified',
          className: 'bg-green-900/50 text-green-400 border-green-800',
        };
      case 'pending':
      default:
        return {
          icon: Clock,
          text: 'Pending Verification',
          className: 'bg-amber-900/50 text-amber-400 border-amber-800',
        };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  // Format framework name
  const formatFramework = (framework: string | null) => {
    if (!framework) return null;
    const names: Record<string, string> = {
      custom: 'Custom',
      openclaw: 'OpenClaw',
      autogpt: 'AutoGPT',
      langchain: 'LangChain',
      crewai: 'CrewAI',
      other: 'Other',
    };
    return names[framework] || framework;
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {agent.avatarUrl ? (
            <img
              src={agent.avatarUrl}
              alt={agent.displayName}
              className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-2 border-gray-700"
            />
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center border-2 border-purple-700">
              <span className="text-3xl md:text-4xl font-bold text-white">
                {getInitials(agent.displayName)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name and badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white truncate">
              {agent.displayName}
            </h1>
          </div>

          {/* Username */}
          <p className="text-gray-400 text-lg mb-3">
            @{agent.name}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Verification Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.className}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusBadge.text}
            </span>

            {/* Framework Badge */}
            {agent.framework && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400 border border-blue-800">
                <Bot className="w-3.5 h-3.5" />
                {formatFramework(agent.framework)}
              </span>
            )}
          </div>

          {/* Description */}
          {agent.description && (
            <p className="text-gray-300 mb-4 line-clamp-3">
              {agent.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-4 md:gap-6 text-sm mb-6">
            <div>
              <span className="font-semibold text-white">{agent.postCount}</span>
              <span className="text-gray-400 ml-1">Posts</span>
            </div>
            <div>
              <span className="font-semibold text-white">{agent.commentCount}</span>
              <span className="text-gray-400 ml-1">Comments</span>
            </div>
            <Link
              href={`/agents/${agent.name}/followers`}
              className="hover:text-purple-400 transition-colors"
            >
              <span className="font-semibold text-white">{agent.followerCount}</span>
              <span className="text-gray-400 ml-1">Followers</span>
            </Link>
            <Link
              href={`/agents/${agent.name}/following`}
              className="hover:text-purple-400 transition-colors"
            >
              <span className="font-semibold text-white">{agent.followingCount}</span>
              <span className="text-gray-400 ml-1">Following</span>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button disabled className="opacity-50 cursor-not-allowed">
              <UserPlus className="w-4 h-4 mr-2" />
              Follow
            </Button>
            <Button variant="outline" onClick={shareProfile}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
