// BAKE LINEUPS (ITEM 10) — the STILLNESS source for the /terminal Lineups tab.
//
// WHY THIS EXISTS: TxLINE does NOT carry lineups/squads/names (see scripts/player-probe.mjs +
// docs/TXLINE-MAP.md §6) and worldcup26 has no player endpoint. Player names, shirt numbers, formation and the
// starting XI SIT STILL, so per ADR-051 they come from a stillness source (API-Football), fetched ONCE offline
// and committed — NEVER a runtime dependency.
//
// TWO-SOURCE LAW (ADR-051): this file may only ever emit STILLNESS (formation / names / numbers / positions).
// It MUST NOT emit anything that moves during a match — no goals, no score, no minute, no result. The
// assertNoMovement() guard below fails the bake if a movement field ever leaks in. TxLINE remains the sole
// owner of scores/goals/halts/prices/results.
//
// RUN (human, once, with a free API-Football key):
//   API_FOOTBALL_KEY=xxxx node scripts/bake-lineups.mjs
//   → writes apps/web/public/wc26/lineups.json (commit it; the app reads the static file, never the API)
//
// Free tier: https://www.api-football.com/ (100 req/day) · base v3.football.api-sports.io · header x-apisports-key.
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const KEY = process.env.API_FOOTBALL_KEY;
if (!KEY) {
  console.error("BLOCKED — needs human credentials: set API_FOOTBALL_KEY (free key from https://www.api-football.com/).");
  console.error("See docs/SETUP-LIVE.md for the exact signup + env steps. Nothing written.");
  process.exit(0); // a missing key is a known blocked state, not a script failure
}

const BASE = "https://v3.football.api-sports.io";
const LEAGUE_WORLD_CUP = 1; // API-Football league id for the FIFA World Cup
const SEASON = Number(process.env.API_FOOTBALL_SEASON ?? 2026);
const H = { "x-apisports-key": KEY };
const OUT = fileURLToPath(new URL("../apps/web/public/wc26/", import.meta.url));

// Fields that MOVE during a match — forbidden in a stillness bake (ADR-051).
const MOVEMENT = ["goals", "score", "minute", "elapsed", "result", "status", "winner", "price", "mark"];
function assertNoMovement(obj, where) {
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object") {
      for (const [k, v] of Object.entries(n)) {
        if (MOVEMENT.includes(k.toLowerCase()))
          throw new Error(`ADR-051 VIOLATION: movement field '${k}' in baked lineups at ${where}. TxLINE owns movement — the bake must be stillness only.`);
        walk(v);
      }
    }
  };
  walk(obj);
}

async function api(path) {
  const res = await fetch(`${BASE}${path}`, { headers: H });
  const body = await res.json();
  if (!res.ok || (body.errors && Object.keys(body.errors).length))
    throw new Error(`API-Football ${path} → ${res.status} ${JSON.stringify(body.errors ?? body).slice(0, 200)}`);
  return body.response ?? [];
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const fixtures = await api(`/fixtures?league=${LEAGUE_WORLD_CUP}&season=${SEASON}`);
  console.log(`fixtures: ${fixtures.length} for league ${LEAGUE_WORLD_CUP} season ${SEASON}`);

  const baked = {};
  for (const fx of fixtures) {
    const fixtureId = fx.fixture?.id;
    if (!fixtureId) continue;
    const lineups = await api(`/fixtures/lineups?fixture=${fixtureId}`);
    if (!lineups.length) continue; // lineups publish ~40min before kickoff; skip fixtures without them
    const sides = lineups.map((l) => ({
      team: l.team?.name, // join key → wc26 teams.json by name/code (done at wire time; apps/web is frozen tonight)
      formation: l.formation, // "4-3-3"
      coach: l.coach?.name ?? null,
      startXI: (l.startXI ?? []).map((p) => ({ number: p.player?.number, name: p.player?.name, pos: p.player?.pos, grid: p.player?.grid })),
      subs: (l.substitutes ?? []).map((p) => ({ number: p.player?.number, name: p.player?.name, pos: p.player?.pos })),
    }));
    baked[String(fixtureId)] = { home: sides[0] ?? null, away: sides[1] ?? null };
  }

  assertNoMovement(baked, "baked lineups"); // ADR-051 fail-closed guard
  const out = { source: "API-Football (api-sports.io) — STILLNESS ONLY (ADR-051)", league: LEAGUE_WORLD_CUP, season: SEASON, bakedAt: new Date().toISOString(), fixtures: baked };
  writeFileSync(OUT + "lineups.json", JSON.stringify(out, null, 2) + "\n");
  console.log(`✓ wrote apps/web/public/wc26/lineups.json — ${Object.keys(baked).length} fixtures with lineups. Commit it; it is never a runtime dependency.`);
}

main().catch((e) => {
  console.error("BAKE FAILED:", e?.message || e);
  process.exit(1);
});
