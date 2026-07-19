"use client";
import { RotateCcw } from "lucide-react";
import { MomentumRiver } from "../../components/ui/MomentumRiver";
import { LivePrice } from "../../components/ui/LivePrice";
import { BoothLine } from "./BoothLine";
import { FULL_TIME, MONEY_SHOT } from "../live/matchLiveStore";
import type { TerminalMatch } from "../../lib/terminal";
import type { Outcome } from "../../lib/types";

interface BigRiverProps {
  match: TerminalMatch;
  mark: Record<Outcome, number>;
  spark: number[];
  homeSpark: number[];
  minute: number; // the live match minute · where the River's trace ENDS (it can never draw past this)
  onReplay: () => void; // fire the halt money-shot again
  replayBusy: boolean; // gate the button while the timeline runs
  boothQuote: string; // the reactive Booth call, bound to the real before→after away-win%
  boothDelta: number; // points the away-win% stepped
}

/** The center hero · the big Momentum River (away-win% area) with outcome tags, y/x axes and the goal callout,
 *  PLUS the Tier-0 halt choreography's DOM overlays (flash / sweep / wash / cliff glyph · all outside the chart
 *  canvas), the spread indicator, and the persistent Booth line. Reuses the one lightweight-charts River
 *  (ADR-045); the overlays are absolutely-positioned chrome driven by the GSAP timeline via their data-halt hooks. */
// The price axis is PINNED (never autoscaled) so the SVG cliff overlay can align to the canvas it draws over.
// It stops at 70, not 100: this market lives between ~14 and ~55 (Egypt 31 → 55 on the goal, Australia 48 → 31),
// and a 0–100 domain spent half the hero on white space no trace will ever reach. 70 keeps ~15 points of headroom
// above the post-goal mark · enough for the drift, tight enough that the River actually fills its box.
const Y_MAX = 70;
// Where a win-% value lands inside the chart box, as a % from the top. lightweight-charts insets the plot by its
// default 10% price-scale margins, so Y_MAX sits at 10.4% and 0 at 89.5%. The outcome tags, the y-axis ticks and
// the SVG cliff ALL map through this ONE function · that is why the AUS badge sits exactly on the AUS line.
const PLOT_TOP = 10.4; // y% of value Y_MAX
const PLOT_BOT = 89.5; // y% of value 0
const yFor = (v: number): number => PLOT_BOT - (v / Y_MAX) * (PLOT_BOT - PLOT_TOP);
const TICKS = [60, 40, 20];

