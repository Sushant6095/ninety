"use client";
// The loop — the five beats as a pinned two-column reveal (godui sticky-scroll, re-skinned to
// tokens): scrolling the list steps the synced visual panel through each stage. The copy is the
// original five-beat content; the visual is the beat's icon + index at display scale.
import { DoorOpen, TrendingUp, TriangleAlert, ShieldCheck, RefreshCw, type LucideIcon } from "lucide-react";
import { StickyScroll } from "../../../components/vendor/godui/sticky-scroll";
import { Section } from "./Section";

type Accent = "up" | "halt" | "chain";

const BEATS: { icon: LucideIcon; title: string; body: string; accent?: Accent }[] = [
  { icon: DoorOpen, title: "Market opens", body: "At kickoff each outcome (Home, Draw, Away) gets a live 0–100 price." },
  { icon: TrendingUp, title: "Trade the moment", body: "Buy the side you think the market has wrong. Sell any time before full time." },
  { icon: TriangleAlert, title: "A goal halts & reprices", body: "The Booth calls it, trading pauses for the review, then prices snap to the new reality.", accent: "halt" },
  { icon: ShieldCheck, title: "Full time settles on Solana", body: "The result is proved on-chain from a TxLINE proof. Winning shares pay 100 credits.", accent: "chain" },
  { icon: RefreshCw, title: "The season loops", body: "Your P&L rolls up the leaderboard, big swings mint as Moments, and the next match opens." },
];

const ACCENT: Record<Accent, { ring: string; text: string }> = {
  up: { ring: "bg-up/10 text-up ring-up/40", text: "text-up" },
  halt: { ring: "bg-halt/10 text-halt ring-halt/40", text: "text-halt" },
  chain: { ring: "bg-chain/10 text-chain ring-chain/40", text: "text-chain" },
};

/** The pinned panel's visual for one beat — the icon at display scale over its index. */
function BeatVisual({ icon: Icon, index, accent = "up" }: { icon: LucideIcon; index: number; accent?: Accent }) {
  const a = ACCENT[accent];
  return (
    <div className="flex flex-col items-center gap-4">
      <span className={`grid h-24 w-24 place-items-center rounded-chip ring-1 ring-inset ${a.ring}`}>
        <Icon className="h-11 w-11" aria-hidden strokeWidth={1.75} />
      </span>
      <span className="num text-label font-semibold uppercase tracking-caps text-lo">
        Beat <span className={a.text}>0{index + 1}</span> / 05
      </span>
    </div>
  );
}

export function TheLoop() {
  return (
    <Section eyebrow="The loop" title="One match, five beats." lede="From kickoff to settlement, this is the whole rhythm, the same loop every match, all season. Scroll the beats.">
      <StickyScroll
        aria-label="The five beats of a match, from market open to settlement"
        items={BEATS.map((b, i) => ({
          title: b.title,
          description: b.body,
          content: <BeatVisual icon={b.icon} index={i} accent={b.accent} />,
        }))}
      />
    </Section>
  );
}
