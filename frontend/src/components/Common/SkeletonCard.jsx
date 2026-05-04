/**
 * Reusable skeleton shimmer components for loading states.
 * Replace boring spinners with premium-looking skeleton screens.
 */

function Shimmer({ className = '' }) {
  return (
    <div className={`animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded ${className}`} />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card animate-pulse !p-5">
      <div className="flex items-center gap-3 mb-4">
        <Shimmer className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-3/4 rounded-lg" />
          <Shimmer className="h-3 w-1/2 rounded-lg" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer key={i} className={`h-3 rounded-lg ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="card animate-pulse !p-5">
      <Shimmer className="h-3 w-24 rounded mb-3" />
      <Shimmer className="h-10 w-16 rounded-lg mb-2" />
      <Shimmer className="h-3 w-20 rounded" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <Shimmer className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-4 w-1/3 rounded" />
        <Shimmer className="h-3 w-1/2 rounded" />
      </div>
      <Shimmer className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="flex flex-col gap-xl max-w-7xl mx-auto pb-xl animate-fade-in">
      {/* Greeting skeleton */}
      <div className="space-y-3">
        <Shimmer className="h-8 w-80 rounded-lg" />
        <Shimmer className="h-4 w-48 rounded" />
        <Shimmer className="h-3 w-40 rounded" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
        {[1, 2, 3, 4].map(i => <SkeletonStat key={i} />)}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={4} />
      </div>
    </div>
  );
}

export function SkeletonProjectGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
      {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} lines={2} />)}
    </div>
  );
}

export function SkeletonTeam() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="card animate-pulse !p-5">
          <div className="flex items-center gap-4">
            <Shimmer className="w-14 h-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-32 rounded" />
              <Shimmer className="h-3 w-20 rounded" />
              <Shimmer className="h-2.5 w-24 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
