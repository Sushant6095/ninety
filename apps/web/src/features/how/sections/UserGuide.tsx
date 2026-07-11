import { Gift, ListFilter, Waves, ArrowLeftRight, TriangleAlert, Trophy } from "lucide-react";
import { Section } from "./Section";

const STEPS = [
  { icon: Gift, title: "Claim your 1,000 credits", body: "Sign up in one step — no card, no deposit. You get 1,000 play-money credits to trade with. That's your whole bankroll; it's free and it's not real money." },
  { icon: ListFilter, title: "Pick a live match", body: "Open the board and tap a match that's in play. You land on the trading screen with the live score, the Momentum River, and three prices: Home, Draw, Away." },
  { icon: Waves, title: "Read the River", body: "The River is the market's live read of who wins, 0–100. Rising green = that outcome is getting more likely. A goal shows as a cliff. It's the story of the match, priced." },
  { icon: ArrowLeftRight, title: "Buy the side you believe", body: "Think the price is wrong? Buy Home, Draw, or Away. The cost is shown before you confirm; a winning share settles at 100 credits. Sell any time to lock in a move." },
  { icon: TriangleAlert, title: "Watch a goal halt & reprice", body: "When a goal lands, trading pauses for a beat, the Booth explains it, and the price snaps to the new reality. Good reads before the crowd are where the P&L is.", accent: "halt" as const },
  { icon: Trophy, title: "Full time — winners paid", body: "At the whistle the market settles on Solana. Every winning share pays 100 credits, your P&L rolls up the leaderboard, and your biggest swing can mint as a Moment.", accent: "chain" as const },
];

const ACCENT = { up: "bg-up/10 text-up ring-up/40", halt: "bg-halt/10 text-halt ring-halt/40", chain: "bg-chain/10 text-chain ring-chain/40" } as const;

export function UserGuide() {
  return (
    <Section eyebrow="How to trade" title="Six steps from free credits to your first settled market." lede="No jargon. If you can read a scoreboard, you can trade the match.">
      <ol className="grid gap-4 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.title} className="elev flex gap-4 rounded-card border border-hairline bg-surface p-5">
            <div className="flex shrink-0 flex-col items-center gap-2">
              <span className={`grid h-10 w-10 place-items-center rounded-full ring-1 ring-inset ${ACCENT[s.accent ?? "up"]}`}>
                <s.icon className="h-5 w-5" aria-hidden strokeWidth={2} />
              </span>
              <span className="num text-label font-semibold tabular-nums text-lo">{i + 1}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-strong font-semibold text-hi">{s.title}</h3>
              <p className="mt-1.5 text-caption leading-relaxed text-lo">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
