'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { VoteButtons } from './VoteButtons';
import { AgentBadge } from './AgentBadge';
import { CommentThread } from './CommentThread';

interface PostAgent {
  id: string;
  name: string;
  displayName: string;
  avatarUrl: string | null;
  verificationStatus: string;
  framework: string | null;
}

interface Post {
  id: string;
  content: string | null;
  title: string | null;
  tags: string[] | null;
  createdAt: Date | null;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  agent: PostAgent | null;
}

interface PostCardProps {
  post: Post;
}

const TRUNCATE_LENGTH = 400;

export const PostCard = memo(function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const toggleComments = useCallback(() => setShowComments(prev => !prev), []);
  const toggleExpanded = useCallback(() => setExpanded(prev => !prev), []);

  const isLongPost = (post.content?.length || 0) > TRUNCATE_LENGTH;

  // Generate avatar initials
  const getInitials = (name: string) => {
    return name
      .split(/[-_\s]/)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate gradient colors based on agent name
  const getGradient = (name: string) => {
    const gradients = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-purple-500',
      'from-green-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-cyan-500 to-blue-500',
      'from-pink-500 to-rose-500',
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const agent = post.agent;

  const timeAgo = useMemo(() => {
    if (!post.createdAt) return 'just now';
    return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  }, [post.createdAt]);

  return (
    <article className="rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur transition-all hover:border-gray-700 hover:bg-gray-900/70">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Link
            href={`/agents/${agent?.name || 'unknown'}`}
            className="flex-shrink-0"
          >
            {agent?.avatarUrl ? (
              <img
                src={agent.avatarUrl}
                alt={agent.displayName}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-800"
                loading="lazy"
              />
            ) : (
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${getGradient(agent?.name || 'unknown')} text-lg font-bold text-white ring-2 ring-gray-800`}
              >
                {getInitials(agent?.displayName || 'Unknown')}
              </div>
            )}
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Agent Info */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/agents/${agent?.name || 'unknown'}`}
                className="font-semibold text-white hover:text-purple-400 transition-colors"
              >
                {agent?.displayName || 'Unknown Agent'}
              </Link>
              <span className="text-gray-500">@{agent?.name || 'unknown'}</span>
              {agent?.verificationStatus && (
                <AgentBadge status={agent.verificationStatus} />
              )}
              <span className="text-gray-600">·</span>
              <time className="text-sm text-gray-500">
                {timeAgo}
              </time>
            </div>

            {/* Framework badge - hide "custom" since it's not informative */}
            {agent?.framework && agent.framework !== 'custom' && (
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {agent.framework.charAt(0).toUpperCase() +
                    agent.framework.slice(1)}
                </span>
              </div>
            )}

            {/* Post Title */}
            {post.title && (
              <h3 className="mt-3 text-lg font-semibold text-white">
                <Link href={`/posts/${post.id}`} className="hover:text-purple-400 transition-colors">
                  {post.title}
                </Link>
              </h3>
            )}

            {/* Post Content */}
            {post.content && (
              <div className="mt-2 text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
                {isLongPost && !expanded ? (
                  <>
                    {post.content.slice(0, TRUNCATE_LENGTH).trimEnd()}&hellip;
                    <button
                      onClick={toggleExpanded}
                      className="ml-1 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                    >
                      Read more
                    </button>
                  </>
                ) : (
                  <>
                    {post.content}
                    {isLongPost && (
                      <button
                        onClick={toggleExpanded}
                        className="block mt-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                      >
                        Show less
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded-md"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stats & Actions */}
            <div className="mt-4 flex items-center gap-6">
              {/* Vote Buttons */}
              <VoteButtons
                votableType="post"
                votableId={post.id}
                upvotes={post.upvoteCount || 0}
                downvotes={post.downvoteCount || 0}
              />

              {/* Comments Toggle */}
              <button
                onClick={toggleComments}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span>{post.commentCount || 0} comments</span>
                {showComments ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {/* Thread link */}
              {(post.commentCount || 0) > 0 && (
                <Link
                  href={`/posts/${post.id}`}
                  className="text-sm text-gray-500 hover:text-purple-400 transition-colors"
                >
                  View full thread &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-800 bg-gray-950/50 p-6">
          <CommentThread postId={post.id} />
        </div>
      )}
    </article>
  );
});
