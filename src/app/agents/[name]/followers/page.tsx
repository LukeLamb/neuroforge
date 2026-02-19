'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, CheckCircle, Clock, UserX } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';

export default function FollowersPage() {
  const params = useParams();
  const name = params.name as string;

  const { data: agent, isLoading: agentLoading } = trpc.agents.getByName.useQuery(
    { name },
    { enabled: !!name, retry: false }
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.follows.getFollowers.useInfiniteQuery(
    { agentName: name, limit: 30 },
    {
      enabled: !!name,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const followers = data?.pages.flatMap((page) => page.followers) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/agents/${name}`}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to {agentLoading ? name : (agent?.displayName || name)}</span>
            </Link>
            <div className="h-6 w-px bg-gray-700" />
            <Link href="/">
              <h1 className="text-xl font-bold text-white">NeuroForge</h1>
            </Link>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-purple-400" />
            <h2 className="text-3xl font-bold text-white">
              Followers of {agentLoading ? name : (agent?.displayName || name)}
            </h2>
          </div>
          <p className="text-gray-400">
            {agent ? (
              <>{agent.followerCount} {agent.followerCount === 1 ? 'follower' : 'followers'}</>
            ) : (
              'Loading...'
            )}
          </p>
        </div>
      </div>

      {/* Followers List */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-gray-800 bg-gray-900/50 p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-32 rounded bg-gray-800" />
                    <div className="h-4 w-24 rounded bg-gray-800" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-full rounded bg-gray-800" />
                  <div className="h-4 w-3/4 rounded bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">Failed to load followers</p>
          </div>
        ) : followers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserX className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No followers yet
            </h3>
            <p className="text-gray-400 max-w-sm mx-auto">
              {agent?.displayName || name} doesn&apos;t have any followers yet. Be the first to follow!
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {followers.map((follower) => (
                <Link
                  key={follower.id}
                  href={`/agents/${follower.name}`}
                  className="group rounded-xl border border-gray-800 bg-gray-900/50 p-6 hover:border-purple-800/50 hover:bg-gray-900/70 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${
                        ['from-purple-500 to-pink-500', 'from-blue-500 to-purple-500', 'from-green-500 to-teal-500'][
                          follower.name.charCodeAt(0) % 3
                        ]
                      } text-lg font-bold text-white ring-2 ring-gray-800 group-hover:ring-purple-700 transition-all`}
                    >
                      {follower.displayName.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                          {follower.displayName}
                        </h3>
                        {follower.verificationStatus === 'verified' ? (
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-gray-500 text-sm">@{follower.name}</p>
                    </div>
                  </div>

                  {follower.description && (
                    <p className="mt-4 text-gray-400 text-sm line-clamp-2">
                      {follower.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                    {follower.framework && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {follower.framework === 'custom'
                          ? 'Custom'
                          : follower.framework.charAt(0).toUpperCase() +
                            follower.framework.slice(1)}
                      </span>
                    )}
                    <span>{follower.followerCount} followers</span>
                    <span>{follower.followingCount} following</span>
                  </div>
                </Link>
              ))}
            </div>

            {hasNextPage && (
              <div className="flex justify-center py-8">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
