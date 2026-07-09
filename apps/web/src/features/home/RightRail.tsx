import Link from "next/link";
import { RailCard } from "../../components/ui/RailCard";
import { FeaturedPanel } from "./FeaturedPanel";
import { routes } from "../../lib/routes";
import { LEADERS, MARKETS } from "../../lib/fixtures";

const fmtPnl = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString("en-US");

const STARTING = [
  { code: "ENG – SEN", venue: "R16 · Foxborough", inLabel: "in 1h 40m", matchId: "wc26-eng-sen" },
  { code: "GER – COL", venue: "R16 · Houston", inLabel: "in 4h 40m", matchId: "wc26-ger-col" },
  { code: "BRA – USA", venue: "R16 · Los Angeles", inLabel: "in 7h 40m", matchId: "wc26-bra-usa" },
];

export function RightRail() {
  return (
    <aside className="flex w-full flex-col gap-3">
      <FeaturedPanel market={MARKETS[0]} />

      <RailCard
        label="Top traders today"
        action={<Link href={routes.leaders} className="text-[11px] text-lo transition-colors duration-200 hover:text-hi">All →</Link>}
      >
        <ul>
          {LEADERS.map((l) => (
            <li key={l.handle}>
              <Link href={routes.profile(l.handle)} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-hairline/30">
                <span className="num w-3 text-[11px] text-lo">{l.rank}</span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-bg text-[10px] font-semibold text-lo ring-1 ring-inset ring-hairline">
                  {l.handle.replace(/^@/, "").slice(0, 2).toUpperCase()}
                </span>
                <span className="text-[13px] font-medium text-hi">{l.handle}</span>
                <span className="num ml-auto text-[12px] font-medium text-up">{fmtPnl(l.pnl)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </RailCard>

      <RailCard label="Starting soon">
        <ul>
          {STARTING.map((s) => (
            <li key={s.matchId}>
              <Link href={routes.match(s.matchId)} className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-hairline/30">
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-hi">{s.code}</span>
                  <span className="block text-[10.5px] text-lo">{s.venue}</span>
                </span>
                <span className="num ml-auto text-[11px] text-lo">{s.inLabel}</span>
              </Link>
            </li>
          ))}
        </ul>
      </RailCard>

      <Link
        href={routes.moments}
        className="group rounded-card border border-chain/25 bg-chain/[0.04] px-4 py-3.5 transition-colors duration-200 hover:border-chain/40"
      >
        <h2 className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-chain">
          <span aria-hidden>◆</span> Moment of the day
        </h2>
        <p className="font-display text-[17px] font-bold leading-tight text-hi">The 38th minute</p>
        <p className="num mt-1 text-[11px] text-lo">
          CAN–MAR · David repricing <span className="text-up">41 → 63</span> · minted by @hexfan
        </p>
      </Link>
    </aside>
  );
}
