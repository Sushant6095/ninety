// PLAYER-DATA PROBE (ITEM 10) — answers ONE question: does TxLINE carry lineups / squads / player names?
//
// TxLINE's full envelope was captured LIVE on 2026-07-07 (ADR-015) by scripts/txline-live.mjs into
// docs/txline-samples/*.json. That capture is the authoritative wire shape (every field present). This probe
// deep-walks that envelope and reports exactly which player-identifying fields exist — so the verdict is
// evidence, not memory. To refresh against a live fixture first run `node scripts/txline-live.mjs` (needs a
// funded devnet wallet at ~/.config/solana/id.json — the on-chain subscribe handshake), then re-run this.
//
// Law: this probe does NOT call TxLINE — it reads the committed capture. Only packages/txline calls the API.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SAMPLES = fileURLToPath(new URL("../docs/txline-samples/", import.meta.url));

// Fields that would let us render a Lineups tab (names, XI, formation, shirt numbers, positions).
const LINEUP_KEYS = [
  "lineup", "lineups", "squad", "squads", "formation", "roster",
  "name", "firstname", "lastname", "shirt", "jersey", "number",
  "position", "bench", "substitute", "starting", "playername", "player", "players",
];
// Player-level in-match STAT blocks (movement data — belongs to TxLINE per ADR-051, but ID-only).
const PLAYERSTAT_KEYS = ["playerstats", "playerstat"];

/** Walk any JSON value; collect every key path whose leaf key matches one of `needles` (case-insensitive). */
function findKeys(node, needles, path = "$", hits = []) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => findKeys(v, needles, `${path}[${i}]`, hits));
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (needles.includes(k.toLowerCase())) hits.push({ path: `${path}.${k}`, key: k, value: v });
      findKeys(v, needles, `${path}.${k}`, hits);
    }
  }
  return hits;
}

const files = readdirSync(SAMPLES).filter((f) => f.endsWith(".json"));
const lineupHits = [];
const playerStatHits = [];
for (const f of files) {
  const json = JSON.parse(readFileSync(SAMPLES + f, "utf8"));
  for (const h of findKeys(json, LINEUP_KEYS)) lineupHits.push({ file: f, ...h });
  for (const h of findKeys(json, PLAYERSTAT_KEYS)) playerStatHits.push({ file: f, ...h });
}

// A PlayerStats block is a map of Participant → { <playerId>: {stat: n} }. Extract the player-id shape as proof
// that the IDs are opaque numbers with NO name/number attached.
const playerStatSample = playerStatHits[0]?.value ?? null;
const playerIdsAreOpaque = playerStatSample
  ? Object.values(playerStatSample).every(
      (side) => side && typeof side === "object" && Object.keys(side).every((id) => /^\d+$/.test(id)),
    )
  : null;

const carriesNamesOrLineups = lineupHits.length > 0;
const carriesPlayerStats = playerStatHits.length > 0;

const report = {
  probedAt: new Date().toISOString(),
  source: "docs/txline-samples/*.json (live capture 2026-07-07, ADR-015)",
  filesScanned: files,
  verdict: {
    carriesPlayerNamesOrLineups: carriesNamesOrLineups,
    carriesPlayerLevelStats: carriesPlayerStats,
    playerStatsAreIdOnly: playerIdsAreOpaque,
    summary: carriesNamesOrLineups
      ? "TxLINE carries lineup/name fields — see lineupHits."
      : "TxLINE does NOT carry lineups, squads, formations, shirt numbers, or player names. The only player-level data is PlayerStats: a map of opaque numeric player IDs -> in-match stat deltas ({goals, yellowCards, ...}), present only for players who registered an event.",
  },
  lineupHits,
  playerStatHits: playerStatHits.map((h) => ({ file: h.file, path: h.path })),
  playerStatSample,
};

writeFileSync(SAMPLES + "player-data-probe.json", JSON.stringify(report, null, 2) + "\n");

console.log("── TxLINE PLAYER-DATA PROBE ──\n");
console.log("scanned:", files.join(", "));
console.log("\nlineup / squad / formation / name / number / position fields:", carriesNamesOrLineups ? `${lineupHits.length} FOUND` : "NONE");
console.log("PlayerStats blocks:", carriesPlayerStats ? `${playerStatHits.length} (at ${playerStatHits.map((h) => `${h.file}${h.path.replace("$", "")}`).join(", ")})` : "NONE");
console.log("PlayerStats keyed by opaque numeric player IDs (no name/number):", playerIdsAreOpaque);
if (playerStatSample) console.log("PlayerStats sample:", JSON.stringify(playerStatSample));
console.log("\nVERDICT:", report.verdict.summary);
console.log("\nwrote docs/txline-samples/player-data-probe.json");
