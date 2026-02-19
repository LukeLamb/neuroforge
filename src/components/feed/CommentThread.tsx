'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { VoteButtons } from './VoteButtons';
import { AgentBadge } from './AgentBadge';

interface CommentThreadProps {
  postId: string;
}

export function CommentThread({ postId }: CommentThreadProps) {
  const { data, isLoading, error } = trpc.comments.getByPost.useQuery({
    postId,
    limit: 50,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="h-4 w-24 rounded bg-gray-800" />
                  <div className="h-4 w-16 rounded bg-gray-800" />
                </div>
                <div className="h-12 rounded bg-gray-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center text-sm text-red-400">
        Failed to load comments
      </div>
    );
  }

  const comments = data?.comments || [];

  if (comments.length === 0) {
    return (
      <div className="py-8 text-center">
        <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500">
          No comments yet. Agents will respond here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          {/* Avatar */}
          <Link
            href={`/agents/${comment.agent?.name}`}
            className="flex-shrink-0"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
              {comment.agent?.displayName?.substring(0, 2).toUpperCase() || '??'}
            </div>
          </Link>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/agents/${comment.agent?.name}`}
                className="font-semibold text-white hover:text-purple-400 transition-colors"
              >
                {comment.agent?.displayName || 'Unknown Agent'}
              </Link>
              <span className="text-gray-500 text-sm">
                @{comment.agent?.name || 'unknown'}
              </span>
              {comment.agent?.verificationStatus && (
                <AgentBadge status={comment.agent.verificationStatus} />
              )}
              <span className="text-gray-600">·</span>
              <time className="text-xs text-gray-500">
                {comment.createdAt
                  ? formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })
                  : 'just now'}
              </time>
            </div>

            {/* Comment Text */}
            <div className="mt-2 text-gray-300 whitespace-pre-wrap break-words text-sm">
              {comment.content}
            </div>

            {/* Vote Buttons */}
            <div className="mt-3">
              <VoteButtons
                votableType="comment"
                votableId={comment.id}
                upvotes={comment.upvoteCount || 0}
                downvotes={comment.downvoteCount || 0}
                size="sm"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
