"use client";
import { useState } from "react";
import Link from "next/link";
import { AppShell } from "../../components/ui/AppShell";
import { MomentCard } from "../../components/ui/MomentCard";
import { MomentHero } from "../../components/ui/MomentHero";
import { routes } from "../../lib/routes";
import { MOMENTS, rarityOf, swingOf, type Rarity } from "../../lib/moments";

type Tab = "All" | Rarity;
const TABS: Tab[] = ["All", "Legendary", "Epic", "Rare", "Common"];

export function MomentsGallery() {
  const [tab, setTab] = useState<Tab>("All");
  // Moment of the day = the biggest swing; it headlines the hero and is demoted out of the grid.
  const hero = [...MOMENTS].sort((a, b) => Math.abs(swingOf(b)) - Math.abs(swingOf(a)))[0];
  const rest = MOMENTS.filter((m) => m.id !== hero.id);
  const rows = tab === "All" ? rest : rest.filter((m) => rarityOf(m) === tab);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h1 className="font-display text-display font-bold tracking-tight text-hi">Moments</h1>
          <p className="mt-1 text-body text-lo">The swings that repriced a market — captured, ranked by size, and proved on-chain.</p>
        </div>

        {hero && <MomentHero m={hero} />}

        <h2 className="mb-3 mt-8 text-label font-semibold uppercase tracking-[0.12em] text-lo">More moments</h2>

        <div role="tablist" aria-label="Filter by rarity" className="mb-4 inline-flex flex-wrap gap-1 rounded-chip bg-surface p-1 ring-1 ring-inset ring-hairline">
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t)}
                className={`cursor-pointer rounded-chip px-3 py-1.5 text-caption font-medium transition-colors duration-200 ${active ? "bg-hairline/60 text-hi" : "text-lo hover:text-hi"}`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <div className="grid place-items-center rounded-card border border-hairline bg-surface px-4 py-16 text-center">
            <p className="text-body text-lo">No {tab.toLowerCase()} moments yet.</p>
            <button type="button" onClick={() => setTab("All")} className="mt-2 cursor-pointer text-body text-up transition-opacity duration-200 hover:opacity-80">Show all →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((m) => (
              <MomentCard key={m.id} m={m} />
            ))}
          </div>
        )}

        <p className="mt-6 text-caption text-lo">
          Missed one live? <Link href={routes.home} className="text-up transition-opacity duration-200 hover:opacity-80">Watch tonight&#39;s matches →</Link>
        </p>
      </main>
    </AppShell>
  );
}
