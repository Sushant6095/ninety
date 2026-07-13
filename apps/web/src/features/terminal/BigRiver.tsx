"use client";
import { MomentumRiver } from "../../components/ui/MomentumRiver";
import { LivePrice } from "../../components/ui/LivePrice";
import { useMatchLive, TERMINAL_MATCH_ID } from "../live/matchLiveStore";
import type { TerminalMatch } from "../../lib/terminal";
import type { Outcome } from "../../lib/types";

/** The center hero — the big Momentum River (away-win% area) with outcome tags, y/x axes and the goal callout.
 *  Reuses the one lightweight-charts River (ADR-045); overlays are absolutely positioned chrome. The amber
 *  halt watermark reads status from the ONE store, so the River visibly freezes-and-marks in lockstep. */
export function BigRiver({ match, mark, spark, homeSpark }: { match: TerminalMatch; mark: Record<Outcome, number>; spark: number[]; homeSpark: number[] }) {
  const halted = useMatchLive(TERMINAL_MATCH_ID)?.status === "HALTED";
  const latest = spark[spark.length - 1];
  const homeLatest = homeSpark[homeSpark.length - 1];
  const tags: { key: Outcome; label: string; cls: string; pos: string }[] = [
    { key: "A", label: match.awayCode, cls: "text-up ring-up/30 bg-up/10", pos: "top-2" },
    { key: "D", label: "DRW", cls: "text-lo ring-hairline bg-bg/70", pos: "top-1/2 -translate-y-1/2" },
    { key: "H", label: match.homeCode, cls: "text-down ring-down/30 bg-down/10", pos: "bottom-2" },
  ];

  return (
    <div className="border-b border-hairline px-4 py-3">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-label font-semibold uppercase tracking-[0.12em] text-lo">
          Momentum River — <span className="text-up">{match.awayCode} win %</span>
        </h3>
        <span className="num text-label uppercase tracking-wide text-lo">LMSR · TICK {match.tick.toFixed(2)} · B={match.b.toLocaleString("en-US")}</span>
      </div>

      <div className="relative">
        {/* y-axis ticks */}
        <div className="num pointer-events-none absolute inset-y-0 left-0 z-10 flex flex-col justify-between py-3 text-label text-lo">
          <span>75</span><span>50</span><span>25</span>
        </div>

        {/* goal callout */}
        <div className="pointer-events-none absolute left-[26%] top-6 z-10 rounded-md border border-hairline bg-bg/85 px-2 py-1">
          <div className="num text-label font-semibold uppercase tracking-wide text-hi">{match.goalLabel}</div>
        </div>

        {/* outcome tags on the right edge — all driven off the live mark so badge == price cell == trade price */}
        {tags.map((t) => (
          <div key={t.key} className={`num pointer-events-none absolute right-1 z-10 flex items-center gap-1 rounded px-1 py-0.5 text-label font-semibold ring-1 ring-inset ${t.cls} ${t.pos}`}>
            <span className="text-label opacity-80">{t.label}</span>
            <LivePrice value={mark[t.key] * 100} />
          </div>
        ))}

        <MomentumRiver data={spark} up height={300} goalIndex={match.goalIndex} liveValue={latest} secondary={homeSpark} secondaryLive={homeLatest} />

        {/* HALT watermark — amber (var(--halt), halts only), stamped over the frozen River. Static: no motion to honor. */}
        {halted && (
          <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center" role="status" aria-live="polite">
            <div className="absolute inset-0 bg-halt/5" aria-hidden />
            <div className="relative flex flex-col items-center gap-1 rounded-lg border border-halt/40 bg-bg/70 px-5 py-3 text-center">
              <span className="text-heading font-display font-extrabold uppercase tracking-[0.14em] text-halt">Market halted</span>
              <span className="text-caption text-hi/80">Prices are frozen while the goal is reviewed</span>
            </div>
          </div>
        )}
      </div>

      <div className="num mt-1 flex items-center justify-between px-4 text-label text-lo">
        <span>0&#39;</span><span>HT</span><span>50&#39;</span><span>90&#39;</span>
      </div>
    </div>
  );
}
