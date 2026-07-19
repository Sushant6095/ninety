import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TeamPage } from "../../../features/team/TeamPage";
import { loadTeamProfile, teamProfileCodes, relatedTeams } from "../../../features/team/loaders";
import { tallies } from "../../../features/team/data";

// All 48 nations + 10 clubs are baked (ADR-083) — pre-render every one at build; an unknown code is a real 404.
export function generateStaticParams() {
  return teamProfileCodes().map((code) => ({ code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const t = loadTeamProfile(code);
  if (!t) return { title: "Team not found · Ninety" };
  const s = tallies(t);
  const kind = t.kind === "nation" ? `${t.country} at the 2026 World Cup` : t.country ?? "Club";
  return {
    title: `${t.name} · Ninety`,
    description: `${t.name} — ${kind}. ${s.played} played, ${s.won}W ${s.drawn}D ${s.lost}L. Fixtures, results, standings, squad and Ninety's market view.`,
  };
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const t = loadTeamProfile(code);
  if (!t) notFound();
  return <TeamPage t={t} related={relatedTeams(t)} />;
}
