import type { Metadata } from "next";
import { LandingPage } from "../features/landing/LandingPage";

export const metadata: Metadata = {
  title: "Ninety — every match is a market for ninety minutes",
  description:
    "A free-to-play live football exchange for World Cup 2026. Prices move with the game, the Booth explains the swings, Solana proves the result. Play money — no deposits, no cash payouts, ever.",
};

// The landing — where a visitor arrives. The board (the old /) lives at /board.
export default function Landing() {
  return <LandingPage />;
}
