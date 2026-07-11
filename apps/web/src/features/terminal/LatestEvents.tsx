import { ArrowLeftRight, Play, Square, Zap, type LucideIcon } from "lucide-react";
import { RailCard } from "../../components/ui/RailCard";
import { EVENTS, type EventRow } from "../../lib/terminal";

const ICON: Record<EventRow["kind"], { Icon: LucideIcon; tint: string }> = {
  goal: { Icon: Zap, tint: "text-up" },
  sub: { Icon: ArrowLeftRight, tint: "text-lo" },
  card: { Icon: Square, tint: "text-lo" },
  play: { Icon: Play, tint: "text-lo" },
};

/** Latest events — the live match feed (goals, subs, cards, restarts) mirroring Sofascore's incident list. */
export function LatestEvents() {
  return (
    <RailCard
      label="Latest events"
      action={<span className="num rounded-full bg-up/15 px-1 py-0.5 text-label font-semibold tabular-nums text-up">+5 ADDED HT</span>}
    >
      <ul>
        {EVENTS.map((e) => {
          const { Icon, tint } = ICON[e.kind];
          const isGoal = e.kind === "goal";
          return (
            <li key={`${e.minute}-${e.text}`} className="flex items-center gap-2 rounded-lg px-2 py-1">
              <span className={`num w-7 text-label tabular-nums ${isGoal ? "font-semibold text-up" : "text-lo"}`}>{e.minute}'</span>
              <Icon aria-hidden size={13} className={`shrink-0 ${tint}`} />
              <span className="min-w-0 flex-1 truncate text-caption text-hi">{e.text}</span>
            </li>
          );
        })}
      </ul>
    </RailCard>
  );
}
