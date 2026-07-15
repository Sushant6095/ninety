// BAKE TEAMS (richness pass) — the STILLNESS imagery source for crests, jerseys, atmosphere + player faces.
//
// WHY THIS EXISTS: TxLINE carries movement (scores/goals/halts/prices/results), never a badge or a face.
// worldcup26 owns only the still text (names/flags/groups). Crests, kit jerseys, stadium/atmosphere shots and
// player photos ALSO sit still, so per ADR-051 they come from a stillness source (TheSportsDB), fetched ONCE
// offline and COMMITTED to apps/web/public — NEVER a runtime dependency.
//
// TWO-SOURCE LAW (ADR-051 / ADR-062): this file may only ever emit STILLNESS (crests / jerseys / atmosphere /
// player names+positions+faces). It MUST NOT emit anything that moves during a match. assertNoMovement() below
// fails the bake if a movement field ever leaks into the manifest.
//
// RUN (human/agent, once — the free public key "3" is sufficient, no signup needed):
//   node scripts/bake-teams.mjs            # THESPORTSDB_KEY defaults to the free "3"
//   → writes apps/web/public/teams/<wc26-id>/{badge.png,jersey.png,stadium.jpg,players/*.jpg}
//   → writes apps/web/src/data/wc26/media.json  (the manifest the app imports; images served from /public)
//
// Free tier (key "3"): ~1 req/1.5s courtesy throttle on the JSON API; image CDN (r2.thesportsdb.com) is unmetered.
// strStadiumThumb is empty on the free tier, so the atmosphere shot uses strFanart1 (team crowd/stadium). Venue
// search (searchvenues.php) returns nothing on the free key — WC26-venue-specific images (MetLife/Lumen) are NOT
// obtainable; that gap is reported, not faked.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const KEY = process.env.THESPORTSDB_KEY ?? "3";
const API = `https://www.thesportsdb.com/api/v1/json/${KEY}`;
const ROOT = fileURLToPath(new URL("../apps/web/", import.meta.url));
const PUB = ROOT + "public/teams/";
const MANIFEST = ROOT + "src/data/wc26/media.json";
const TEAMS = JSON.parse(readFileSync(ROOT + "src/data/wc26/teams.json", "utf8"));

// Search-name overrides where the country name resolves to the wrong entity on TheSportsDB (verified by probe):
//   COD → "Democratic Republic of the Congo" returns nothing; "DR Congo" is the senior side.
//   USA → "United States" returns the U17 team first; "USA" is the senior men's side.
const SEARCH_ALIAS = { COD: "DR Congo", USA: "USA", BIH: "Bosnia" };
const isSeniorMen = (t) =>
  t.strSport === "Soccer" &&
  (t.strTeamType ?? "").toLowerCase() === "national" &&
  !/\b(u1[5-9]|u2[0-3]|women|ladies|youth|futsal|beach|olympic)\b/i.test(`${t.strTeam} ${t.strAlternate ?? ""}`);

const MOVEMENT = ["goals", "score", "minute", "elapsed", "result", "status", "winner", "price", "mark"];
function assertNoMovement(obj, where) {
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object")
      for (const [k, v] of Object.entries(n)) {
        if (MOVEMENT.includes(k.toLowerCase()))
          throw new Error(`ADR-051 VIOLATION: movement field '${k}' in baked media at ${where}. TheSportsDB bake is stillness only.`);
        walk(v);
      }
  };
  walk(obj);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const ext = (url) => (url.match(/\.(png|jpg|jpeg|webp)(?:\/|$|\?)/i)?.[1] ?? "jpg").toLowerCase().replace("jpeg", "jpg");

async function apiGet(path) {
  const res = await fetch(`${API}${path}`, { headers: { "User-Agent": "omnipitch-bake/1" } });
  if (!res.ok) throw new Error(`TheSportsDB ${path} → ${res.status}`);
  return res.json();
}

