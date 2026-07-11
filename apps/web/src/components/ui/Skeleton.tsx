// Shared loading skeletons — pulse placeholders that reserve layout so there's no content-jump on load.
// `animate-pulse` is opacity-only (compositor-friendly) and honors prefers-reduced-motion via globals.css.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-hairline/40 ${className}`} aria-hidden />;
}

/** One match-row placeholder — mirrors MatchCard's shape (star · time · teams · spark · 3 chips). */
export function MatchRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-4 w-4 rounded-full" />
      <Skeleton className="h-6 w-9" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="hidden h-7 w-16 sm:block" />
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-12" />)}
      </div>
    </div>
  );
}

/** Full-page fallback for route transitions — header bar + a card of rows. */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-bg" aria-busy="true" aria-label="Loading">
      <div className="border-b border-hairline">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4 sm:px-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="ml-auto h-8 w-28 rounded-chip" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1040px] px-4 py-6 sm:px-6">
        <Skeleton className="mb-5 h-8 w-48" />
        <Skeleton className="mb-6 h-40 w-full rounded-card" />
        <div className="overflow-hidden rounded-card border border-hairline bg-surface">
          <div className="divide-y divide-hairline/60">
            {[0, 1, 2, 3, 4].map((i) => <MatchRowSkeleton key={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
