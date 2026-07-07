// VERIFY: print an authenticated fixtures/scores snapshot for a real WC26 fixture, then assert the
// client's guarantees. Runs the full guest→subscribe→sign→activate handshake against a deterministic
// mock (no network/creds). Doubles as `pnpm --filter @omnipitch/txline test`.
//   run:  pnpm --filter @omnipitch/txline test        (print + assert)
//   emit: tsx scripts/snapshot.ts --emit              (also writes docs/txline-samples/*.json)
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { TxLineClient } from "../src/client";
import { mockTxLine, WC26_FIXTURE_ID } from "../src/mock";

const here = dirname(fileURLToPath(import.meta.url));
const samplesDir = resolve(here, "../../../docs/txline-samples");

async function main(): Promise<void> {
  const { fetch, subscriber, signer, calls } = mockTxLine();
  const client = new TxLineClient({
    cluster: "devnet",
    apiOrigin: "https://txline-dev.txodds.com",
    serviceLevel: 12,
    leagues: ["wc26"],
    fetch,
    subscriber,
    signer,
  });

  // authenticated fixtures (F1) + scores snapshot (S1) for a real WC26 fixture
  const schedule = await client.fixtures();
  const snapshot = await client.scoresSnapshot<{ fixtureId: string }>(WC26_FIXTURE_ID);

  console.log("── TxLINE authenticated snapshot (devnet · guest→subscribe→activate · both headers) ──\n");
  console.log("GET /api/scores/schedule");
  console.log(JSON.stringify(schedule, null, 2));
  console.log(`\nGET /api/scores/snapshot/${WC26_FIXTURE_ID}`);
  console.log(JSON.stringify(snapshot, null, 2));

  // --- invariants ---
  for (const c of calls.data) {
    assert.ok(c.bearer?.startsWith("Bearer "), "every data request must send Authorization: Bearer {jwt}");
    assert.ok(c.apiToken && c.apiToken.length > 0, "every data request must send X-Api-Token {apiToken}");
  }
  assert.equal(calls.guestStart, 1, "guest/start runs once — token is cached across requests");
  assert.equal(calls.activate, 1, "token/activate runs once — token is cached across requests");

  // refresh-and-retry when the token is rejected
  calls.expireNextToken = true;
  const refreshed = await client.scoresSnapshot<{ fixtureId: string }>(WC26_FIXTURE_ID);
  assert.equal(refreshed.fixtureId, WC26_FIXTURE_ID, "snapshot returns after a refresh");
  assert.equal(calls.activate, 2, "a 401 triggers exactly one re-activate");

  // never mix networks: devnet cluster + mainnet origin must be rejected at construction
  assert.throws(
    () => new TxLineClient({ cluster: "devnet", apiOrigin: "https://txline.txodds.com", fetch, subscriber, signer }),
    /network mismatch/i,
    "mainnet origin with a devnet cluster must throw",
  );

  if (process.argv.includes("--emit")) {
    mkdirSync(samplesDir, { recursive: true });
    writeFileSync(resolve(samplesDir, "scores-snapshot.json"), JSON.stringify(snapshot, null, 2) + "\n");
    writeFileSync(resolve(samplesDir, "fixtures-schedule.json"), JSON.stringify(schedule, null, 2) + "\n");
    console.log(`\nwrote samples → ${samplesDir}`);
  }

  console.log("\n✓ VERIFY OK — authenticated snapshot printed; dual headers, token cache, refresh, and network guard all asserted.");
}

main().catch((err) => {
  console.error("\n✗ VERIFY FAILED:", err);
  process.exit(1);
});
