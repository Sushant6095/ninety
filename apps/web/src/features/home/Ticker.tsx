"use client";
import Link from "next/link";
import { routes } from "../../lib/routes";
import { TICKER, type TickerItem } from "../../lib/fixtures";
import { LivePrice } from "../../components/ui/LivePrice";
import { useMatchLive } from "../live/matchLiveStore";

/** One ticker cell — minute, score and price read from the ONE store; code/lead/kick-off label are seed identity. */
function TickerCell({ item }: { item: TickerItem }) {
  const live = useMatchLive(item.matchId);
  const minute = live?.minute ?? item.minute;
  const score = live?.score ?? null;
  const scoreText = score ? `${score.home}–${score.away}` : item.score;
  const price = live ? live.prices.H * 100 : item.price; // home-win % — matches the seed ticker price
  const halted = live?.status === "HALTED";

  return (
    <Link
      href={routes.match(item.matchId)}
      className="group flex shrink-0 items-center gap-2 border-r border-hairline px-3 py-2 transition-colors duration-200 hover:bg-surface"
    >
      {minute != null ? (
        <span className={`num text-label font-semibold ${halted ? "text-halt" : "text-up"}`}>{minute}&#39;</span>
      ) : (
        <span className="num text-label text-lo">{item.time ?? "—"}</span>
      )}
      <span className="text-label font-medium text-hi/90">{item.code}</span>
      {scoreText && <span className="num text-label text-hi">{scoreText}</span>}
      <span className="num text-label text-lo">{item.lead}</span>
      <LivePrice value={price} className="text-label font-medium text-hi" />
    </Link>
  );
}

/** The top live-match ticker — a calm, mono strip. In-play prices drift + flash off the store; each item links out. */
export function Ticker() {
  return (
    <div className="border-b border-hairline bg-bg">
      <div className="flex items-stretch gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex shrink-0 items-center gap-1 border-r border-hairline px-3 py-2 text-label font-semibold tracking-[0.14em] text-lo">
          <span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_5px_var(--up)]" />
          WC26 LIVE
        </div>
        {TICKER.map((t) => (
          <TickerCell key={t.matchId} item={t} />
        ))}
      </div>
    </div>
  );
}
