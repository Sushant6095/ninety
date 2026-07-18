"use client";
import Link from "next/link";
import { Goal, ChevronRight } from "lucide-react";
import { useRoundLog } from "../games/roundLog";
import { routes } from "../../lib/routes";

const PIPS = 5;

/** The terminal's GAMES section — a hub entry for the football game(s) we built (Next Goal, ADR-060), in the
 *  right rail. This is NOT the live playable call (that sits beside the trade panel, contextual to the open
 *  match); it's the section that names the games surface, shows YOUR persisted streak, and links to the full
 *  /play experience. Read-only consumer of the round log (localStorage) — holds no writer. Play-money framing. */
export function GamesRail() {
  const rounds = useRoundLog(); // newest first
  // Trailing streak = leading run of correct calls; wins/played from the whole log. Light, no game machine.
  let streak = 0;
  for (const r of rounds) {
    if (r.outcome === "correct") streak++;
    else break;
  }
  const wins = rounds.filter((r) => r.outcome === "correct").length;
  const played = rounds.length;

  return (
    <section className="elev rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h2 className="text-label font-semibold uppercase tracking-label text-lo">Games</h2>
        <Link
          href={routes.play}
          className="text-label font-medium text-lo outline-none transition-colors duration-200 hover:text-hi focus-visible:text-hi"
        >
          All →
        </Link>
      </div>
      <Link
        href={routes.play}
        aria-label="Next Goal — call the next scorer"
        className="group m-2 mt-0 flex items-center gap-3 rounded-lg p-2 outline-none transition-colors duration-200 hover:bg-hairline/20 focus-visible:bg-hairline/20"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-bg text-up ring-1 ring-inset ring-hairline">
          <Goal size={18} strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-body font-semibold text-hi">Next Goal</span>
            <span className="text-label uppercase tracking-caps text-lo">Free to play</span>
          </span>
          {/* Show the persisted streak once there's history; before that, the pitch: 3 seconds to call it. */}
          {played > 0 ? (
            <span className="mt-1 flex items-center gap-2">
              <span className="flex items-center gap-0.5" role="img" aria-label={`Streak ${streak}`}>
                {Array.from({ length: PIPS }, (_, i) => (
                  <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < streak ? "bg-up" : "bg-hairline"}`} />
                ))}
              </span>
              <span className="num text-label text-lo">{wins}/{played} called</span>
            </span>
          ) : (
            <span className="mt-0.5 block text-label text-lo">Three seconds to call the next scorer. Build a streak.</span>
          )}
        </span>
        <ChevronRight size={16} strokeWidth={2} aria-hidden className="shrink-0 text-lo transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}