// Download to disk unless it already exists (skip-if-exists keeps re-runs cheap under the rate limit).
async function download(url, dest) {
  if (!url) return false;
  if (existsSync(dest)) return true;
  const res = await fetch(url, { headers: { "User-Agent": "omnipitch-bake/1" } });
  if (!res.ok) return false;
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return true;
}

async function bakeTeam(team) {
  const dir = PUB + team.id + "/";
  mkdirSync(dir + "players", { recursive: true });
  const query = SEARCH_ALIAS[team.code] ?? team.name;
  const found = (await apiGet(`/searchteams.php?t=${encodeURIComponent(query)}`))?.teams ?? [];
  const nat = found.find(isSeniorMen) ?? found.filter((t) => t.strSport === "Soccer")[0] ?? found[0];
  if (!nat) return { id: team.id, code: team.code, name: team.name, missed: true };

  const rel = (f) => `/teams/${team.id}/${f}`;
  const entry = { code: team.code, name: team.name, tsdbId: nat.idTeam, tsdbName: nat.strTeam };
  if (await download(nat.strBadge, dir + "badge.png")) entry.badge = rel("badge.png");
  if (await download(nat.strEquipment, dir + "jersey.png")) entry.jersey = rel("jersey.png");
  if (await download(nat.strFanart1 || nat.strStadiumThumb, dir + "stadium.jpg")) entry.stadium = rel("stadium.jpg");

  const players = (await apiGet(`/lookup_all_players.php?id=${nat.idTeam}`))?.player ?? [];
  entry.players = [];
  for (const p of players) {
    const src = p.strThumb || p.strCutout;
    if (!src || !p.strPlayer) continue;
    const file = `players/${slug(p.strPlayer)}.${ext(src)}`;
    if (await download(src, dir + file)) entry.players.push({ name: p.strPlayer, slug: slug(p.strPlayer), pos: p.strPosition ?? "", file: rel(file) });
  }
  return { id: team.id, entry };
}

async function main() {
  mkdirSync(PUB, { recursive: true });
  const prior = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")).teams ?? {} : {};
  const teams = {};
  const missed = [];

  for (const team of TEAMS) {
    // Cheap re-run: if a prior entry has its badge on disk, reuse it and skip the API entirely.
    const p = prior[team.id];
    if (p?.badge && existsSync(ROOT + "public" + p.badge)) {
      teams[team.id] = p;
      console.log(`· ${team.code.padEnd(4)} cached (${p.players?.length ?? 0} players)`);
      continue;
    }
    try {
      const r = await bakeTeam(team);
      if (r.missed) { missed.push(`${team.code} (${team.name})`); console.log(`✗ ${team.code.padEnd(4)} NO MATCH on TheSportsDB`); }
      else {
        teams[team.id] = r.entry;
        console.log(`✓ ${team.code.padEnd(4)} ${r.entry.tsdbName?.padEnd(20)} badge:${!!r.entry.badge} jersey:${!!r.entry.jersey} atm:${!!r.entry.stadium} players:${r.entry.players.length}`);
      }
    } catch (e) {
      missed.push(`${team.code} (${e.message})`);
      console.log(`! ${team.code.padEnd(4)} ${e.message}`);
    }
    await sleep(1500); // courtesy throttle on the free JSON API
  }

  const out = { source: "TheSportsDB (free key) — STILLNESS ONLY (ADR-051/ADR-062)", bakedAt: new Date().toISOString(), teams };
  assertNoMovement(out, "baked media manifest");
  mkdirSync(fileURLToPath(new URL("../apps/web/src/data/wc26/", import.meta.url)), { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify(out, null, 2) + "\n");
  const n = Object.keys(teams).length;
  const withPlayers = Object.values(teams).filter((t) => (t.players?.length ?? 0) > 0).length;
  console.log(`\n✓ baked ${n}/${TEAMS.length} teams (${withPlayers} with player faces) → src/data/wc26/media.json + public/teams/`);
  if (missed.length) console.log(`✗ ${missed.length} unmatched: ${missed.join(", ")}`);
}

main().catch((e) => { console.error("BAKE FAILED:", e?.message || e); process.exit(1); });
