import { DoorOpen, TrendingUp, TriangleAlert, ShieldCheck, RefreshCw } from "lucide-react";
import { Section } from "./Section";

const BEATS = [
  { icon: DoorOpen, title: "Market opens", body: "At kickoff each outcome — Home, Draw, Away — gets a live 0–100 price." },
  { icon: TrendingUp, title: "Trade the moment", body: "Buy the side you think the market has wrong. Sell any time before full time." },
  { icon: TriangleAlert, title: "A goal halts & reprices", body: "The Booth calls it, trading pauses for the review, then prices snap to the new reality.", accent: "halt" as const },
  { icon: ShieldCheck, title: "Full time settles on Solana", body: "The result is proved on-chain from a TxLINE proof. Winning shares pay 100 credits.", accent: "chain" as const },
  { icon: RefreshCw, title: "The season loops", body: "Your P&L rolls up the leaderboard, big swings mint as Moments, and the next match opens." },
];

const ACCENT = {
  up: "bg-up/10 text-up ring-up/40",
  halt: "bg-halt/10 text-halt ring-halt/40",
  chain: "bg-chain/10 text-chain ring-chain/40",
} as const;

export function TheLoop() {
  return (
    <Section eyebrow="The loop" title="One match, five beats." lede="From kickoff to settlement, this is the whole rhythm — the same loop every match, all season.">
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {BEATS.map((b, i) => (
          <li key={b.title} className="elev flex flex-col rounded-card border border-hairline bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className={`grid h-10 w-10 place-items-center rounded-full ring-1 ring-inset ${ACCENT[b.accent ?? "up"]}`}>
                <b.icon className="h-5 w-5" aria-hidden strokeWidth={2} />
              </span>
              <span className="num text-label font-semibold tabular-nums text-lo">0{i + 1}</span>
            </div>
            <h3 className="mt-4 text-strong font-semibold text-hi">{b.title}</h3>
            <p className="mt-1.5 text-caption leading-relaxed text-lo">{b.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
