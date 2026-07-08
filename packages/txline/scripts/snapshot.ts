// CI VERIFY (mock): exercise every typed TxLINE wrapper against a deterministic mock that serves the
// REAL payloads captured live into docs/txline-samples/ (ADR-015). Asserts each wrapper returns a parsed
// schema type + the auth invariants. For the LIVE (world) run see packages/chain/scripts/txline-live.mjs.
// Runs as `pnpm --filter @omnipitch/txline test`.
import assert from "node:assert/strict";
import { TxLineClient, resultFromGoals } from "../src/client";
import { mockTxLine, WC26_FIXTURE_ID } from "../src/mock";

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
  const client = new TxLineClient({ cluster: "devnet", apiOrigin: "https://txline-dev.txodds.com", fetch, subscriber, signer });

  const fixtures = await client.fixtures(); // F1 → Fixture[]
  const scores = await client.scoresSnapshot(WC26_FIXTURE_ID); // S1 → ScoreState[]
  const scoreUpdates = await client.scoresUpdates(20641, 1, 8); // S2
  const scoreEvents = await collect(client.scoresStream()); // S3 (SSE)
  const statVal = await client.statValidation(WC26_FIXTURE_ID, scores[0]?.Seq ?? 0, 1002); // S4
  const settlement = await client.settlementProof(WC26_FIXTURE_ID); // ADR-037: game_finalised record → statKeys 1,2
  const oddsSnap = await client.oddsSnapshot(WC26_FIXTURE_ID); // O1 (empty for scheduled fixture)
  const oddsUpdates = await client.oddsUpdates(20641, 1, 8); // O2
  const oddsTicks = await collect(client.oddsStream()); // O3 (SSE)

  const wc = fixtures.find((f) => f.CompetitionId === 72) ?? fixtures[0];
  const s0 = scores[0];
  const g = s0?.Score;
  console.log("── TxLINE authenticated snapshot (mock of real payloads · both headers) ──\n");
  console.log("GET /api/fixtures/snapshot (first fixture)");
  console.log(JSON.stringify(wc, null, 2));
  console.log(`\nGET /api/scores/snapshot/${WC26_FIXTURE_ID} →`, `${wc?.Participant1} ${g?.Participant1?.Total?.Goals ?? "?"}-${g?.Participant2?.Total?.Goals ?? "?"} ${wc?.Participant2} · state ${s0?.GameState} · seq ${s0?.Seq}`);
  console.log("\nwrappers (parsed, typed):");
  console.log(`  F1 fixtures        → ${fixtures.length} fixtures (${wc?.Competition})`);
  console.log(`  S1 scoresSnapshot  → ${scores.length} states, fixture ${s0?.FixtureId}`);
  console.log(`  S2 scoresUpdates   → ${scoreUpdates.length} states`);
  console.log(`  S3 scoresStream    → ${scoreEvents.length} event(s)`);
  console.log(`  S4 statValidation  → statToProve key ${statVal.statToProve.key}, ${statVal.statProof.length} proof nodes`);
  console.log(`  O1 oddsSnapshot    → ${oddsSnap.length} ticks`);
  console.log(`  O2 oddsUpdates     → ${oddsUpdates.length} ticks (${oddsUpdates[0]?.Bookmaker ?? "n/a"})`);
  console.log(`  O3 oddsStream      → ${oddsTicks.length} tick(s)`);

  // parsed-shape assertions
  assert.ok(Array.isArray(fixtures) && fixtures.length > 0 && typeof fixtures[0].FixtureId === "number");
  assert.ok(typeof s0.FixtureId === "number" && s0.Score, "scores parsed with nested Score");
  assert.equal(scoreEvents[0].FixtureId, s0.FixtureId, "stream yields typed ScoreState");
  assert.equal(typeof statVal.statToProve.key, "number");
  // ADR-037 settlement recipe: finds the game_finalised record, proves statKeys 1,2, derives HOME/DRAW/AWAY.
  assert.ok(settlement, "settlementProof finds the game_finalised record");
  assert.equal(settlement.result, 1, "home 2 – away 1 ⇒ result HOME (1)");
  assert.equal(settlement.home, 2);
  assert.equal(settlement.away, 1);
  assert.equal(settlement.levelScore, false, "2–1 is not level (ADR-037 Q3 shootout guard)");
  assert.ok(settlement.proof.statProof.length > 0, "settlement proof carries Merkle nodes");
  assert.equal(resultFromGoals(0, 0), 2, "0–0 ⇒ DRAW");
  assert.equal(resultFromGoals(1, 3), 3, "1–3 ⇒ AWAY");
  // guard the admin-confirmed wire form (ADR-037): the stat-validation call must send statKeys=1,2, not statKey/statKey2.
  const statCall = calls.data.find((c) => c.path === "/api/scores/stat-validation" && c.search.includes("statKeys=1%2C2"));
  assert.ok(statCall, "settlementProof requests statKeys=1,2 (comma-joined), per admin wire format");
  assert.ok(Array.isArray(oddsSnap));
  assert.ok(oddsUpdates.length > 0 && Array.isArray(oddsUpdates[0].Prices ?? []));
  assert.equal(typeof oddsTicks[0].FixtureId, "number");

  // auth invariants
  for (const c of calls.data) {
    assert.ok(c.bearer?.startsWith("Bearer "), "every data request sends Authorization: Bearer {jwt}");
    assert.ok(c.apiToken && c.apiToken.length > 0, "every data request sends X-Api-Token");
  }
  assert.equal(calls.guestStart, 1, "session cached across all wrappers");
  assert.equal(calls.activate, 1, "session cached across all wrappers");

  calls.expireNextToken = true;
  const refreshed = await client.scoresSnapshot(WC26_FIXTURE_ID);
  assert.equal(refreshed[0].FixtureId, s0.FixtureId);
  assert.equal(calls.activate, 2, "a 401 triggers exactly one re-activate");

  assert.throws(
    () => new TxLineClient({ cluster: "devnet", apiOrigin: "https://txline.txodds.com", fetch, subscriber, signer }),
    /network mismatch/i,
    "mainnet origin with a devnet cluster must throw",
  );

  console.log("\n✓ CI VERIFY OK (mock of real payloads) — 8 wrappers return parsed schema types; dual headers, cache, refresh, network guard asserted.");
}

main().catch((err) => {
  console.error("\n✗ VERIFY FAILED:", err);
  process.exit(1);
});
