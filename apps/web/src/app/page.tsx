import type { Metadata } from "next";
import { LandingLong } from "../features/landing/LandingLong";

export const metadata: Metadata = {
  title: "Ninety — every match is a market for ninety minutes",
  description:
    "A free-to-play live football exchange for World Cup 2026. Prices move with the game, the Booth explains the swings, Solana proves the result. Play money — no deposits, no cash payouts, ever.",
};

// The landing — the kept notio hero + a long, football-first scroll story below it (LandingLong, ADR-069).
export default function Page() {
  return <LandingLong />;
}
