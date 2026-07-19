"use client";
import { useState } from "react";
import Link from "next/link";
import { TerminalHeader } from "../terminal/TerminalHeader";
import { Footer } from "../home/Footer";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { useSession } from "../session/SessionProvider";
import { routes } from "../../lib/routes";
import { FILLS, type Fill } from "../../lib/portfolio";
import { fmtCR, fmtPrice, signedCR } from "../../lib/format";

type FilterKey = "all" | "buys" | "sells" | "settled";
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "buys", label: "Buys" },
  { key: "sells", label: "Sells" },
  { key: "settled", label: "Settled" },
];
const match = (f: Fill, k: FilterKey): boolean =>
  k === "all" ? true : k === "buys" ? f.side === "buy" : k === "sells" ? f.side === "sell" : f.status === "SETTLED";

function FillRow({ f }: { f: Fill }) {
  const settled = f.status === "SETTLED";
  const gain = (f.pnl ?? 0) >= 0;
  return (
    <li>
      <Link
        href={routes.match(f.matchId)}
        className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 outline-none transition-colors duration-200 hover:bg-hairline/25 focus-visible:bg-hairline/25"
      >
        <span className="relative inline-flex shrink-0 items-center" style={{ width: 34, height: 22 }} aria-hidden>
          <span className="absolute left-0"><TeamCrest code={f.homeCode} size={22} /></span>
          <span className="absolute left-[13px] rounded-full ring-2 ring-surface"><TeamCrest code={f.awayCode} size={22} /></span>
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`rounded-chip px-2 py-0.5 text-label font-semibold uppercase tracking-wide ring-1 ring-inset ${f.side === "buy" ? "text-hi ring-hairline" : "text-lo ring-hairline"}`}>
              {f.side}
            </span>
            <span className="num text-strong font-medium tabular-nums text-hi">{f.shares} {f.pick}</span>
            <span className="num text-caption tabular-nums text-lo">@ {fmtPrice(f.price)}</span>
          </span>
          <span className="num mt-1 block text-caption tabular-nums text-lo">{f.homeCode} v {f.awayCode} · {f.ts}</span>
        </span>
        <span className="text-right">
          <span className="num block text-strong font-semibold tabular-nums text-hi">{fmtCR(f.credits)}</span>
          {settled ? (
            <span className={`num mt-1 block text-caption font-medium tabular-nums ${gain ? "text-up" : "text-down"}`}>{signedCR(f.pnl ?? 0)}</span>
          ) : (
            <span className="mt-1 block text-label font-medium uppercase tracking-wide text-lo">open</span>
          )}
        </span>
      </Link>
    </li>
  );
}

export function HistoryPage() {
  // A fresh session has no fills — honest empty, never a fabricated trade history. Fills appear once there's real
  // activity (hasActivity). The seeded FILLS stand in for a returning account.
  const { hasActivity } = useSession();
  const fills = hasActivity ? FILLS : [];
  const [filter, setFilter] = useState<FilterKey>("all");
  const rows = fills.filter((f) => match(f, filter));
  const realized = fills.filter((f) => f.status === "SETTLED").reduce((s, f) => s + (f.pnl ?? 0), 0);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      <TerminalHeader />
      <main className="mx-auto w-full max-w-[860px] flex-1 px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-display font-bold tracking-tight text-hi">History</h1>
            <p className="mt-1 text-body text-lo">Every fill, with the match it came from. Play money, in credits.</p>
          </div>
          <div className="text-right">
            <div className="text-label font-medium uppercase tracking-tag text-lo">Realized P&amp;L</div>
            <div className={`num text-heading font-semibold tabular-nums ${realized >= 0 ? "text-up" : "text-down"}`}>{signedCR(realized)}</div>
          </div>
        </div>

        {/* Filters */}
        <div role="tablist" aria-label="Filter fills" className="mb-3 inline-flex rounded-chip bg-surface p-1 ring-1 ring-inset ring-hairline">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.key)}
                className={`cursor-pointer rounded-chip px-3 py-1.5 text-caption font-medium transition-colors duration-200 ${
                  active ? "bg-hairline/60 text-hi" : "text-lo hover:text-hi"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <div className="grid place-items-center rounded-card border border-hairline bg-surface px-4 py-14 text-center">
            <p className="text-body text-lo">No fills in this view.</p>
            <button type="button" onClick={() => setFilter("all")} className="mt-2 cursor-pointer text-body text-up transition-opacity duration-200 hover:opacity-80">Show all →</button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-card border border-hairline bg-surface">
            <ul className="divide-y divide-hairline/60">
              {rows.map((f) => (
                <FillRow key={f.id} f={f} />
              ))}
            </ul>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
