"use client";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { routes } from "../../lib/routes";
import { TICKER, type TickerItem } from "../../lib/fixtures";
import { LivePrice } from "../../components/ui/LivePrice";
import { Marquee } from "../../components/vendor/magicui/marquee";
import { useMatchLive } from "../live/matchLiveStore";

/** One ticker cell — minute, score and price read from the ONE store; code/lead/kick-off label are seed identity. */
function TickerCell({ item }: { item: TickerItem }) {
  const live = useMatchLive(item.matchId);
  const minute = live?.minute ?? item.minute;
  const score = live?.score ?? null;
  const scoreText = score ? `${score.home}–${score.away}` : item.score;
  // The lead outcome re-derives from LIVE prices: after a reprice the ticker must quote the side that now
  // leads, not the side that led at kickoff (a static lead is how 0–1 gets quoted as "H").
  const p = live?.prices;
  const lead = p ? ((["H", "D", "A"] as const).reduce((a, b) => (p[b] > p[a] ? b : a)) as TickerItem["lead"]) : item.lead;
  const price = p ? p[lead] * 100 : item.price;
  const halted = live?.status === "HALTED";

  return (
    <Link
      href={routes.match(item.matchId)}
      className="group flex shrink-0 items-center gap-2 border-r border-hairline px-3 py-2 transition-colors duration-200 hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
    >
      {minute != null ? (
        <span className={`num text-label font-semibold ${halted ? "text-halt" : "text-up"}`}>{minute}&#39;</span>
      ) : (
        <span className="num text-label text-lo">{item.time ?? "—"}</span>
      )}
      <span className="text-label font-medium text-hi/90">{item.code}</span>
      {scoreText && <span className="num text-label text-hi">{scoreText}</span>}
      <span className="num text-label text-lo">{lead}</span>
      <LivePrice value={price} className="text-label font-medium text-hi" />
    </Link>
  );
}

/** The top live-match ticker — a calm mono strip on the magicui marquee (re-skinned): a slow 60s loop,
 *  paused on hover, hairline-separated cells. Every cell keeps its LivePrice, so the 180ms tick-flash law
 *  is intact inside the loop. prefers-reduced-motion drops the loop entirely for a static scrollable row. */
export function Ticker() {
  const reduce = useReducedMotion();
  const cells = TICKER.map((t) => <TickerCell key={t.matchId} item={t} />);
  return (
    <aside aria-label="Live match prices" className="border-b border-hairline bg-bg">
      <div className="flex items-stretch">
        <div className="flex shrink-0 items-center gap-1 border-r border-hairline px-3 py-2 text-label font-semibold tracking-caps text-lo">
          <span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_5px_var(--up)]" />
          WC26 LIVE
        </div>
        {reduce ? (
          <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {cells}
          </div>
        ) : (
          <Marquee pauseOnHover repeat={3} className="min-w-0 flex-1 [--marquee-duration:60s] [--marquee-gap:0px]">
            {cells}
          </Marquee>
        )}
      </div>
    </aside>
  );
}
