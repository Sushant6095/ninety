// Bake the top-20 WC26 player profiles → src/data/wc26/player-profiles.json (ADR-082, Session C).
//
// TWO-SOURCE LAW (ADR-051): everything here is STILL data — identity + FINAL tournament results — never live
// match state. Source of record: football-data.org, FIFA World Cup (competition 2000, season 2026).
//
// WHY football-data ONLY (and not API-Football, which the plan budgeted for):
//   API-Football's free plan is season-restricted ("Free plans do not have access to this season, try from
//   2022 to 2024"), so its 2026 per-match ratings / season aggregates / injuries are UNREACHABLE for WC26.
//   Filling those panels with a player's 2022-2024 CLUB stats would be the fake-proofs defect (wrong
//   tournament) — so we omit them honestly. Everything below comes from real WC26 football-data.
//
// BUDGET: football-data free tier is 10 req/min (per KEY, shared across sessions) → we throttle to ~8/min.
//   Calls: 1 (scorers) + up to 20 (per-player match logs) = ~21. RESUMABLE: every response is cached under
//   scripts/.cache/player-profiles/, so a 429 / crash / timeout never re-spends a call already made.
//
// RUN:  FOOTBALL_DATA_TOKEN=... node apps/web/scripts/bake-player-profiles.mjs
//   (the token is also read from apps/api/.env / .env if not in the environment.)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../.."); // repo root
const CACHE = path.join(HERE, ".cache/player-profiles");
const OUT = path.join(HERE, "../src/data/wc26/player-profiles.json");
const PLAYERS_JSON = path.join(HERE, "../src/data/wc26/players.json");
const FD_BASE = "https://api.football-data.org/v4";
const COMP = "2000"; // FIFA World Cup
const TOP_N = 20;
const THROTTLE_MS = 7600; // ~8 req/min, under the 10/min free-tier ceiling
const BAKED_AT = new Date().toISOString().slice(0, 10);

fs.mkdirSync(CACHE, { recursive: true });

