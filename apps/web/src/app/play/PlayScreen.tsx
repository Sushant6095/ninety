"use client";
// /play (ADR-060) — composes the read-only Next Goal game with the page feed harness. onLock/onReset are
// plain round events; the harness turns them into store-owned goals. The game holds no writer.
import Link from "next/link";
import { NextGoal } from "../../features/games/NextGoal";
import { RoundFilter } from "../../features/games/RoundFilter";
import { routes } from "../../lib/routes";
import { useMatchSimHarness } from "./matchSimHarness";

export function PlayScreen() {
  const { armGoal, resetMatch } = useMatchSimHarness();

  return (
    <main className="flex min-h-dvh flex-col items-center bg-bg px-4 py-6">
      <header className="flex w-full max-w-sm items-center justify-between">
        <Link
          href={routes.matches}
          className="text-caption font-medium text-lo outline-none transition-colors duration-150 hover:text-hi focus-visible:ring-2 focus-visible:ring-up focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          ← Board
        </Link>
        {/* Surface name (ADR-060), not a match-state chip — "HALFTIME" over "LIVE 74'" read as two clocks. */}
        <span className="text-label font-semibold uppercase tracking-[0.16em] text-lo">Next Goal</span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-6">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-heading font-extrabold tracking-tight text-hi">Call the next goal</h1>
          <p className="mt-1 text-caption text-lo">Three seconds to lock it in. Build a streak.</p>
        </div>

        <NextGoal onLock={armGoal} onReset={resetMatch} />

        <RoundFilter />

        <p className="max-w-sm text-center text-label text-lo">
          Free · no sign-up · your streak saves to this device
        </p>
      </div>
    </main>
  );
}
