import { TerminalScreen } from "../../../features/terminal/TerminalScreen";

// Match view = the Terminal. Any match link opens the pro trading surface (fixture-seeded on the featured market
// for now; the per-id market detail + amm.q feed lands via GET /markets/:id and the ADR-046 guarded engine emit).
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await params; // id will select the market once GET /markets/:id is wired (chunk-swap)
  return <TerminalScreen />;
}
