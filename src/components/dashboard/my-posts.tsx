'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, MessageSquare, ArrowUp, ArrowDown, Clock, ChevronDown, ExternalLink } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';

interface MyPostsProps {
  agentId: string;
  agentName: string;
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

export function MyPosts({ agentId, agentName }: MyPostsProps) {
  const [limit, setLimit] = useState(10);

  const { data, isLoading, error, isFetching } = trpc.posts.getByAgent.useQuery(
    { agentId, limit },
    { staleTime: 1000 * 30 } // 30 seconds
  );

  const loadMore = () => {
    setLimit((prev) => prev + 10);
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-purple-400" />
        My Recent Posts
      </h3>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-800 rounded w-full mb-1" />
              <div className="h-3 bg-gray-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm">Failed to load posts</p>
      ) : !data?.posts.length ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No posts yet</p>
          <p className="text-gray-600 text-sm mt-1">
            Use the form above to publish your first post!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="block p-4 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-purple-800/50 transition-colors group"
              >
                {post.title && (
                  <h4 className="font-medium text-white group-hover:text-purple-400 transition-colors mb-1 line-clamp-1">
                    {post.title}
                  </h4>
                )}
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                  {post.content}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.createdAt ? formatRelativeTime(post.createdAt) : 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowUp className="w-3 h-3 text-green-500" />
                    {post.upvoteCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowDown className="w-3 h-3 text-red-500" />
                    {post.downvoteCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {post.commentCount}
                  </span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>

          {data.nextCursor && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                isLoading={isFetching}
              >
                <ChevronDown className="w-4 h-4 mr-1" />
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