function loadEnv() {
  for (const f of ["apps/api/.env", ".env"]) {
    try {
      for (const line of fs.readFileSync(path.join(ROOT, f), "utf8").split(/\n/)) {
        const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    } catch {
      /* file may not exist — env may already hold the token */
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fdCalls = 0;

/** Cache-first football-data GET. Returns parsed JSON; throws on a non-2xx so the caller records an honest error. */
async function fdGet(cacheName, apiPath) {
  const cacheFile = path.join(CACHE, cacheName);
  if (fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  if (fdCalls > 0) await sleep(THROTTLE_MS); // throttle between real calls only
  fdCalls += 1;
  const res = await fetch(`${FD_BASE}${apiPath}`, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_TOKEN, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`football-data ${apiPath} → HTTP ${res.status}`);
  const data = await res.json();
  fs.writeFileSync(cacheFile, JSON.stringify(data));
  return data;
}

/** W/L/D for the player's team in a finished match; null while unplayed. */
function resultFor(score, side) {
  const w = score?.winner;
  if (!w) return null;
  if (w === "DRAW") return "D";
  return (w === "HOME_TEAM" && side === "home") || (w === "AWAY_TEAM" && side === "away") ? "W" : "L";
}

async function main() {
  loadEnv();
  if (!process.env.FOOTBALL_DATA_TOKEN) throw new Error("FOOTBALL_DATA_TOKEN not set (checked env, apps/api/.env, .env)");

  // Baked squad identity (Session B) — for photo/pos/teamCode; keyed by football-data person id.
  const squad = new Map(JSON.parse(fs.readFileSync(PLAYERS_JSON, "utf8")).map((p) => [String(p.id), p]));

  // STEP 1 — rank the top 20 by goals+assists (tie-break goals). Reproducible; recorded in ADR-082.
  const scorers = (await fdGet("scorers.json", `/competitions/${COMP}/scorers?limit=30`)).scorers || [];
  const top = scorers
    .map((s) => ({
      id: String(s.player.id),
      name: s.player.name,
      firstName: s.player.firstName ?? null,
      lastName: s.player.lastName ?? null,
      dob: s.player.dateOfBirth ?? null,
      natName: s.player.nationality ?? s.team?.name ?? null,
      tla: s.team?.tla ?? null,
      shirt: s.player.shirtNumber ?? null,
      goals: s.goals ?? 0,
      assists: s.assists ?? 0,
      penalties: s.penalties ?? 0,
      playedMatches: s.playedMatches ?? 0,
    }))
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists) || b.goals - a.goals)
    .slice(0, TOP_N);

  // STEP 2 — per-player match log (real WC26 results). Resumable + throttled.
  const players = [];
  for (let i = 0; i < top.length; i++) {
    const s = top[i];
    const sq = squad.get(s.id);
    const nat = (sq?.teamCode || s.tla || "").toUpperCase();
    let matches = [];
    let matchesError = null;
    try {
      const raw = (await fdGet(`person-${s.id}.json`, `/persons/${s.id}/matches?competitions=${COMP}&limit=20`)).matches || [];
      matches = raw
        .map((m) => {
          const side = m.homeTeam?.tla?.toUpperCase() === nat ? "home" : "away";
          const oppRaw = side === "home" ? m.awayTeam : m.homeTeam;
          return {
            id: String(m.id),
            date: m.utcDate,
            status: m.status,
            stage: m.stage,
            // NO crest/emblem CDN urls (ADR-055) — codes only; teams render via baked TeamCrest.
            home: { code: m.homeTeam?.tla ?? "", name: m.homeTeam?.shortName ?? m.homeTeam?.name ?? "" },
            away: { code: m.awayTeam?.tla ?? "", name: m.awayTeam?.shortName ?? m.awayTeam?.name ?? "" },
            opp: { code: oppRaw?.tla ?? "", name: oppRaw?.shortName ?? oppRaw?.name ?? "" },
            score: m.score?.fullTime ? { h: m.score.fullTime.home, a: m.score.fullTime.away, winner: m.score.winner ?? null } : null,
            side,
            result: resultFor(m.score, side),
          };
        })
        .filter((m) => m.status === "FINISHED")
        .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
    } catch (e) {
      matchesError = String(e.message || e);
      console.warn(`  ! ${s.name}: match log failed — ${matchesError} (page keeps honest empty state)`);
    }
    players.push({
      id: s.id,
      name: s.name,
      firstName: s.firstName,
      lastName: s.lastName,
      dob: s.dob,
      nat,
      natName: s.natName,
      pos: sq?.pos ?? null,
      shirt: s.shirt,
      photo: sq?.photo ?? null,
      rank: i + 1,
      goals: s.goals,
      assists: s.assists,
      penalties: s.penalties,
      playedMatches: s.playedMatches,
      matches,
      matchesError,
    });
    console.log(`  [${i + 1}/${top.length}] ${s.name} (${nat}) — ${s.goals}g ${s.assists}a — ${matches.length} matches — fd calls: ${fdCalls}`);
  }

  // STEP 3 — Ninety index: derived per-match production, normalised across the cohort (honest, labelled).
  const per = (n, pm) => (pm > 0 ? n / pm : 0);
  const axisDefs = [
    { key: "scoring", label: "Scoring", input: "goals ÷ matches", raw: (p) => per(p.goals, p.playedMatches) },
    { key: "creation", label: "Creation", input: "assists ÷ matches", raw: (p) => per(p.assists, p.playedMatches) },
    { key: "involvement", label: "Involvement", input: "(goals + assists) ÷ matches", raw: (p) => per(p.goals + p.assists, p.playedMatches) },
    { key: "openPlay", label: "Open play", input: "non-penalty goals ÷ matches", raw: (p) => per(p.goals - p.penalties, p.playedMatches) },
    { key: "presence", label: "Presence", input: "matches played", raw: (p) => p.playedMatches },
  ];
  const maxes = Object.fromEntries(axisDefs.map((a) => [a.key, Math.max(1e-9, ...players.map((p) => a.raw(p)))]));
  for (const p of players) {
    p.ninetyIndex = axisDefs.map((a) => {
      const raw = a.raw(p);
      return { key: a.key, label: a.label, input: a.input, value: Math.round((100 * raw) / maxes[a.key]), raw: Math.round(raw * 100) / 100 };
    });
  }

  const out = {
    source: "football-data.org — FIFA World Cup 2026 (competition 2000). STILL data only (ADR-051).",
    bakedAt: BAKED_AT,
    query: "GET /v4/competitions/2000/scorers?limit=30 → rank by goals+assists (tie-break goals), take 20; per player GET /v4/persons/{id}/matches?competitions=2000",
    note:
      "API-Football season 2026 is free-plan-restricted → per-match ratings, season aggregates and injuries are UNREACHABLE for WC26 and are omitted, never faked. Photos: baked-local when present, else initials avatar. Ninety index: derived from WC26 per-match production, normalised across the 20 — not an official rating.",
    budget: { footballData: fdCalls, apiFootball: 0, footballDataDailyLimit: "10/min" },
    players,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(`\nBaked ${players.length} players → ${path.relative(ROOT, OUT)} | football-data calls this run: ${fdCalls}`);
}

main().catch((e) => {
  console.error("bake failed:", e.message || e);
  process.exit(1);
});
