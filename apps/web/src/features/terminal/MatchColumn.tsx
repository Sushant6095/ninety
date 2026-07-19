"use client";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { MatchHeader } from "./MatchHeader";
import { BigRiver } from "./BigRiver";
import { PriceCells } from "./PriceCells";
import { TradePanel, type PlaceResult } from "./TradePanel";
import { YourPosition } from "./YourPosition";
import { MatchTabs } from "./MatchTabs";
import { NextGoal } from "../games/NextGoal";
import { TERMINAL_RESOLVE_WINDOW_MS } from "../games/nextGoalMachine";
import { StateSwitcher, PreMatchPanel, SettledPanel, type MatchView } from "./MatchStates";
import { PlainMatchColumn } from "./PlainMatchColumn";
import { DOCK_TRADE_EVENT, DOCK_REPLAY_EVENT } from "./TerminalDock";
import { HaltBanner } from "../../components/ui/HaltBanner";
import { TradeSheet } from "../../components/ui/TradeSheet";
import { useHaltSequence, type HaltActions } from "../live/useHaltSequence";
import {
  useMatchLive, setMatchStatus, setScore, repriceMatch, settleSpark, rewindMatch,
  TERMINAL_MATCH_ID, MONEY_SHOT,
} from "../live/matchLiveStore";
import { MATCH, GOAL_MINUTE, type PositionRow } from "../../lib/terminal";
import { useSession } from "../session/SessionProvider";
import { marketByMatchId, koClock } from "../../lib/fixtures";
import { quote as lmsrQuote } from "../../lib/lmsr";
import { fmtCR } from "../../lib/format";
import type { Outcome } from "../../lib/types";

const IDX: Record<Outcome, number> = { H: 0, D: 1, A: 2 };

// The market's real kickoff wall-clock (UTC), read from the one fixture universe · shown in the pre-match state
// instead of a fake ticking countdown (the match already sits at 74' in the demo; a countdown would be a lie).
const KICKOFF = (() => { const ko = marketByMatchId(MATCH.matchId)?.kickoffAt; return ko ? koClock(ko) : "—"; })();
const codeFor = (o: Outcome): string => (o === "H" ? MATCH.homeCode : o === "A" ? MATCH.awayCode : "DRAW");
const vsFor = (o: Outcome): string => (o === "H" ? MATCH.awayCode : o === "A" ? MATCH.homeCode : `${MATCH.homeCode}/${MATCH.awayCode}`);

// Settled-state result (the settle envelope in production). Egypt take it late. There is NO real settle tx —
// settlement is fail-closed on purpose (ADR-036/037), so settleSig is empty and the ProofBadge renders its
// honest "proof pending" state, never a dead Solscan link.
const SETTLED_RESULT = { winner: "A" as Outcome, winnerName: "Egypt", scoreLine: "0 – 2", settleSig: "" };

// The terminal Next Goal card is a PURE READ-ONLY consumer (ADR-061): it resolves off the SAME store score
// delta the halt money-shot writes via land(), and NEVER fabricates a goal. So its round-lifecycle callbacks
// are no-ops here · /play's harness (matchSimHarness) is the ONLY thing that turns these into store writes.
const NOOP = (): void => {};

// ── The halt money-shot · ONE consistent story, ONE clock (ADR-055) ───────────────────────────────
// Australia v Egypt is goalless at 74' and Egypt's win% has been flat ~31 all match. Ashour's counter lands AT
// the live minute: the market halts, reprices 31 → 55, the score steps 0–0 → 0–1, and the Booth calls it. The
// choreography writes ONLY to the store, so the header, River, rails, Booth and the / board all step together.
const { awayPre: AWAY_PRE, awayPost: AWAY_POST } = MONEY_SHOT;
const BOOTH_DELTA = AWAY_POST - AWAY_PRE; // +24
const BOOTH_QUOTE = `Ashour's counter · Egypt ${AWAY_PRE} → ${AWAY_POST}`;

/** Center trading column dispatcher. The featured AUS-EGY market keeps the full money-shot below EXACTLY as-is
 *  (halt choreography, Next Goal, depth tabs); any other market opens the plain per-match terminal, which reads
 *  its own identity + live state and never borrows AUS-EGY data (ADR-055 credibility). */
