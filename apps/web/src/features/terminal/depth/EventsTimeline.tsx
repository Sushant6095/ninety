"use client";
import { ArrowLeftRight, Play, Square, Zap, type LucideIcon } from "lucide-react";
import { useMatchLive, TERMINAL_MATCH_ID } from "../../live/matchLiveStore";
import { EVENTS, GOAL_EVENT, type EventRow } from "../../../lib/terminal";

// Glyph + tint per incident type. Cards stay NEUTRAL (text-lo) — amber is a halt-only token (design law),
// never a yellow card. Mirrors the LatestEvents rail so the two feeds read identically.
const STYLE: Record<EventRow["kind"], { Icon: LucideIcon; tint: string; dot: string }> = {
  goal: { Icon: Zap, tint: "text-up", dot: "bg-up" },
  sub: { Icon: ArrowLeftRight, tint: "text-lo", dot: "bg-hairline" },
  card: { Icon: Square, tint: "text-lo", dot: "bg-hairline" },
  play: { Icon: Play, tint: "text-lo", dot: "bg-hairline" },
};

/** Events tab — the full incident timeline (sofascore-research/incident-timeline.md): a minute-stamped spine,
 *  latest-first, richer than the rail's glance. Bound to the ONE store: it shows only minutes the match has
 *  played, and the 74' goal (GOAL_EVENT, shared with the rail) appears only once the score actually steps —
 *  a timeline may never outrun the clock. The goal carries the running score; cards/subs/plays are neutral. */
export function EventsTimeline() {
  const live = useMatchLive(TERMINAL_MATCH_ID);
  const minute = live?.minute ?? 0;
  const score = live?.score;
  const scored = (score?.away ?? 0) > 0;

  const incidents = [...(scored ? [GOAL_EVENT] : []), ...EVENTS]
    .filter((e) => e.minute <= minute)
    .sort((a, b) => b.minute - a.minute);

  if (incidents.length === 0) {
    return <p className="px-4 py-10 text-center text-body leading-relaxed text-lo">No incidents yet — kick-off build-up.</p>;
  }

  return (
    <div className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-label font-semibold uppercase tracking-[0.12em] text-lo">Match incidents</h3>
        <span className="num rounded-full bg-hairline/60 px-1.5 py-0.5 text-label font-semibold tabular-nums text-lo">{incidents.length}</span>
      </div>
      <ol>
        {incidents.map((e) => {
          const { Icon, tint, dot } = STYLE[e.kind];
          const isGoal = e.kind === "goal";
          return (
            <li key={`${e.minute}-${e.text}`} className="flex gap-3">
              <span className={`num w-9 shrink-0 pt-2.5 text-right text-label tabular-nums ${isGoal ? "font-semibold text-up" : "text-lo"}`}>{e.minute}&#39;</span>
              <span className="relative flex w-3 shrink-0 justify-center">
                {/* continuous spine — adjacent items' full-height lines connect into one axis */}
                <span aria-hidden className="absolute inset-y-0 w-px bg-hairline/60" />
                <span aria-hidden className={`relative mt-3 h-2.5 w-2.5 rounded-full ring-2 ring-bg ${dot}`} />
              </span>
              <div className="flex flex-1 items-center gap-2 py-2">
                <Icon aria-hidden size={14} className={`shrink-0 ${tint}`} />
                <span className="min-w-0 flex-1 text-caption text-hi">{e.text}</span>
                {isGoal && score ? (
                  <span className="num shrink-0 rounded bg-up/15 px-1.5 py-0.5 text-label font-semibold tabular-nums text-up ring-1 ring-inset ring-up/25">
                    {score.home}&#8211;{score.away}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