export function BigRiver({ match, mark, spark, homeSpark, minute, onReplay, replayBusy, boothQuote, boothDelta }: BigRiverProps) {
  // Where the trace ends on the 0–90' axis. The NOW line, the minute label AND the cliff all hang off this one
  // number, so none of them can drift from the series the chart actually drew.
  const nowPct = Math.min(100, Math.max(0, (minute / FULL_TIME) * 100));
  // The cliff: flat at the pre-goal mark, then the step up to the post-goal mark, ending exactly at the live edge.
  const cliffPath = `M ${nowPct - 28} ${yFor(MONEY_SHOT.awayPre)} L ${nowPct - 8} ${yFor(MONEY_SHOT.awayPre)} L ${nowPct} ${yFor(MONEY_SHOT.awayPost)}`;
  const tags: { key: Outcome; label: string; cls: string }[] = [
    { key: "A", label: match.awayCode, cls: "text-up ring-up/30 bg-up/10" },
    { key: "D", label: "DRW", cls: "text-lo ring-hairline bg-bg/70" },
    { key: "H", label: match.homeCode, cls: "text-down ring-down/30 bg-down/10" },
  ];

  return (
    <div className="border-b border-hairline px-4 py-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-label font-semibold uppercase tracking-label text-lo">
          Momentum River · <span className="text-up">{match.awayCode} win %</span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReplay}
            disabled={replayBusy}
            // A quiet control, NOT an amber one: amber is the halt signal (design law), and burning it on an
            // idle button pre-spends the very cue the money-shot lands on. It only goes amber while it runs.
            className={`hit inline-flex min-h-8 items-center gap-1.5 rounded-chip bg-bg px-2.5 py-1 text-label font-semibold uppercase tracking-wide ring-1 ring-inset outline-none transition-[color,background-color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-hi active:scale-[0.97] disabled:cursor-default ${
              replayBusy ? "text-halt ring-halt/40" : "text-lo ring-hairline hover:text-hi hover:ring-hi/30"
            }`}
          >
            <RotateCcw className="h-3 w-3" aria-hidden strokeWidth={2.5} /> Replay the halt
          </button>
          <span className="num hidden text-label uppercase tracking-wide text-lo sm:inline">
            LMSR · TICK {match.tick.toFixed(2)} · B={match.b.toLocaleString("en-US")}
          </span>
        </div>
      </div>

      <div className="relative">
        {/* y-axis ticks · placed at their true heights via the same map the traces use, so a tick never lies */}
        <div className="num pointer-events-none absolute inset-0 left-0 z-10 text-label text-lo">
          {TICKS.map((v) => (
            <span key={v} className="absolute left-0 -translate-y-1/2" style={{ top: `${yFor(v)}%` }}>{v}</span>
          ))}
        </div>

        {/* outcome tags on the right edge · driven off the live mark so badge == price cell == trade price, and
            parked at the HEIGHT of their own trace, so the AUS badge can never float above the AUS line */}
        {tags.map((t) => (
          <div
            key={t.key}
            className={`num pointer-events-none absolute right-1 z-20 flex -translate-y-1/2 items-center gap-1 rounded px-1 py-0.5 text-label font-semibold ring-1 ring-inset ${t.cls}`}
            style={{ top: `${yFor(mark[t.key] * 100)}%` }}
          >
            <span className="text-label opacity-80">{t.label}</span>
            <LivePrice value={mark[t.key] * 100} />
          </div>
        ))}

        {/* the River itself · a FIXED 0–70 price axis and a FIXED 0–90' time axis, so the trace ends at the live
            minute and the rest of the match stays honest, empty space (ADR-055). */}
        <div data-halt="chart">
          <MomentumRiver data={spark} up height={300} secondary={homeSpark} yRange={[0, Y_MAX]} totalMinutes={FULL_TIME} />
        </div>

        {/* ── Halt choreography overlays (DOM only · never inside the chart canvas). Hidden until the GSAP timeline runs. ── */}
        {/* persistent amber HALT wash · bathes the whole frozen River for the entire halted phase, then fades on resume */}
        <div data-halt="wash" aria-hidden className="pointer-events-none invisible absolute inset-0 z-10 border-t-2 border-halt/70 bg-halt/15 opacity-0">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-display-xl font-extrabold uppercase tracking-hero text-halt/40">Halted</span>
        </div>
        {/* the cliff DRAWS ON · an SVG segment (pre-goal 31 → new mark 55) revealed via stroke-dashoffset, then the
            canvas settles underneath and this fades out. Its geometry is DERIVED (yFor + the live minute), never
            hardcoded, so it lands on the canvas it is drawn over even as the axis or the clock changes. */}
        <svg data-halt="drawcliff" aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none invisible absolute inset-0 z-20 h-full w-full opacity-0">
          <path data-halt="drawcliff-path" d={cliffPath} className="fill-none stroke-up" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div data-halt="flash" aria-hidden className="pointer-events-none invisible absolute inset-0 z-30 bg-halt opacity-0" />
        <div data-halt="sweep" aria-hidden className="pointer-events-none invisible absolute inset-y-0 left-0 z-30 w-1/3 bg-halt/50 opacity-0 blur-sm" />
        {/* the goal glyph · Ashour's counter; reveals ON the cliff (the goal being scored), matches the header step */}
        <div data-halt="cliff" aria-hidden className="num pointer-events-none invisible absolute right-[14%] top-7 z-30 flex items-center gap-1 rounded-md border border-up/50 bg-bg/90 px-2 py-1 text-label font-semibold uppercase tracking-wide text-hi opacity-0">
          {match.goalLabel}
        </div>

        {/* the NOW line · sits exactly where the trace ends, so the chart and the match clock are visibly one thing */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 z-10 w-px bg-hairline" style={{ left: `${nowPct}%` }} />
      </div>

      {/* x-axis = real match time. Three labels on a 0–90 axis: HT is the exact midpoint, so they land true. */}
      <div className="num relative mt-1 h-4 text-label text-lo">
        <span className="absolute left-0">0&#39;</span>
        <span className="absolute left-1/2 -translate-x-1/2">HT</span>
        <span className="absolute right-0">90&#39;</span>
        {/* the live minute rides the NOW line · suppressed near the fixed labels so they never collide */}
        {minute > 8 && minute < 84 && Math.abs(minute - 45) > 5 && (
          <span className="absolute -translate-x-1/2 font-semibold text-hi" style={{ left: `${nowPct}%` }}>{minute}&#39;</span>
        )}
      </div>

      {/* spread indicator · widens on the halt, walks back to normal as liquidity returns (transform-only) */}
      <div data-halt="spread" aria-hidden className="invisible mt-2 flex items-center gap-2 px-1 opacity-0">
        <span data-halt="spread-label" className="num shrink-0 text-label uppercase tracking-wide text-lo">spread {(4.2).toFixed(1)}</span>
        <div className="relative h-1 flex-1 overflow-hidden rounded-chip bg-hairline/40">
          <div data-halt="spread-fill" className="h-full w-1/4 origin-left rounded-chip bg-halt/60" />
        </div>
      </div>

      {/* the Booth line (Mount A) · revealed as the final beat of the halt, then persists into LIVE */}
      <BoothLine quote={boothQuote} delta={boothDelta} />
    </div>
  );
}
