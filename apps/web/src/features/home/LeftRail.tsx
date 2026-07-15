"use client";
import Link from "next/link";
import { RailCard } from "../../components/ui/RailCard";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { routes } from "../../lib/routes";
import { MARKETS } from "../../lib/fixtures";
import { useMatchLive } from "../live/matchLiveStore";
import type { MarketRow } from "../../lib/types";

/** A followed-match row — identity from the seed, minute/score from the ONE store. */
function MyMatchRow({ market }: { market: MarketRow }) {
  const live = useMatchLive(market.matchId);
  const minute = live?.minute ?? market.minute;
  const score = live?.score ?? market.score;
  const halted = live?.status === "HALTED";
  return (
    <li>
      <Link
        href={routes.match(market.matchId)}
        className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-hairline/30"
      >
        <span className="text-up">★</span>
        <span className="text-body font-medium text-hi">{market.homeCode} – {market.awayCode}</span>
        {minute != null && <span className={`num ml-auto text-label ${halted ? "text-halt" : "text-up"}`}>{minute}&#39;</span>}
        {score && <span className={`num text-caption font-medium text-hi ${minute == null ? "ml-auto" : ""}`}>{score.home}-{score.away}</span>}
      </Link>
    </li>
  );
}

const STAGES = [
  { name: "Round of 16", sub: "Live now · Jul 4–6", count: 16, live: true },
  { name: "Quarter-finals", sub: "Jul 9–11", count: 4, live: false },
  { name: "Semi-finals", sub: "Jul 14–15", count: 2, live: false },
  { name: "Final", sub: "Jul 19 · MetLife", count: 1, live: false },
  { name: "Round of 32", sub: "Settled · proofs posted", count: 16, live: false },
  { name: "Group stage", sub: "Settled · Jun 11–27", count: 72, live: false },
];

const FOLLOWED = [
  { name: "Canada", code: "CAN", state: "LIVE", live: true },
  { name: "United States", code: "USA", state: "LIVE", live: true },
  { name: "Mexico", code: "MEX", state: "LIVE", live: true },
  { name: "Morocco", code: "MAR", state: "LIVE", live: true },
];

export function LeftRail() {
  return (
    <aside aria-label="Your matches and standings" className="flex w-full flex-col gap-3">
      <RailCard label="My matches">
        <ul>
          {MARKETS.filter((m) => m.favourite).map((m) => (
            <MyMatchRow key={m.matchId} market={m} />
          ))}
        </ul>
      </RailCard>

      <RailCard label="World Cup 2026 — stages">
        <ul>
          {STAGES.map((s) => (
            <li key={s.name}>
              <Link href={routes.competition} className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-1 transition-colors duration-200 hover:bg-hairline/30">
                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${s.live ? "bg-up shadow-[0_0_5px_var(--up)]" : "bg-hairline"}`} />
                <span className="min-w-0">
                  <span className="block text-body font-medium text-hi">{s.name}</span>
                  <span className="block text-label text-lo">{s.sub}</span>
                </span>
                <span className="num ml-auto text-label text-lo">{s.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </RailCard>

      <RailCard label="Followed teams">
        <ul>
          {FOLLOWED.map((t) => (
            <li key={t.name}>
              <Link href={routes.competition} className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-hairline/30">
                <TeamCrest code={t.code} size={22} />
                <span className="text-body font-medium text-hi">{t.name}</span>
                <span className={`num ml-auto text-label font-semibold tracking-wide ${t.live ? "text-up" : "text-lo"}`}>{t.state}</span>
              </Link>
            </li>
          ))}
        </ul>
      </RailCard>

      <SettlementPanel />
    </aside>
  );
}

/** Chain surface (violet, --chain) — read-only Solana settlement status. */
function SettlementPanel() {
  return (
    <section className="rounded-card border border-chain/25 bg-chain/[0.04] px-4 py-3">
      <h2 className="mb-2 flex items-center gap-1 text-label font-semibold uppercase tracking-label text-chain">
        <span className="text-chain">◆</span> Settlement — Solana
      </h2>
      <div className="num space-y-1 text-label leading-relaxed text-lo">
        <div>devnet · slot <span className="text-hi">297,441,208</span></div>
        <div className="flex items-center gap-1">
          last proof
          <a
            href="https://solscan.io/?cluster=devnet"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-chain underline-offset-2 transition-colors duration-200 hover:underline"
          >
            JPN–CRO · 5Kx…9f2a
            <span aria-hidden>↗</span>
          </a>
        </div>
        <div>feed latency <span className="text-hi">42 ms</span></div>
      </div>
    </section>
  );
}
