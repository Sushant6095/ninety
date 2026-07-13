"use client";
import { RotateCcw } from "lucide-react";
import { MomentumRiver } from "../../components/ui/MomentumRiver";
import { LivePrice } from "../home/LiveMarkets";
import { BoothLine } from "./BoothLine";
import type { TerminalMatch } from "../../lib/terminal";
import type { Outcome } from "../../lib/types";

interface BigRiverProps {
  match: TerminalMatch;
  mark: Record<Outcome, number>;
  spark: number[];
  homeSpark: number[];
  onReplay: () => void; // fire the halt money-shot again
  replayBusy: boolean; // gate the button while the timeline runs
  boothQuote: string; // the reactive Booth call, bound to the real before→after away-win%
  boothDelta: number; // points the away-win% stepped
}

/** The center hero — the big Momentum River (away-win% area) with outcome tags, y/x axes and the goal callout,
 *  PLUS the Tier-0 halt choreography's DOM overlays (flash / sweep / wash / cliff glyph — all outside the chart
 *  canvas), the spread indicator, and the persistent Booth line. Reuses the one lightweight-charts River
 *  (ADR-045); the overlays are absolutely-positioned chrome driven by the GSAP timeline via their data-halt hooks. */
export function BigRiver({ match, mark, spark, homeSpark, onReplay, replayBusy, boothQuote, boothDelta }: BigRiverProps) {
  const latest = spark[spark.length - 1];
  const homeLatest = homeSpark[homeSpark.length - 1];
  const tags: { key: Outcome; label: string; cls: string; pos: string }[] = [
    { key: "A", label: match.awayCode, cls: "text-up ring-up/30 bg-up/10", pos: "top-2" },
    { key: "D", label: "DRW", cls: "text-lo ring-hairline bg-bg/70", pos: "top-1/2 -translate-y-1/2" },
    { key: "H", label: match.homeCode, cls: "text-down ring-down/30 bg-down/10", pos: "bottom-2" },
  ];

  return (
    <div className="border-b border-hairline px-4 py-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-label font-semibold uppercase tracking-[0.12em] text-lo">
          Momentum River — <span className="text-up">{match.awayCode} win %</span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReplay}
            disabled={replayBusy}
            className="inline-flex items-center gap-1.5 rounded-chip bg-bg px-2.5 py-1 text-label font-semibold uppercase tracking-wide text-halt ring-1 ring-inset ring-halt/40 outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-halt active:opacity-80 disabled:cursor-default disabled:opacity-50"
          >
            <RotateCcw className="h-3 w-3" aria-hidden strokeWidth={2.5} /> Replay the halt
          </button>
          <span className="num hidden text-label uppercase tracking-wide text-lo sm:inline">
            LMSR · TICK {match.tick.toFixed(2)} · B={match.b.toLocaleString("en-US")}
          </span>
        </div>
      </div>

      <div className="relative">
        {/* y-axis ticks */}
        <div className="num pointer-events-none absolute inset-y-0 left-0 z-10 flex flex-col justify-between py-3 text-label text-lo">
          <span>75</span><span>50</span><span>25</span>
        </div>

        {/* outcome tags on the right edge — all driven off the live mark so badge == price cell == trade price */}
        {tags.map((t) => (
          <div key={t.key} className={`num pointer-events-none absolute right-1 z-20 flex items-center gap-1 rounded px-1 py-0.5 text-label font-semibold ring-1 ring-inset ${t.cls} ${t.pos}`}>
            <span className="text-label opacity-80">{t.label}</span>
            <LivePrice value={mark[t.key] * 100} />
          </div>
        ))}

        {/* the River itself — pre-goal flat ~31 on a FIXED 0–100 axis; muted to ~0.6 under the amber wash while frozen */}
        <div data-halt="chart">
          <MomentumRiver data={spark} up height={300} liveValue={latest} secondary={homeSpark} secondaryLive={homeLatest} yRange={[0, 100]} />
        </div>

        {/* ── Halt choreography overlays (DOM only — never inside the chart canvas). Hidden until the GSAP timeline runs. ── */}
        {/* persistent amber HALT wash — bathes the whole frozen River for the entire halted phase, then fades on resume */}
        <div data-halt="wash" aria-hidden className="pointer-events-none invisible absolute inset-0 z-10 border-t-2 border-halt/70 bg-halt/15 opacity-0">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-display-xl font-extrabold uppercase tracking-[0.2em] text-halt/25">Halted</span>
        </div>
        {/* the cliff DRAWS ON — an SVG segment (pre-halt 31 → new mark 55) revealed via stroke-dashoffset, then the
            canvas settles underneath and this fades out (blur-masked). Fixed 0–100 axis makes the y's align. */}
        <svg data-halt="drawcliff" aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none invisible absolute inset-0 z-20 h-full w-full opacity-0">
          <path data-halt="drawcliff-path" d="M 54 65 L 74 65 L 82 46" className="fill-none stroke-up" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div data-halt="flash" aria-hidden className="pointer-events-none invisible absolute inset-0 z-30 bg-halt opacity-0" />
        <div data-halt="sweep" aria-hidden className="pointer-events-none invisible absolute inset-y-0 left-0 z-30 w-1/3 bg-halt/50 opacity-0 blur-sm" />
        {/* the goal glyph — Ashour's counter at 13'; reveals ON the cliff (the goal being scored), matches the header step */}
        <div data-halt="cliff" aria-hidden className="num pointer-events-none invisible absolute right-[14%] top-7 z-30 flex items-center gap-1 rounded-md border border-up/50 bg-bg/90 px-2 py-1 text-label font-semibold uppercase tracking-wide text-hi opacity-0">
          {match.goalLabel}
        </div>
      </div>

      <div className="num mt-1 flex items-center justify-between px-4 text-label text-lo">
        <span>0&#39;</span><span>HT</span><span>50&#39;</span><span>90&#39;</span>
      </div>

      {/* spread indicator — widens on the halt, walks back to normal as liquidity returns (transform-only) */}
      <div data-halt="spread" aria-hidden className="invisible mt-2 flex items-center gap-2 px-1 opacity-0">
        <span data-halt="spread-label" className="num shrink-0 text-label uppercase tracking-wide text-lo">spread {(4.2).toFixed(1)}</span>
        <div className="relative h-1 flex-1 overflow-hidden rounded-chip bg-hairline/40">
          <div data-halt="spread-fill" className="h-full w-1/4 origin-left rounded-chip bg-halt/60" />
        </div>
      </div>

      {/* the Booth line (Mount A) — revealed as the final beat of the halt, then persists into LIVE */}
      <BoothLine quote={boothQuote} delta={boothDelta} />
    </div>
  );
}
