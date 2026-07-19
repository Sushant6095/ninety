"use client";
import { useMatchLive, TERMINAL_MATCH_ID } from "../live/matchLiveStore";
import { Terminal, AnimatedSpan } from "../../components/vendor/magicui/terminal";
import { BOOTH, BOOTH_TIMELINE, BOOTH_GOAL, type BoothEvent } from "../../lib/terminal";

function Impact({ e }: { e: BoothEvent }) {
  if (e.repriced) return <span className="num shrink-0 rounded bg-up/12 px-1 py-0.5 text-label font-semibold text-up ring-1 ring-inset ring-up/25">{e.repriced}</span>;
  const up = e.delta >= 0;
  const big = Math.abs(e.delta) >= 5;
  return <span className={`num shrink-0 text-label ${up ? "text-up" : "text-down"} ${big ? "font-bold" : "font-medium"}`}>{up ? "▲" : "▼"}{Math.abs(e.delta).toFixed(1)}</span>;
}

/** The Booth · live AI commentary + the market impact each event had. Every word here is bound to the ONE store:
 *  the phase pill restates the real status and minute, and the goal call is only listed once the score says a
 *  goal exists. A timeline that narrates a minute the match hasn't reached is the bug this screen keeps hitting. */
export function BoothTimeline() {
  const live = useMatchLive(TERMINAL_MATCH_ID);
  const status = live?.status ?? "LIVE";
  const minute = live?.minute ?? 0;
  const halted = status === "HALTED";
  const scored = (live?.score?.away ?? 0) > 0;

  // Only events the match has actually played, newest first · plus the goal call the moment it lands.
  const events = [...(scored ? [BOOTH_GOAL] : []), ...BOOTH_TIMELINE]
    .filter((e) => e.minute <= minute)
    .sort((a, b) => b.minute - a.minute);

  return (
    <div className="px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-label font-semibold uppercase tracking-tag text-lo">
          <span className="flex items-end gap-[2px]" aria-hidden>
            <span className="h-2 w-[2px] rounded-full bg-up" /><span className="h-3 w-[2px] rounded-full bg-up" /><span className="h-1.5 w-[2px] rounded-full bg-up" /><span className="h-2.5 w-[2px] rounded-full bg-up" />
          </span>
          The Booth · Live AI call
        </h3>
        <span className="num text-label uppercase tracking-wide text-lo">{BOOTH.lang} · {BOOTH.mode}</span>
      </div>

      <div className="mb-3 rounded-lg bg-bg/50 p-3 ring-1 ring-inset ring-hairline/60">
        <span className={`num mb-1 inline-block rounded px-1 py-0.5 text-label font-semibold uppercase tracking-wide ${halted ? "bg-halt/15 text-halt" : "bg-up/15 text-up"}`}>
          {halted ? "Halted" : "Playing"} · {minute}&#39;
        </span>
        <p className="text-body leading-snug text-hi">
          {scored ? BOOTH_GOAL.text : BOOTH.text}
        </p>
      </div>

      {/* The log itself wears terminal chrome (magicui Terminal, re-skinned). sequence is OFF on purpose:
          the vendor sequencer indexes children by position, so a goal line prepending live would inherit an
          already-completed index and never reveal. Each line fades in on mount at m.fast instead · a system
          log, not a movie; keys keep played lines from re-animating. */}
      <Terminal sequence={false}>
        {events.map((e, i) => (
          <AnimatedSpan key={e.minute} delay={Math.min(i, 6) * 40}>
            <span className="flex items-start gap-3">
              <span className="num w-7 shrink-0 text-right text-lo">{e.minute}&#39;</span>
              <span className="min-w-0 flex-1 leading-snug text-hi/90">{e.text}</span>
              <Impact e={e} />
            </span>
          </AnimatedSpan>
        ))}
      </Terminal>
    </div>
  );
}
