import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerPage } from "../../../features/player/PlayerPage";
import { loadPlayerProfile } from "../../../features/player/loaders";
import { playerIds, posLabel, ageAt } from "../../../features/player/data";

// The top-20 are baked (ADR-082) — pre-render all 20 at build; an unknown id is a real 404 (no fabricated player).
export function generateStaticParams() {
  return playerIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = loadPlayerProfile(id);
  if (!p) return { title: "Player not found · Ninety" };
  const age = ageAt(p.dob);
  return {
    title: `${p.name} · ${p.natName ?? p.nat} · Ninety`,
    description: `${p.name}${age ? `, ${age},` : ""} — ${posLabel(p.pos)} for ${p.natName ?? p.nat}. ${p.goals} goals, ${p.assists} assists at the 2026 World Cup.`,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = loadPlayerProfile(id);
  if (!p) notFound();
  return <PlayerPage p={p} />;
}
