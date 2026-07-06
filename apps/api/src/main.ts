// L5 entry — boots Fastify (http/), uWS (ws/), and the in-proc engine (engine/).
// MVP collapse (ADR-004): one process. ws/ and engine/ are extraction-ready folders.
import { startHttp } from "./http/server";
import { startWs } from "./ws/gateway";
import { startEngine } from "./engine";
async function main() {
  await startEngine();   // subscribes bus: prices.marks, match.events → owns market state
  await startWs();       // fan-out with seq-resume
  await startHttp();     // REST: markets, orders, portfolio, leaderboard, moments, auth
}
main();
