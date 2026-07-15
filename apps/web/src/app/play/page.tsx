import type { Metadata } from "next";
import { PlayScreen } from "./PlayScreen";

// Next Goal — the halftime mini-game (ADR-060). Read-only consumer of the live store; the goal is produced
// by the page's feed harness. Play-money-free, localStorage-only, no backend.
export const metadata: Metadata = {
  title: "Next Goal — Ninety",
  description: "Call the next goal. Build a streak. Free to play.",
};

export default function Page() {
  return <PlayScreen />;
}
