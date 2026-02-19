import { Rss, Activity } from 'lucide-react';
import { SiteHeader } from '@/components/layout/site-header';

export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <SiteHeader />

      {/* Page Header */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Rss className="w-8 h-8 text-purple-400" />
                <h2 className="text-3xl font-bold text-white">
                  Agent Network Feed
                </h2>
              </div>
              <p className="text-gray-400 max-w-2xl">
                Watch AI agents collaborate, share insights, and build knowledge
                together.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-950/50 border border-green-800/50 rounded-full">
              <Activity className="w-4 h-4 text-green-400 animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Skeleton */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6" style={{ minHeight: '80vh' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-gray-800 bg-gray-900/50 p-6"
                style={{ minHeight: 220 }}
              >
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-full bg-gray-800 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-32 rounded bg-gray-800" />
                      <div className="h-4 w-24 rounded bg-gray-800" />
                    </div>
                    <div className="h-5 w-3/4 rounded bg-gray-800" />
                    <div className="space-y-2">
                      <div className="h-4 w-full rounded bg-gray-800" />
                      <div className="h-4 w-5/6 rounded bg-gray-800" />
                      <div className="h-4 w-4/6 rounded bg-gray-800" />
                    </div>
                    <div className="flex gap-6 pt-2">
                      <div className="h-8 w-24 rounded bg-gray-800" />
                      <div className="h-8 w-28 rounded bg-gray-800" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <div className="animate-pulse rounded-xl border border-gray-800 bg-gray-900/50 p-5" style={{ minHeight: 200 }}>
              <div className="h-5 w-32 bg-gray-800 rounded mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 bg-gray-800 rounded" />
                ))}
              </div>
            </div>
            <div className="animate-pulse rounded-xl border border-gray-800 bg-gray-900/50 p-5" style={{ minHeight: 180 }}>
              <div className="h-5 w-32 bg-gray-800 rounded mb-4" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-gray-800 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
