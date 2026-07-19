"use client";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, Gift, Check } from "lucide-react";
import { ProofBadge } from "../../components/ui/ProofBadge";
import { routes } from "../../lib/routes";
import { fmtCR, signedCR, fmtPrice } from "../../lib/format";
import type { Outcome } from "../../lib/types";

export type MatchView = "PRE" | "LIVE" | "HALTED" | "SETTLED";
const VIEWS: MatchView[] = ["PRE", "LIVE", "HALTED", "SETTLED"];

// Stands in for the market-status frame: switching it drives the whole surface. In production the status
// arrives on m:{match}:prices; here it's selectable so all four states are reachable and screenshot-able.
export function StateSwitcher({ view, onChange }: { view: MatchView; onChange: (v: MatchView) => void }) {
  return (
    <div className="flex items-center gap-2 border-b border-hairline px-4 py-2">
      <span className="text-label font-semibold uppercase tracking-label text-lo">Market state</span>
      <div role="tablist" aria-label="Market state" className="ml-auto inline-flex rounded-chip bg-bg p-0.5 ring-1 ring-inset ring-hairline">
        {VIEWS.map((v) => {
          const on = v === view;
          return (
            <button
              key={v}
              role="tab"
              aria-selected={on}
              onClick={() => onChange(v)}
              className={`hit cursor-pointer rounded-chip px-2.5 py-1 text-label font-semibold uppercase tracking-wide outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-up ${on ? "bg-hairline/60 text-hi" : "text-lo hover:text-hi"}`}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** PRE · countdown, opening prices note, claim CTA (a cold user's first credits before kickoff). */
export function PreMatchPanel({ kickoff }: { kickoff: string }) {
  const [claimed, setClaimed] = useState(false);
  return (
    <div className="border-b border-hairline px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-label font-semibold uppercase tracking-label text-lo">Kicks off in</div>
          <div className="num mt-1 font-display text-display font-bold tabular-nums text-hi">{kickoff}</div>
        </div>
        <p className="max-w-[240px] text-caption leading-relaxed text-lo">Opening prices are live now · the market goes hot at kickoff. Buy early or wait for the whistle.</p>
      </div>
      {!claimed ? (
        <button
          type="button"
          onClick={() => setClaimed(true)}
          className="mt-4 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-up px-4 text-strong font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:opacity-90 active:opacity-80"
        >
          <Gift className="h-4 w-4" aria-hidden strokeWidth={2} /> Claim 1,000 credits
        </button>
      ) : (
        <div className="mt-4 inline-flex items-center gap-2 text-caption font-medium text-up"><Check className="h-4 w-4" aria-hidden strokeWidth={2.5} /> 1,000 credits added · you&#39;re ready for kickoff.</div>
      )}
    </div>
  );
}

/** HALTED · booth callout under the amber banner while trading is paused. */
export function HaltCallout({ reason }: { reason: string }) {
  return (
    <div className="border-b border-hairline px-4 py-3">
      <div className="text-label font-semibold uppercase tracking-label text-halt">The booth</div>
      <p className="mt-1 text-body leading-relaxed text-hi/90">{reason}</p>
    </div>
  );
}

interface SettledResult {
  winner: Outcome;
  winnerName: string;
  scoreLine: string;
  settleSig: string;
}
interface SettledHeld {
  code: string;
  outcome: Outcome;
  shares: number;
  avgEntry: number;
}

/** SETTLED · final result, on-chain proof, your P&L recap, and mint/claim CTAs. */
export function SettledPanel({ result, held }: { result: SettledResult; held?: SettledHeld }) {
  const [claimed, setClaimed] = useState(false);
  const won = held ? held.outcome === result.winner : false;
  const settlePx = won ? 100 : 0;
  const realized = held ? held.shares * (settlePx - held.avgEntry) : 0;

  return (
    <div className="border-b border-hairline">
      {/* result */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <div className="text-label font-semibold uppercase tracking-label text-lo">Full time</div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="num font-display text-display font-bold tabular-nums text-hi">{result.scoreLine}</span>
            <span className="text-strong font-semibold text-up">{result.winnerName} win</span>
          </div>
        </div>
        <ProofBadge sig={result.settleSig} label="Settled on-chain" />
      </div>

      {/* PnL recap */}
      {held && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3">
          <div>
            <div className="text-label font-semibold uppercase tracking-label text-lo">Your position</div>
            <div className="num mt-1 text-caption tabular-nums text-lo">{held.shares} {held.code} · avg {fmtPrice(held.avgEntry)} → settled {settlePx}</div>
          </div>
          <div className={`num text-heading font-semibold tabular-nums ${realized >= 0 ? "text-up" : "text-down"}`}>{signedCR(realized)}</div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap gap-3 px-4 py-4">
        {won && (
          <button
            type="button"
            onClick={() => setClaimed(true)}
            disabled={claimed}
            className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-up px-4 text-strong font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:opacity-90 disabled:cursor-default disabled:opacity-70"
          >
            {claimed ? <><Check className="h-4 w-4" aria-hidden strokeWidth={2.5} /> {fmtCR(held ? held.shares * 100 : 0)} credits claimed</> : <>Claim {fmtCR(held ? held.shares * 100 : 0)} credits</>}
          </button>
        )}
        <Link
          href={routes.moments}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-surface px-4 text-strong font-medium text-chain ring-1 ring-inset ring-chain/40 outline-none transition-colors duration-200 hover:bg-chain/10 focus-visible:bg-chain/10"
        >
          <Sparkles className="h-4 w-4" aria-hidden strokeWidth={2} /> Mint this moment
        </Link>
      </div>
    </div>
  );
}
