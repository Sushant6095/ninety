// VERIFY: exercise every typed TxLINE wrapper against a deterministic mock (real WC26 data), print an
// authenticated fixtures/scores snapshot, assert each returns a parsed schema type, and (with --emit)
// write one real sample per endpoint to docs/txline-samples/. Doubles as `pnpm --filter @omnipitch/txline test`.
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { TxLineClient } from "../src/client";
import { mockTxLine, WC26_FIXTURE_ID } from "../src/mock";

const here = dirname(fileURLToPath(import.meta.url));
const samplesDir = resolve(here, "../../../docs/txline-samples");

async function collect<T>(gen: AsyncGenerator<T>, max = 100): Promise<T[]> {
  const out: T[] = [];
  for await (const x of gen) {
    out.push(x);
    if (out.length >= max) break;
  }
  return out;
}

async function main(): Promise<void> {
  const { fetch, subscriber, signer, calls } = mockTxLine();
  const client = new TxLineClient({ cluster: "devnet", apiOrigin: "https://txline-dev.txodds.com", serviceLevel: 12, leagues: ["wc26"], fetch, subscriber, signer });

  // every wrapper returns a parsed schema type (not any) — parse happens inside the wrapper
  const schedule = await client.fixtures(); // F1
  const scores = await client.scoresSnapshot(WC26_FIXTURE_ID); // S1
  const scoreUpdates = await client.scoresUpdates(20624, 19, 3); // S2
  const scoreEvents = await collect(client.scoresStream()); // S3 (SSE)
  const statVal = await client.statValidation(WC26_FIXTURE_ID, 9001, 1002, 1003); // S4
  const oddsSnap = await client.oddsSnapshot(WC26_FIXTURE_ID); // O1
  const oddsUpdates = await client.oddsUpdates(20624, 19, 3); // O2
  const oddsTicks = await collect(client.oddsStream()); // O3 (SSE)

  console.log("── TxLINE authenticated snapshot (devnet · guest→subscribe→activate · both headers) ──\n");
  console.log("GET /api/scores/schedule");
  console.log(JSON.stringify(schedule, null, 2));
  console.log(`\nGET /api/scores/snapshot/${WC26_FIXTURE_ID}`);
  console.log(JSON.stringify(scores, null, 2));
  console.log("\nwrappers (parsed, typed):");
  console.log(`  S1 scoresSnapshot   → ${scores.home.team} ${scores.home.goals}-${scores.away.goals} ${scores.away.team} @${scores.minute}'`);
  console.log(`  S2 scoresUpdates    → ${scoreUpdates.events.length} events in bucket ${scoreUpdates.epochDay}/${scoreUpdates.hourOfDay}/${scoreUpdates.interval}`);
  console.log(`  S3 scoresStream     → ${scoreEvents.length} events (first: ${scoreEvents[0]?.type})`);
  console.log(`  S4 statValidation   → ${statVal.stats.length} stats, root ${statVal.rootPda.slice(0, 12)}…`);
  console.log(`  F1 fixtures         → ${schedule.fixtures.length} fixtures`);
  console.log(`  O1 oddsSnapshot     → H ${oddsSnap.odds.H} / D ${oddsSnap.odds.D} / A ${oddsSnap.odds.A}`);
  console.log(`  O2 oddsUpdates      → ${oddsUpdates.ticks.length} ticks`);
  console.log(`  O3 oddsStream       → ${oddsTicks.length} StablePrice ticks (first H ${oddsTicks[0]?.odds.H})`);

  // --- assertions: parsed schema shapes ---
  assert.equal(scores.fixtureId, WC26_FIXTURE_ID);
  assert.equal(scores.home.team, "Brazil");
  assert.equal(scoreUpdates.events.length, 2);
  assert.equal(scoreEvents[0].type, "goal");
  assert.equal(statVal.stats.length, 2);
  assert.equal(schedule.fixtures.length, 3);
  assert.ok(oddsSnap.odds.H > 0 && oddsSnap.odds.A > 0);
  assert.equal(oddsUpdates.ticks.length, 2);
  assert.equal(oddsTicks[0].odds.A, 5.2);

  // --- assertions: auth invariants ---
  for (const c of calls.data) {
    assert.ok(c.bearer?.startsWith("Bearer "), "every data request must send Authorization: Bearer {jwt}");
    assert.ok(c.apiToken && c.apiToken.length > 0, "every data request must send X-Api-Token {apiToken}");
  }
  assert.equal(calls.guestStart, 1, "guest/start runs once — session cached across all wrappers");
  assert.equal(calls.activate, 1, "token/activate runs once — session cached across all wrappers");

  // refresh-and-retry on 401
  calls.expireNextToken = true;
  const refreshed = await client.scoresSnapshot(WC26_FIXTURE_ID);
  assert.equal(refreshed.fixtureId, WC26_FIXTURE_ID);
  assert.equal(calls.activate, 2, "a 401 triggers exactly one re-activate");

  // never mix networks
  assert.throws(
    () => new TxLineClient({ cluster: "devnet", apiOrigin: "https://txline.txodds.com", fetch, subscriber, signer }),
    /network mismatch/i,
    "mainnet origin with a devnet cluster must throw",
  );

  if (process.argv.includes("--emit")) {
    mkdirSync(samplesDir, { recursive: true });
    const out: Record<string, unknown> = {
      "scores-snapshot": scores,
      "scores-updates": scoreUpdates,
      "scores-stream-event": scoreEvents[0],
      "scores-stat-validation": statVal,
      "fixtures-schedule": schedule,
      "odds-snapshot": oddsSnap,
      "odds-updates": oddsUpdates,
      "odds-stream-event": oddsTicks[0],
    };
    for (const [name, data] of Object.entries(out)) {
      writeFileSync(resolve(samplesDir, `${name}.json`), JSON.stringify(data, null, 2) + "\n");
    }
    console.log(`\nwrote ${Object.keys(out).length} samples → ${samplesDir}`);
  }

  console.log("\n✓ VERIFY OK — 8 endpoints, every wrapper returns a parsed schema type; dual headers, cache, refresh, network guard asserted.");
}

main().catch((err) => {
  console.error("\n✗ VERIFY FAILED:", err);
  process.exit(1);
});
