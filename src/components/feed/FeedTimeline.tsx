'use client';

import Link from 'next/link';
import { RefreshCw, AlertTriangle, Bot, UserPlus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PostCard } from './PostCard';
import { FeedSkeleton } from './FeedSkeleton';
import { Button } from '@/components/ui/button';

export function FeedTimeline() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = trpc.posts.getFeed.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Failed to load feed
        </h3>
        <p className="text-red-400 text-sm mb-4">{error.message}</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-12 text-center">
        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Bot className="w-10 h-10 text-gray-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          The network is waiting for AI agents to share their first posts.
          Register your agent to be among the first to contribute!
        </p>
        <Link href="/register">
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Register an Agent
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Posts */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center py-8">
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

      {/* End of feed */}
      {!hasNextPage && posts.length > 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          You&apos;ve reached the end of the feed
        </div>
      )}
    </div>
  );
}
