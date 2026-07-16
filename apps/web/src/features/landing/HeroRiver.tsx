"use client";
import { MomentumRiver } from "../../components/ui/MomentumRiver";
import { LivePrice } from "../../components/ui/LivePrice";
import { useMatchLive, FULL_TIME } from "../live/matchLiveStore";
import { FEATURED } from "./LoopStage";
import type { Outcome } from "../../lib/types";

/** The hero's right half — the signature River as a LIVE tape, owning the space (design law: all visual
 *  boldness lives in the River). Reads the SAME match store the board and the loop stage read, so the
 *  minute, score, and price here never disagree with the panel below (SSOT). The price is a LivePrice,
 *  so the hero tape tick-flashes as the market drifts. */
export function HeroRiver() {
  const live = useMatchLive(FEATURED.matchId);
  const spark = live?.spark ?? FEATURED.spark;
  const minute = live?.minute ?? FEATURED.minute;
  const score = live?.score ?? FEATURED.score;
  const mk = (live?.prices ?? FEATURED.mark ?? { H: 0, D: 0, A: 0 }) as Record<Outcome, number>;
  const halted = live?.status === "HALTED";
  const rising = spark.length > 1 && spark[spark.length - 1] >= spark[0];

  return (
    <div data-hero-river className="w-full">
      <div className="flex items-baseline justify-between">
        <span className="num text-label font-semibold uppercase tracking-caps text-lo">
          {FEATURED.homeCode}–{FEATURED.awayCode} <span className="text-hi">{score?.home}–{score?.away}</span>
        </span>
        <span className={`num inline-flex items-center gap-1.5 text-label font-semibold uppercase tracking-tag ${halted ? "text-halt" : "text-up"}`}>
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${halted ? "bg-halt" : "bg-up shadow-[0_0_6px_var(--up)]"}`} />
          {halted ? "Halted" : "Live"} · {minute}&#39;
        </span>
      </div>
      <div className="relative">
        {/* the halt reaches the tape itself — same amber grammar as the panel's wash, quieter */}
        {halted && <div aria-hidden className="pointer-events-none absolute inset-0 z-10 border-t-2 border-halt/70 bg-halt/10" />}
        {/* Pin the price axis 0..100 (it's a win %) — without this the area autoscales to the narrow live band
            and the fill reads as a faint glow; pinned, the river draws BIG from the value down (parity with BigRiver). */}
        <MomentumRiver data={spark} up={rising} height={300} yRange={[0, 100]} totalMinutes={FULL_TIME} />
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-hairline/60 pt-3">
        <span className="text-label font-semibold uppercase tracking-label text-lo">{FEATURED.homeCode} to win</span>
        <LivePrice value={mk.H * 100} className="text-display font-bold text-hi" />
      </div>
    </div>
  );
}
