// Moments fixtures — a Moment is a captured price swing on the River (a goal/red that repriced a market).
// Shaped like GET /moments + GET /moments/:id + GET /profile/:handle (moments shelf). SCREEN-DATA-MAP: mint
// sig is the ONLY chain surface (violet) and is nullable — "mintless mode" when moments aren't minted.
import type { Outcome } from "./types";

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";

export interface Moment {
  id: string;
  matchId: string;
  homeCode: string;
  awayCode: string;
  title: string; // "Ashour's counter"
  outcome: Outcome; // which outcome repriced
  pick: string; // team code / "DRAW"
  minute: number;
  fromPrice: number; // 0..100 before
  toPrice: number; // 0..100 after
  owner: string; // @handle who captured it
  ts: string; // "4 Jul" / "today"
  mintSig: string | null; // Solana devnet mint signature (violet), null = mintless mode
  segment: number[]; // the annotated river slice (win% across the swing)
}

/** Rarity tier from swing magnitude (points). Bigger repricings are rarer. */
export const rarityOf = (m: Pick<Moment, "fromPrice" | "toPrice">): Rarity => {
  const swing = Math.abs(m.toPrice - m.fromPrice);
  return swing >= 30 ? "Legendary" : swing >= 20 ? "Epic" : swing >= 12 ? "Rare" : "Common";
};
export const swingOf = (m: Pick<Moment, "fromPrice" | "toPrice">): number => m.toPrice - m.fromPrice;

// Ring/label colour per rarity — tokens only (up/chain/hi/lo), never a raw palette. Legendary earns the violet
// chain accent because those are the minted, on-chain-proud ones.
export const RARITY_STYLE: Record<Rarity, string> = {
  Common: "text-lo ring-hairline",
  Rare: "text-hi ring-hairline",
  Epic: "text-up ring-up/40",
  Legendary: "text-chain ring-chain/50",
};

// A short win% slice around the swing minute — the annotated segment shown on the card.
const seg = (from: number, to: number): number[] => {
  const pre = [from, from + 1, from - 1, from];
  const jump = [from + (to - from) * 0.4, from + (to - from) * 0.75, to - 1, to];
  const settle = [to, to + 1, to - 0.5, to + 0.5, to];
  return [...pre, ...jump, ...settle].map((v) => Math.round(v * 10) / 10);
};

// mintSig is null across the board: minting rides the same on-chain settle path, which is fail-closed on purpose
// (ADR-036/037) — there is no real mint tx yet, so these run in "mintless mode" rather than link a fabricated
// signature. Each flips to a Solscan-verifiable ProofBadge the moment a real mint tx exists.
export const MOMENTS: Moment[] = [
  // Ashour's counter is the 74' money-shot (GOAL_MINUTE on /terminal) — the minute must match there, not read 13'.
  { id: "m-ashour-74", matchId: "wc26-aus-egy", homeCode: "AUS", awayCode: "EGY", title: "Ashour's counter", outcome: "A", pick: "EGY", minute: 74, fromPrice: 31, toPrice: 55, owner: "@pitchwizard", ts: "today", mintSig: null, segment: seg(31, 55) },
  { id: "m-david-38", matchId: "wc26-can-mar", homeCode: "CAN", awayCode: "MAR", title: "David reprices Canada", outcome: "H", pick: "CAN", minute: 38, fromPrice: 41, toPrice: 63, owner: "@hexfan", ts: "today", mintSig: null, segment: seg(41, 63) },
  { id: "m-srb-76", matchId: "wc26-srb-cmr", homeCode: "SRB", awayCode: "CMR", title: "Serbia seal it", outcome: "H", pick: "SRB", minute: 76, fromPrice: 72, toPrice: 92, owner: "@vd", ts: "today", mintSig: null, segment: seg(72, 92) },
  { id: "m-cro-88", matchId: "wc26-cro-bel", homeCode: "CRO", awayCode: "BEL", title: "Croatia's late winner", outcome: "H", pick: "CRO", minute: 88, fromPrice: 45, toPrice: 78, owner: "@late_swing", ts: "today", mintSig: null, segment: seg(45, 78) },
  { id: "m-bra-30", matchId: "wc26-bra-kor", homeCode: "BRA", awayCode: "KOR", title: "Brazil pull clear", outcome: "H", pick: "BRA", minute: 30, fromPrice: 71, toPrice: 84, owner: "@atlasfox", ts: "5 Jul", mintSig: null, segment: seg(71, 84) },
  { id: "m-esp-58", matchId: "wc26-esp-jpn", homeCode: "ESP", awayCode: "JPN", title: "Spain edge ahead", outcome: "H", pick: "ESP", minute: 58, fromPrice: 60, toPrice: 68, owner: "@pitchwizard", ts: "today", mintSig: null, segment: seg(60, 68) },
];

export const momentById = (id: string): Moment | undefined => MOMENTS.find((m) => m.id === id);
export const momentsByOwner = (handle: string): Moment[] => MOMENTS.filter((m) => m.owner.toLowerCase() === handle.toLowerCase());
