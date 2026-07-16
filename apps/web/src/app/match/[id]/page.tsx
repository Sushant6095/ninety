import { notFound } from "next/navigation";
import { TerminalScreen } from "../../../features/terminal/TerminalScreen";
import { marketByMatchId } from "../../../lib/fixtures";

// Match view = the Terminal. The [id] selects WHICH market opens: the featured AUS-EGY money-shot, or any other
// board market (fixture identity + the ONE live store, keyed by the same matchId). An unknown id has no fixture,
// so it 404s here (Next notFound) — it must never silently fall back to the featured match (ADR-055 credibility).
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!marketByMatchId(id)) notFound();
  return <TerminalScreen matchId={id} />;
}
