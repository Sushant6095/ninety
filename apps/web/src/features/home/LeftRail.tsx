import Link from "next/link";
import { RailCard } from "../../components/ui/RailCard";
import { routes } from "../../lib/routes";
import { MARKETS } from "../../lib/fixtures";

const STAGES = [
  { name: "Round of 16", sub: "Live now · Jul 4–6", count: 8, live: true },
  { name: "Quarter-finals", sub: "Jul 9–11", count: 4, live: false },
  { name: "Semi-finals", sub: "Jul 14–15", count: 2, live: false },
  { name: "Final", sub: "Jul 19 · MetLife", count: 1, live: false },
  { name: "Round of 32", sub: "Settled · proofs posted", count: 16, live: false },
  { name: "Group stage", sub: "Settled · Jun 11–27", count: 72, live: false },
];

const FOLLOWED = [
  { name: "Canada", flag: "🇨🇦", state: "LIVE", live: true },
  { name: "United States", flag: "🇺🇸", state: "22:00", live: false },
  { name: "Mexico", flag: "🇲🇽", state: "LIVE", live: true },
  { name: "Morocco", flag: "🇲🇦", state: "LIVE", live: true },
];

export function LeftRail() {
  return (
    <aside className="flex w-full flex-col gap-3">
      <RailCard label="My matches">
        <ul>
          {MARKETS.filter((m) => m.favourite).map((m) => (
            <li key={m.matchId}>
              <Link
                href={routes.match(m.matchId)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-hairline/30"
              >
                <span className="text-up">★</span>
                <span className="text-[13px] font-medium text-hi">{m.homeCode} – {m.awayCode}</span>
                <span className="num ml-auto text-[11px] text-up">{m.minute}&#39;</span>
                <span className="num text-[12px] font-medium text-hi">{m.score?.home}-{m.score?.away}</span>
              </Link>
            </li>
          ))}
        </ul>
      </RailCard>

      <RailCard label="World Cup 2026 — stages">
        <ul>
          {STAGES.map((s) => (
            <li key={s.name}>
              <Link href={routes.competition} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-hairline/30">
                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${s.live ? "bg-up shadow-[0_0_5px_var(--up)]" : "bg-hairline"}`} />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-hi">{s.name}</span>
                  <span className="block text-[10.5px] text-lo">{s.sub}</span>
                </span>
                <span className="num ml-auto text-[11px] text-lo">{s.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </RailCard>

      <RailCard label="Followed teams">
        <ul>
          {FOLLOWED.map((t) => (
            <li key={t.name}>
              <Link href={routes.competition} className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-hairline/30">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-bg text-[13px] ring-1 ring-inset ring-hairline">{t.flag}</span>
                <span className="text-[13px] font-medium text-hi">{t.name}</span>
                <span className={`num ml-auto text-[10px] font-semibold tracking-wide ${t.live ? "text-up" : "text-lo"}`}>{t.state}</span>
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
    <section className="rounded-card border border-chain/25 bg-chain/[0.04] px-4 py-3.5">
      <h2 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-chain">
        <span className="text-chain">◆</span> Settlement — Solana
      </h2>
      <dl className="num space-y-1 text-[11px] leading-relaxed text-lo">
        <div>devnet · slot <span className="text-hi">297,441,208</span></div>
        <div className="flex items-center gap-1.5">
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
      </dl>
    </section>
  );
}
