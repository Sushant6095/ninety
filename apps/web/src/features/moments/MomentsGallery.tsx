"use client";
import { useState } from "react";
import Link from "next/link";
import { AppShell } from "../../components/ui/AppShell";
import { MomentCard } from "../../components/ui/MomentCard";
import { MomentHero } from "../../components/ui/MomentHero";
import { routes } from "../../lib/routes";
import { rarityOf, swingOf, type Rarity } from "../../lib/moments";
import { useLive } from "../../lib/data/useLive";
import { getMomentList, MOMENTS } from "../../lib/data/moments";

type Tab = "All" | Rarity;
const TABS: Tab[] = ["All", "Legendary", "Epic", "Rare", "Common"];

export function MomentsGallery() {
  const [tab, setTab] = useState<Tab>("All");
  // Live GET /moments (empty today → graceful empty state); MOMENTS is the offline-mode fallback only.
  const { data: moments } = useLive(() => getMomentList(), MOMENTS);
  // Moment of the day = the biggest swing; it headlines the hero in the "All" view only. When a rarity tab is
  // active we show a PURE grid of every moment of that rarity — INCLUDING the one that headlines "All". Filtering
  // `rest` (which excludes the hero) meant "Legendary" rendered "No legendary moments yet" directly under a
  // LEGENDARY hero — the only legendary moment was the hero, hidden from its own filter. read-out-loud bug.
  const hero = tab === "All" && moments.length ? [...moments].sort((a, b) => Math.abs(swingOf(b)) - Math.abs(swingOf(a)))[0] : null;
  const rows = tab === "All" ? (hero ? moments.filter((m) => m.id !== hero.id) : moments) : moments.filter((m) => rarityOf(m) === tab);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h1 className="font-display text-display font-bold tracking-tight text-hi">Moments</h1>
          {/* Every displayed moment is mintSig:null (MINTLESS) until on-chain minting is live (BLOCKERS B1) — so
              the copy states the future action ("mints … at settlement"), never a completed proof. Saying
              "provable on-chain" over all-MINTLESS cards read as a contradiction; this states the honest state. */}
          <p className="mt-1 text-body text-lo">The swings that repriced a market — captured live and ranked by size. Each mints on Solana at settlement.</p>
        </div>

        {moments.length === 0 ? (
          <div className="grid place-items-center rounded-card border border-hairline bg-surface px-4 py-20 text-center">
            <p className="text-heading font-semibold text-hi">No moments yet</p>
            <p className="mt-1 max-w-sm text-body text-lo">The first market-moving swing gets captured here — check back once tonight&#39;s matches are live.</p>
            <Link href={routes.matches} className="mt-3 text-body text-up transition-opacity duration-200 hover:opacity-80">Watch tonight&#39;s matches →</Link>
          </div>
        ) : (
          <>
            {hero && <MomentHero m={hero} />}

            <h2 className="mb-3 mt-8 text-label font-semibold uppercase tracking-label text-lo">More moments</h2>

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
                    className={`inline-flex min-h-11 cursor-pointer items-center rounded-chip px-3.5 text-caption font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up/60 ${active ? "bg-hairline/60 text-hi" : "text-lo hover:text-hi"}`}
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
          </>
        )}

        <p className="mt-6 text-caption text-lo">
          Missed one live? <Link href={routes.matches} className="text-up transition-opacity duration-200 hover:opacity-80">Watch tonight&#39;s matches →</Link>
        </p>
      </main>
    </AppShell>
  );
}
