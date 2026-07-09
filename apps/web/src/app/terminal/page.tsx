import { TerminalScreen } from "../../features/terminal/TerminalScreen";

// The Terminal — the pro match-detail trading surface. Fixture-seeded (mirrors GET /markets/:id +/quote +
// /portfolio); the amm.q feed lands via the ADR-046 guarded engine emit.
export default function Page() {
  return <TerminalScreen />;
}
