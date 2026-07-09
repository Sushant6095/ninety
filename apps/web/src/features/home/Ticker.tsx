"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "../../lib/routes";
import { TICKER } from "../../lib/fixtures";
import { LivePrice } from "./LiveMarkets";

const clampPrice = (p: number): number => Math.max(5, Math.min(95, Math.round(p * 10) / 10));

/** The top live-match ticker — a calm, mono strip. In-play prices drift + flash each tick; each item links out. */
export function Ticker() {
  const [prices, setPrices] = useState<number[]>(() => TICKER.map((t) => t.price));

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setPrices((prev) => prev.map((p, i) => (TICKER[i].minute == null ? p : clampPrice(p + (Math.random() - 0.5) * 1.1))));
    }, 2100);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="border-b border-hairline bg-bg">
      <div className="flex items-stretch gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex shrink-0 items-center gap-1.5 border-r border-hairline px-3 py-2 text-[10px] font-semibold tracking-[0.14em] text-lo">
          <span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_5px_var(--up)]" />
          WC26 LIVE
        </div>
        {TICKER.map((t, i) => (
          <Link
            key={t.matchId}
            href={routes.match(t.matchId)}
            className="group flex shrink-0 items-center gap-2 border-r border-hairline px-3 py-2 transition-colors duration-200 hover:bg-surface"
          >
            {t.minute != null ? (
              <span className="num text-[11px] font-semibold text-up">{t.minute}&#39;</span>
            ) : (
              <span className="num text-[11px] text-lo">{t.time ?? "—"}</span>
            )}
            <span className="text-[11px] font-medium text-hi/90">{t.code}</span>
            {t.score && <span className="num text-[11px] text-hi">{t.score}</span>}
            <span className="num text-[11px] text-lo">{t.lead}</span>
            <LivePrice value={prices[i]} className="text-[11px] font-medium text-hi" />
          </Link>
        ))}
      </div>
    </div>
  );
}
