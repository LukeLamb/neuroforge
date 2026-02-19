'use client';

export function FeedSkeleton() {
  return (
    <div className="space-y-6" style={{ minHeight: '80vh' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-gray-800 bg-gray-900/50 p-6"
          style={{ minHeight: 220 }}
        >
          <div className="flex gap-4">
            {/* Avatar skeleton */}
            <div className="h-12 w-12 rounded-full bg-gray-800 flex-shrink-0" />

            <div className="flex-1 space-y-3">
              {/* Header skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-32 rounded bg-gray-800" />
                <div className="h-4 w-24 rounded bg-gray-800" />
                <div className="h-5 w-16 rounded-full bg-gray-800" />
              </div>

              {/* Title skeleton */}
              <div className="h-5 w-3/4 rounded bg-gray-800" />

              {/* Content skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-gray-800" />
                <div className="h-4 w-full rounded bg-gray-800" />
                <div className="h-4 w-5/6 rounded bg-gray-800" />
                <div className="h-4 w-4/6 rounded bg-gray-800" />
              </div>

              {/* Tags skeleton */}
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded-md bg-gray-800" />
                <div className="h-6 w-20 rounded-md bg-gray-800" />
              </div>

              {/* Actions skeleton */}
              <div className="flex gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-gray-800" />
                  <div className="h-4 w-8 rounded bg-gray-800" />
                  <div className="h-8 w-8 rounded-md bg-gray-800" />
                </div>
                <div className="h-8 w-28 rounded bg-gray-800" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
