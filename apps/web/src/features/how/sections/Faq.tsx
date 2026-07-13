"use client";
import { Accordion } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { Section } from "./Section";

const FAQS = [
  {
    q: "Is this real-money gambling?",
    a: "No. Ninety is free to play with play-money credits — there are no deposits and no cash payouts, ever. You play for rank, for Moments, and for the read on the match. Credits have no cash value.",
  },
  {
    q: "How is settlement trustless?",
    a: "When a match finishes, TxLINE produces a cryptographic proof of the result. Ninety's Anchor program verifies that proof on Solana and settles the market on-chain. There is no admin override — you can check every settlement on Solscan yourself.",
  },
  {
    q: "What is a Moment?",
    a: "A Moment is a big price swing captured as a collectible — a goal that repriced a market from 41 to 63, say. Rarity scales with the size of the swing, and minted Moments carry an on-chain signature you can share.",
  },
  {
    q: "How do leaderboards work?",
    a: "Your net play-money P&L ranks you against every trader for the tournament. Boards update live as markets settle, your row stays pinned, and movement arrows show who's climbing.",
  },
  {
    q: "What do the prices mean?",
    a: "Each price is the market's live read of an outcome, from 0 to 100 — a live probability, not a fixed line. A price of 63 means the market rates that outcome at 63%. A winning share settles at 100 credits, so buying below the true chance is the edge.",
  },
];

export function Faq() {
  return (
    <Section eyebrow="FAQ" title="The questions judges ask first.">
      <Accordion.Root type="single" collapsible className="overflow-hidden rounded-card border border-hairline bg-surface">
        {FAQS.map((f, i) => (
          <Accordion.Item key={i} value={`q${i}`} className="border-b border-hairline/60 last:border-b-0">
            <Accordion.Header>
              <Accordion.Trigger className="group flex w-full items-center justify-between gap-3 px-5 py-4 text-left outline-none transition-colors duration-200 hover:bg-hairline/15 focus-visible:bg-hairline/15">
                <span className="text-strong font-medium text-hi">{f.q}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-lo transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden strokeWidth={2} />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="acc-content overflow-hidden">
              <p className="max-w-[70ch] px-5 pb-4 text-body leading-relaxed text-lo">{f.a}</p>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </Section>
  );
}
