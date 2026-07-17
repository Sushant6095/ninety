// DEMO-SEED ONLY (local, not a P1 code path): push ONE Over/Under + ONE Asian-handicap tick for a fixture through
// the EXISTING ingest pipeline (createBus + createPipeline + ingestOdds — the same path the replay service uses),
// so cortex synthesizes its 1X2 mark and GET /markets/:fixture prices without live TxLINE creds. Sibling of
// prisma/seed-demo.ts. Changes NO routes/engine/cortex behaviour — it only publishes two odds ticks onto the bus.
// Usage: REDIS_URL=redis://localhost:6379 tsx src/push-demo-ticks.ts 18241006
import { randomUUID } from "node:crypto";
import IORedis from "ioredis";
import { createBus } from "@omnipitch/bus";
import { TOPICS, type Envelope } from "@omnipitch/schema";
import { createPipeline } from "./ingest";
import type { OddsTick } from "@omnipitch/txline";

const fixture = Number(process.argv[2] ?? "18241006");
const now = Date.now();

// Milli-decimal odds (ODDS_SCALE=1000 in cortex): 2100 → 2.10. A low-ish total + home-favoured handicap so the
// synthesized 1X2 reads as a plausible home lead (England favoured over Argentina), never a flat 33/33/33.
const ouTick: OddsTick = {
  FixtureId: fixture,
  Ts: now,
  SuperOddsType: "OVERUNDER_PARTICIPANT_GOALS",
  MarketParameters: "2.5",
  PriceNames: ["Over", "Under"],
  Prices: [2100, 1720], // Over 2.5 @ 2.10, Under 2.5 @ 1.72
};
const ahTick: OddsTick = {
  FixtureId: fixture,
  Ts: now + 1,
  SuperOddsType: "ASIANHANDICAP_PARTICIPANT_GOALS",
  MarketParameters: "-0.5",
  PriceNames: ["Home", "Away"],
  Prices: [1800, 2000], // Home -0.5 @ 1.80 (favoured), Away +0.5 @ 2.00
};

async function main(): Promise<void> {
  const redis = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");
  const bus = await createBus();
  const pipe = createPipeline(bus, redis);
  const ouPublished = await pipe.ingestOdds(ouTick);
  const ahPublished = await pipe.ingestOdds(ahTick);

  // Open the market through the REAL lifecycle (SCHEDULED→OPEN) so POST /orders can fill (ADR-073). The engine
  // consumes match.events → fromEnvelope maps a type:"open" event to the `open` trigger. source "replay" marks it
  // demo-injected. Without this, every market stays SCHEDULED and untradeable (the deferred-lifecycle gap).
  const openEnv: Envelope = {
    event_id: randomUUID(),
    source: "replay",
    source_seq: 0,
    match_id: String(fixture),
    ts_source: new Date(now).toISOString(),
    ts_ingest: new Date(now).toISOString(),
    type: "open",
    payload: { status: "open" },
  };
  await bus.publish(TOPICS.matchEvents, String(fixture), openEnv);

  console.log(JSON.stringify({ evt: "push-demo-ticks.done", fixture, ouPublished, ahPublished, opened: true }));
  await new Promise((r) => setTimeout(r, 400)); // let the stream flush before closing
  await bus.close();
  await redis.quit();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
