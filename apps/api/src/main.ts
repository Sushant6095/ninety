// L5 entry — boots Fastify (http/), uWS (ws/), and the in-proc engine (engine/).
// MVP collapse (ADR-004): one process. ws/ and engine/ are extraction-ready folders.
import IORedis from "ioredis";
import { startHttp } from "./http/server";
import { startEngine } from "./engine";
import { startProjectionService } from "./services/projection-runtime";
async function main() {
  const redis = process.env.REDIS_URL ? new IORedis(process.env.REDIS_URL) : undefined;
  await startEngine(redis); // subscribes bus: prices.marks, match.events → owns market state (null without redis)
  if (redis) await startProjectionService(redis); // consume orders/fills/positions/credits → Postgres + Redis (ADR-027)
  await startHttp(); // REST (markets/leaderboard/auth/…) + the markets-read consumer + the uWS bridge (fan-out)
}
main();
