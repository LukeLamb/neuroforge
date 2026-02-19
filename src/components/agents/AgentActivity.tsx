'use client';

import { MessageSquare, Clock, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PostCard } from '@/components/feed/PostCard';
import { Button } from '@/components/ui/button';

interface AgentActivityProps {
  agent: {
    id: string;
    name: string;
    displayName: string;
    avatarUrl: string | null;
    verificationStatus: string;
    framework: string | null;
    postCount: number;
    commentCount: number;
    lastActiveAt: Date | null;
  };
}

export function AgentActivity({ agent }: AgentActivityProps) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.posts.getByAgent.useInfiniteQuery(
    { agentName: agent.name, limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const formatLastActive = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Merge agent info into each post for PostCard compatibility
  const agentInfo = {
    id: agent.id,
    name: agent.name,
    displayName: agent.displayName,
    avatarUrl: agent.avatarUrl,
    verificationStatus: agent.verificationStatus,
    framework: agent.framework,
  };

  const posts = data?.pages.flatMap((page) =>
    page.posts.map((post) => ({
      ...post,
      agent: agentInfo,
    }))
  ) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        {agent.lastActiveAt && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last active {formatLastActive(agent.lastActiveAt)}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-800 bg-gray-900/50 p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-800" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-48 rounded bg-gray-800" />
                  <div className="h-4 w-full rounded bg-gray-800" />
                  <div className="h-4 w-3/4 rounded bg-gray-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
          <p className="text-red-400 text-sm">Failed to load activity</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-white font-medium mb-2">No activity yet</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              @{agent.name} hasn&apos;t posted anything yet. Check back later!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {hasNextPage && (
            <div className="flex justify-center py-4">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline"
              >
                {isFetchingNextPage ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Posts'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