export function MatchColumn({ matchId }: { matchId: string }) {
  if (matchId === TERMINAL_MATCH_ID) return <FeaturedMatchColumn />;
  return <PlainMatchColumn matchId={matchId} />;
}

/** The featured money-shot · owns the selected outcome AND the optimistic trade store: a confirmed order updates
 *  positions + free credits locally and reconciles on the fill frame (here: applied immediately; the reject path
 *  · insufficient credits / oversell · surfaces a Sonner toast). Every live number reads from the ONE store. */
function FeaturedMatchColumn() {
  const live = useMatchLive(TERMINAL_MATCH_ID);
  const view: MatchView = live?.status ?? "LIVE";
  const mark = live?.prices ?? MONEY_SHOT.prices;
  const spark = live?.spark ?? [];
  const homeSpark = live?.homeSpark ?? [];
  const minute = live?.minute ?? MONEY_SHOT.minute;
  const score = live?.score ?? { home: 0, away: 0 };

  // Identity is per-session (offline-first): a fresh account starts at its own credits with NO position on this
  // match — never a fabricated portfolio. Buying decrements `free` from that real balance and enters a position.
  const session = useSession();
  const [selected, setSelected] = useState<Outcome>("A");
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [free, setFree] = useState(session.credits);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [replayBusy, setReplayBusy] = useState(false);

  // Δ vs open · derived from the store, never seeded, so the cells can't claim a move the price didn't make.
  const open = live?.openPrices ?? MONEY_SHOT.prices;
  const todayDelta = useMemo(
    () => ({ H: (mark.H - open.H) * 100, D: (mark.D - open.D) * 100, A: (mark.A - open.A) * 100 }) as Record<Outcome, number>,
    [mark, open],
  );

  // The Tier-0 halt money-shot · one GSAP timeline scoped to this section, driven off the data-halt hooks its
  // children render. The callbacks only write to the store; GSAP owns all the travel.
  const sectionRef = useRef<HTMLElement>(null);
  const haltActions = useMemo<HaltActions>(
    () => ({
      reset: () => rewindMatch(TERMINAL_MATCH_ID), // back to the known opening frame: 74', 0–0, Egypt flat at 31
      halt: () => setMatchStatus(TERMINAL_MATCH_ID, "HALTED"), // freezes the clock, the River and the prices
      land: () => { repriceMatch(TERMINAL_MATCH_ID, "A", AWAY_POST); setScore(TERMINAL_MATCH_ID, { home: 0, away: 1 }); },
      settle: () => settleSpark(TERMINAL_MATCH_ID), // the canvas catches up after the SVG cliff has drawn on
      resume: () => setMatchStatus(TERMINAL_MATCH_ID, "LIVE"),
      busy: setReplayBusy,
    }),
    [],
  );
  const { replay } = useHaltSequence(sectionRef, haltActions);

  // The bottom dock's shortcuts land here: open the trade ticket / replay the halt money-shot.
  useEffect(() => {
    const onTrade = (): void => setSheetOpen(true);
    const onReplay = (): void => replay();
    window.addEventListener(DOCK_TRADE_EVENT, onTrade);
    window.addEventListener(DOCK_REPLAY_EVENT, onReplay);
    return () => {
      window.removeEventListener(DOCK_TRADE_EVENT, onTrade);
      window.removeEventListener(DOCK_REPLAY_EVENT, onReplay);
    };
  }, [replay]);

  // QA/screenshot affordance: `/terminal?state=pre` (or live | halted | settled) sets the store status on mount,
  // so every market state — the pre-match edge case especially — is reachable at a deterministic URL without a
  // click. Reads the raw query on the client only (no useSearchParams → no Suspense/prerender coupling). The
  // StateSwitcher still drives it interactively; this just makes the state screenshot-able directly.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("state")?.toUpperCase();
    const next = (["PRE", "LIVE", "HALTED", "SETTLED"] as MatchView[]).find((v) => v === q);
    if (next) setMatchStatus(TERMINAL_MATCH_ID, next);
  }, []);

  const preMatch = view === "PRE";

  // The header restates the store · the scorer line appears only once the score actually says a goal exists.
  // PRE-MATCH is honest and distinct: no scoreline yet (MatchHeader renders "vs"), no live minute pip, phase
  // reads PRE-MATCH — the match has not kicked off, so the header narrates nothing it cannot back.
  const headerLive = useMemo(
    () =>
      preMatch
        ? { score: null, minute: null, phase: "PRE-MATCH", scorer: "", status: "PRE" }
        : {
            score,
            minute,
            phase: live?.phase ?? MONEY_SHOT.phase,
            scorer: score.away > 0 ? `ASHOUR ← HAFEZ ${GOAL_MINUTE}'` : "",
            status: view,
          },
    [preMatch, score, minute, live?.phase, view],
  );

  const heldShares: Partial<Record<Outcome, number>> = {};
  for (const p of positions) heldShares[p.outcome] = (heldShares[p.outcome] ?? 0) + p.shares;
  const heldSel = positions.find((p) => p.outcome === selected);
  const primary = heldSel ?? positions[0];

  // Server-verified analog: recompute the authoritative quote on submit, validate, then apply optimistically.
  const placeOrder = useCallback(
    (side: "buy" | "sell", size: number): PlaceResult => {
      if (size <= 0) { const msg = "Pick a size first."; toast.error(msg); return { ok: false, error: msg }; }
      const q = lmsrQuote(MATCH.amm.q, MATCH.amm.b, IDX[selected], size, side, MATCH.amm.spreadMult);
      const code = codeFor(selected);

      if (side === "buy") {
        if (q.cost > free) {
          const msg = `Not enough credits · needs ${fmtCR(q.cost)}, you have ${fmtCR(free)}.`;
          toast.error(msg);
          return { ok: false, error: msg };
        }
        setFree((f) => f - q.cost);
        setPositions((prev) => {
          const i = prev.findIndex((p) => p.outcome === selected);
          if (i < 0) return [...prev, { marketId: MATCH.matchId, code, vs: vsFor(selected), outcome: selected, shares: size, avgEntry: q.avgPx, pnl: null, live: true }];
          const p = prev[i];
          const shares = p.shares + size;
          const avgEntry = (p.shares * p.avgEntry + size * q.avgPx) / shares;
          return prev.map((x, idx) => (idx === i ? { ...x, shares, avgEntry } : x));
        });
        return { ok: true, avgPx: q.avgPx };
      }

      // sell
      const have = heldShares[selected] ?? 0;
      if (have <= 0) { const msg = `No ${code} position to sell.`; toast.error(msg); return { ok: false, error: msg }; }
      if (size > have) { const msg = `You hold only ${have} ${code}.`; toast.error(msg); return { ok: false, error: msg }; }
      setFree((f) => f + q.cost);
      setPositions((prev) => {
        const i = prev.findIndex((p) => p.outcome === selected);
        const p = prev[i];
        const shares = p.shares - size;
        if (shares <= 0) return prev.filter((_, idx) => idx !== i);
        return prev.map((x, idx) => (idx === i ? { ...x, shares } : x));
      });
      return { ok: true, avgPx: q.avgPx };
    },
    [selected, free, positions], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <section ref={sectionRef} className="elev overflow-hidden rounded-card border border-hairline/70 bg-surface">
      <MatchHeader match={MATCH} live={headerLive} />
      {/* the halt strip lands directly UNDER THE SCORE · mounts on HALTED, slides itself in (Framer, isolated) */}
      {view === "HALTED" && <HaltBanner reason="Ashour's counter under review · repricing" />}
      <BigRiver
        match={MATCH}
        mark={mark}
        spark={preMatch ? [] : spark}
        homeSpark={preMatch ? [] : homeSpark}
        minute={preMatch ? 0 : minute}
        onReplay={replay}
        replayBusy={replayBusy}
        boothQuote={BOOTH_QUOTE}
        boothDelta={BOOTH_DELTA}
        pre={preMatch}
      />

      <StateSwitcher view={view} onChange={(v) => setMatchStatus(TERMINAL_MATCH_ID, v)} />

      {view === "SETTLED" ? (
        <SettledPanel
          result={SETTLED_RESULT}
          held={primary ? { code: primary.code, outcome: primary.outcome, shares: primary.shares, avgEntry: primary.avgEntry } : undefined}
        />
      ) : (
        // Trade decision (left) + the Next Goal call (right, lg+) · the game sits BESIDE the panel, stacked
        // below it on mobile. It lives OUTSIDE data-halt="dim" on purpose: its win burst must stay bright
        // when the halt dims the trade area around it.
        <div className="lg:flex lg:items-stretch">
          <div className="min-w-0 lg:flex-1">
            {/* the trade area · dims to 0.55 while the market is halted (GSAP drives opacity on this hook) */}
            <div data-halt="dim">
              <PriceCells
                mark={mark}
                todayDelta={todayDelta}
                codes={{ H: MATCH.homeCode, A: MATCH.awayCode }}
                selected={selected}
                onSelect={setSelected}
                heldShares={heldShares}
                disabled={view === "PRE"}
                frozen={view === "HALTED"}
              />
              {(view === "LIVE" || view === "HALTED") && (
                <>
                  {/* the Buy/Sell panel stays mounted but DISABLES (greyed + inert) during the halt, then re-enables */}
                  <div className="hidden lg:block">
                    <TradePanel amm={MATCH.amm} selected={selected} code={codeFor(selected)} markPx={mark[selected] * 100} free={free} heldShares={heldShares[selected] ?? 0} onPlace={placeOrder} disabled={view === "HALTED"} />
                  </div>
                  <div className="border-b border-hairline p-3 lg:hidden">
                    <button
                      type="button"
                      onClick={() => setSheetOpen(true)}
                      disabled={view === "HALTED"}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-up px-4 text-strong font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {view === "HALTED" ? "Trading paused" : `Trade ${codeFor(selected)} @ ${(mark[selected] * 100).toFixed(1)}`}
                    </button>
                  </div>
                  <TradeSheet open={sheetOpen} onOpenChange={setSheetOpen} title={`Trade · ${MATCH.home} v ${MATCH.away}`}>
                    <TradePanel amm={MATCH.amm} selected={selected} code={codeFor(selected)} markPx={mark[selected] * 100} free={free} heldShares={heldShares[selected] ?? 0} onPlace={placeOrder} disabled={view === "HALTED"} />
                  </TradeSheet>
                </>
              )}
              {/* PRE-MATCH · the ticket is present but DISABLED with a stated reason, so the surface reads
                  "the market is here, it just hasn't opened" rather than an absent or broken panel. */}
              {preMatch && (
                <>
                  <div className="hidden lg:block">
                    <TradePanel amm={MATCH.amm} selected={selected} code={codeFor(selected)} markPx={mark[selected] * 100} free={free} heldShares={heldShares[selected] ?? 0} onPlace={placeOrder} disabled disabledReason="Trading opens at kickoff" />
                  </div>
                  <div className="border-b border-hairline p-3 lg:hidden">
                    <button
                      type="button"
                      disabled
                      className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-up px-4 text-strong font-semibold text-bg opacity-50"
                    >
                      Trading opens at kickoff
                    </button>
                  </div>
                </>
              )}
            </div>
            {preMatch && <PreMatchPanel kickoff={KICKOFF} />}
            {primary && (view === "LIVE" || view === "HALTED") && (
              <YourPosition code={primary.code} shares={primary.shares} avgEntry={primary.avgEntry} markPct={mark[primary.outcome] * 100} opened={primary.pre ? "opened pre-match" : "opened in-play"} />
            )}
          </div>
          {(view === "LIVE" || view === "HALTED") && (
            <aside aria-label="Next Goal · call the next scorer" className="border-t border-hairline p-3 lg:w-[340px] lg:shrink-0 lg:border-l lg:border-t-0">
              <NextGoal nobody resolveWindowMs={TERMINAL_RESOLVE_WINDOW_MS} onLock={NOOP} onReset={NOOP} />
            </aside>
          )}
        </div>
      )}
      <MatchTabs positions={positions} mark={mark} />
    </section>
  );
}
