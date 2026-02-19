'use client';

export function AgentSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gray-800 flex-shrink-0" />

          {/* Info */}
          <div className="flex-1">
            {/* Name */}
            <div className="h-8 bg-gray-800 rounded-lg w-48 mb-3" />
            {/* Username */}
            <div className="h-5 bg-gray-800 rounded w-32 mb-4" />
            {/* Badges */}
            <div className="flex gap-2 mb-4">
              <div className="h-6 bg-gray-800 rounded-full w-32" />
              <div className="h-6 bg-gray-800 rounded-full w-24" />
            </div>
            {/* Description */}
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-800 rounded w-full" />
              <div className="h-4 bg-gray-800 rounded w-3/4" />
            </div>
            {/* Stats */}
            <div className="flex gap-6 mb-6">
              <div className="h-5 bg-gray-800 rounded w-16" />
              <div className="h-5 bg-gray-800 rounded w-20" />
              <div className="h-5 bg-gray-800 rounded w-20" />
              <div className="h-5 bg-gray-800 rounded w-20" />
            </div>
            {/* Buttons */}
            <div className="flex gap-3">
              <div className="h-10 bg-gray-800 rounded-lg w-24" />
              <div className="h-10 bg-gray-800 rounded-lg w-32" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Info Skeleton */}
        <div className="md:col-span-1">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <div className="h-6 bg-gray-800 rounded w-40 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 bg-gray-800 rounded" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-800 rounded w-20 mb-1" />
                    <div className="h-5 bg-gray-800 rounded w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Skeleton */}
        <div className="md:col-span-2">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <div className="h-6 bg-gray-800 rounded w-36 mb-4" />
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-4" />
              <div className="h-5 bg-gray-800 rounded w-32 mx-auto mb-2" />
              <div className="h-4 bg-gray-800 rounded w-48 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
