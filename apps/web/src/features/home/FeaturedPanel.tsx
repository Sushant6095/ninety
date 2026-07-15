"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MomentumRiver } from "../../components/ui/MomentumRiver";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { LivePrice } from "../../components/ui/LivePrice";
import {
  useMatchLive, setMatchStatus, setScore, repriceMatch, settleSpark, rewindMatch, FULL_TIME,
} from "../live/matchLiveStore";
import { useHaltSequence, type HaltActions } from "../live/useHaltSequence";
import { routes } from "../../lib/routes";
import type { MarketRow, Outcome } from "../../lib/types";

const HOME_STEP = 17; // points the home price jumps when the goal is confirmed

function Cell({ label, price, lead, frozen }: { label: string; price: number; lead: boolean; frozen: boolean }) {
  const ring = frozen ? "bg-halt/5 ring-halt/40" : lead ? "bg-hairline/45 ring-hairline" : "bg-bg/60 ring-hairline/50";
  return (
    <div className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 ring-1 ring-inset transition-colors duration-200 ${ring}`}>
      <span className="text-label font-semibold uppercase tracking-micro text-lo">{label}</span>
      <LivePrice value={price} className={`text-heading font-bold ${lead ? "text-hi" : "text-hi/85"}`} />
    </div>
  );
}

/** Featured live match — the board's hero. Read-only market + live River + big prices; the CTA links to the match
 *  (the trade action itself is deferred, ADR-042/BLOCKED B1).
 *
 *  It runs the SAME halt choreography as /terminal — the same `useHaltSequence` timeline, the same store writes —
 *  at a smaller staging: goal flash, amber sweep, HALTED wash, the price landing, resume. There is no second
 *  timeline and no second copy of the state: the goal lands in the ONE store, so the match's row in the board list
 *  behind this panel steps its score and reprices on the very same frame. That ripple IS the point of the SSOT. */
export function FeaturedPanel({ market, replayNonce = 0 }: { market: MarketRow; replayNonce?: number }) {
  const live = useMatchLive(market.matchId);
  const mk = (live?.prices ?? market.mark ?? { H: 0, D: 0, A: 0 }) as Record<Outcome, number>;
  const spark = live?.spark ?? market.spark;
  const minute = live?.minute ?? market.minute;
  const score = live?.score ?? market.score;
  const halted = live?.status === "HALTED";
  const lead: Outcome = mk.H >= mk.D && mk.H >= mk.A ? "H" : mk.A >= mk.D ? "A" : "D";
  const rising = spark.length > 1 && spark[spark.length - 1] >= spark[0];

  // The goal the halt confirms: the home side score, and their price steps from wherever the market OPENED.
  const openHome = (live?.openPrices.H ?? mk.H) * 100;
  const seedScore = live ? null : market.score;
  const homePost = Math.min(94, openHome + HOME_STEP);

  const sectionRef = useRef<HTMLElement>(null);
  const [, setBusy] = useState(false);
  const id = market.matchId;
  const haltActions = useMemo<HaltActions>(
    () => ({
      reset: () => rewindMatch(id),
      halt: () => setMatchStatus(id, "HALTED"),
      land: () => {
        repriceMatch(id, "H", homePost);
        const s = seedScore ?? { home: 1, away: 0 };
        setScore(id, { home: s.home + 1, away: s.away });
      },
      settle: () => settleSpark(id),
      resume: () => setMatchStatus(id, "LIVE"),
      busy: setBusy,
    }),
    [id, homePost], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const { replay } = useHaltSequence(sectionRef, haltActions);
  // A bumped nonce re-fires the whole halt choreography — the landing uses it to replay the goal on
  // every scroll-into-view without remounting (a remount could be photographed as the skeleton).
  const lastNonce = useRef(replayNonce);
  useEffect(() => {
    if (replayNonce !== lastNonce.current) {
      lastNonce.current = replayNonce;
      replay();
    }
  }, [replayNonce, replay]);

  return (
    <section ref={sectionRef} className="elev-hi relative overflow-hidden rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3">
        <h2 className="text-label font-semibold uppercase tracking-label text-lo">Featured — {halted ? "Halted" : "Live"}</h2>
        <span className={`num inline-flex items-center gap-1 text-label ${halted ? "text-halt" : "text-up"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${halted ? "bg-halt" : "bg-up shadow-[0_0_6px_var(--up)]"}`} />
          {minute}&#39;
        </span>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <span className="flex flex-col items-center gap-1.5">
          <TeamCrest code={market.homeCode} size={52} priority />
          <span className="text-label font-medium tracking-wide text-lo">{market.homeCode}</span>
        </span>
        <span className="num font-display text-display-xl font-extrabold leading-none tabular-nums text-hi">
          {score?.home}<span className="px-1 text-lo">–</span>{score?.away}
        </span>
        <span className="flex flex-col items-center gap-1.5">
          <TeamCrest code={market.awayCode} size={52} priority />
          <span className="text-label font-medium tracking-wide text-lo">{market.awayCode}</span>
        </span>
      </div>

      {/* the River + its halt staging. The overlays are DOM chrome outside the canvas, exactly as on /terminal. */}
      <div className="relative px-1">
        <div data-halt="chart">
          {/* the live spark, not the fixture's — and on the match-time axis, so it ends at the live minute */}
          <MomentumRiver data={spark} up={rising} height={108} totalMinutes={FULL_TIME} />
        </div>
        <div data-halt="wash" aria-hidden className="pointer-events-none invisible absolute inset-0 z-10 border-t-2 border-halt/70 bg-halt/15 opacity-0">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-heading font-extrabold uppercase tracking-hero text-halt/50">Halted</span>
        </div>
        <div data-halt="flash" aria-hidden className="pointer-events-none invisible absolute inset-0 z-30 bg-halt opacity-0" />
        <div data-halt="sweep" aria-hidden className="pointer-events-none invisible absolute inset-y-0 left-0 z-30 w-1/3 bg-halt/50 opacity-0 blur-sm" />
        <div data-halt="cliff" aria-hidden className="num pointer-events-none invisible absolute right-2 top-1 z-30 rounded-md border border-up/50 bg-bg/90 px-1.5 py-0.5 text-label font-semibold uppercase tracking-wide text-hi opacity-0">
          Goal {minute}&#39; · {market.homeCode}
        </div>
      </div>

      <div data-halt="dim" className="grid grid-cols-3 gap-1 px-3 pt-1">
        <Cell label="Home" price={mk.H * 100} lead={lead === "H"} frozen={halted} />
        <Cell label="Draw" price={mk.D * 100} lead={lead === "D"} frozen={halted} />
        <Cell label="Away" price={mk.A * 100} lead={lead === "A"} frozen={halted} />
      </div>

      <div className="p-3 pt-2">
        <Link
          href={routes.match(market.matchId)}
          className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-up px-4 py-2 text-strong font-semibold text-bg transition-[filter,transform] duration-200 ease-out hover:brightness-110 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {/* Honest CTA: orders reject during a halt (MARKET_HALTED), so the label must not promise a trade. */}
          {halted ? "View market" : "Trade this match"}
        </Link>
      </div>
    </section>
  );
}
