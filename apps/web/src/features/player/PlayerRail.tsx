import Link from "next/link";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { PlayerPhoto } from "./PlayerPhoto";
import { loadPlayerIndex } from "./loaders";

/** "More top scorers" — cross-navigation across the top 20 so a player page is never a dead-end. Consumes the
 *  player index read-model (loadPlayerIndex → GET /players when un-pinned; baked fixtures by default). */
export function PlayerRail({ currentId }: { currentId: string }) {
  const others = loadPlayerIndex().filter((p) => p.id !== currentId);
  if (others.length === 0) return null;
  return (
    <section aria-label="More top scorers">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-strong font-semibold text-hi">More top scorers</h2>
        <span className="text-label uppercase tracking-micro text-lo">World Cup 2026</span>
      </div>
      <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-1">
        {others.map((p) => (
          <Link
            key={p.id}
            href={`/player/${p.id}`}
            className="group flex w-[128px] shrink-0 snap-start flex-col items-center gap-2 rounded-card border border-hairline bg-surface p-3 text-center transition-colors duration-200 hover:border-hairline hover:bg-hairline/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up/50"
          >
            <PlayerPhoto name={p.name} photo={p.photo} nat={p.nat} size={52} />
            <span className="w-full truncate text-caption font-medium text-hi">{p.name}</span>
            <span className="flex items-center gap-1.5 text-label text-lo">
              <TeamCrest code={p.nat} size={12} />
              <span className="num tabular-nums">{p.goals}G</span>
              <span aria-hidden>·</span>
              <span className="num tabular-nums">{p.assists}A</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
