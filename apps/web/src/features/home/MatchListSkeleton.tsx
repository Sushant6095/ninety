/** Loading placeholder for the match list — a few calm shimmer rows. Reused as chunk-7 loading state. */
export function MatchListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden className="divide-y divide-hairline">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <div className="h-8 w-8 animate-pulse rounded-full bg-hairline/50" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 animate-pulse rounded bg-hairline/50" />
            <div className="h-3 w-20 animate-pulse rounded bg-hairline/40" />
          </div>
          <div className="ml-auto flex gap-2">
            {[0, 1, 2].map((c) => (
              <div key={c} className="h-9 w-12 animate-pulse rounded-md bg-hairline/40" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
