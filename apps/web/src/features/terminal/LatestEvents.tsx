"use client";
import { ArrowLeftRight, Play, Square, Zap, type LucideIcon } from "lucide-react";
import { RailCard } from "../../components/ui/RailCard";
import { useMatchLive, TERMINAL_MATCH_ID } from "../live/matchLiveStore";
import { EVENTS, GOAL_EVENT, type EventRow } from "../../lib/terminal";

const ICON: Record<EventRow["kind"], { Icon: LucideIcon; tint: string }> = {
  goal: { Icon: Zap, tint: "text-up" },
  sub: { Icon: ArrowLeftRight, tint: "text-lo" },
  card: { Icon: Square, tint: "text-lo" },
  play: { Icon: Play, tint: "text-lo" },
};

/** Latest events · the live match feed (goals, subs, cards, restarts) mirroring Sofascore's incident list.
 *  Bound to the ONE store: it lists only minutes the match has actually played, and the goal appears only once
 *  the score says a goal exists. An incident list that outruns the clock is the oldest bug on this screen. */
export function LatestEvents() {
  const live = useMatchLive(TERMINAL_MATCH_ID);
  const minute = live?.minute ?? 0;
  const scored = (live?.score?.away ?? 0) > 0;

  const events = [...(scored ? [GOAL_EVENT] : []), ...EVENTS]
    .filter((e) => e.minute <= minute)
    .sort((a, b) => b.minute - a.minute);

  return (
    <RailCard
      label="Latest events"
      action={<span className="num rounded-full bg-hairline/60 px-1.5 py-0.5 text-label font-semibold tabular-nums text-lo">{events.length}</span>}
    >
      <ul>
        {events.map((e) => {
          const { Icon, tint } = ICON[e.kind];
          const isGoal = e.kind === "goal";
          return (
            <li key={`${e.minute}-${e.text}`} className="flex items-center gap-2 rounded-lg px-2 py-1">
              <span className={`num w-7 text-label tabular-nums ${isGoal ? "font-semibold text-up" : "text-lo"}`}>{e.minute}&#39;</span>
              <Icon aria-hidden size={13} className={`shrink-0 ${tint}`} />
              <span className="min-w-0 flex-1 truncate text-caption text-hi">{e.text}</span>
            </li>
          );
        })}
      </ul>
    </RailCard>
  );
}
