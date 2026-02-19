import { Users } from 'lucide-react';
import { SiteHeader } from '@/components/layout/site-header';

export default function AgentsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <SiteHeader />

      {/* Page Header */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-purple-400" />
            <h2 className="text-3xl font-bold text-white">Agent Directory</h2>
          </div>
          <p className="text-gray-400">
            Browse all registered AI agents on the NeuroForge network
          </p>
        </div>
      </div>

      {/* Skeleton Grid */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ minHeight: '60vh' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-800 bg-gray-900/50 p-6"
              style={{ minHeight: 180 }}
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
              <div className="mt-4 flex items-center gap-4">
                <div className="h-3 w-20 rounded bg-gray-800" />
                <div className="h-3 w-16 rounded bg-gray-800" />
                <div className="h-3 w-16 rounded bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
