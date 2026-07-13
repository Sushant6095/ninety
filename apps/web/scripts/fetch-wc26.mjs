#!/usr/bin/env node
// Bake the WC26 CONTEXT layer at build time. Source: worldcup26.ir (rezarahiminia/worldcup2026, ISC).
//
// THE HARD RULE (ADR-051): worldcup26 owns things that SIT STILL — flags, names, stadiums, group
// draw, the bracket skeleton. TxLINE owns everything that MOVES — live scores, goals, prices,
// settlement. So this script STRIPS every live field (scores, scorers, finished, time_elapsed) and
// nulls knockout team resolutions (those depend on real results = TxLINE/reality, not worldcup26's
// own simulation). What lands in src/data/wc26/*.json is static context only. Zero network at runtime.
//
// Run:  pnpm wc26:refresh   (from apps/web)
// It validates hard (exact counts + required keys) and writes all four files atomically or none.

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BASE = "https://worldcup26.ir";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "wc26");

const EXPECT = { teams: 48, groups: 12, stadiums: 16, games: 104 };
const KNOCKOUT = new Set(["r32", "r16", "qf", "sf", "third", "final"]);

const num = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`expected number, got ${JSON.stringify(v)}`);
  return n;
};
const req = (obj, keys, where) => {
  for (const k of keys) if (obj[k] === undefined || obj[k] === null) throw new Error(`${where}: missing "${k}" in ${JSON.stringify(obj).slice(0, 120)}`);
};

async function get(path) {
  const r = await fetch(BASE + path, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`GET ${path} -> HTTP ${r.status}`);
  return r.json();
}

function assertCount(name, arr) {
  if (!Array.isArray(arr)) throw new Error(`${name}: expected an array`);
  if (arr.length !== EXPECT[name]) throw new Error(`${name}: expected ${EXPECT[name]} rows, got ${arr.length} — API drift, refusing to write`);
}

async function main() {
  console.log("· fetching worldcup26 context (teams · groups · stadiums · games)…");
  const [teamsRaw, groupsRaw, stadiumsRaw, gamesRaw] = await Promise.all([
    get("/get/teams").then((d) => d.teams),
    get("/get/groups").then((d) => d.groups),
    get("/get/stadiums").then((d) => d.stadiums),
    get("/get/games").then((d) => d.games),
  ]);
  assertCount("teams", teamsRaw);
  assertCount("groups", groupsRaw);
  assertCount("stadiums", stadiumsRaw);
  assertCount("games", gamesRaw);

  // --- teams: static identity only ---
  const teams = teamsRaw.map((t) => {
    req(t, ["id", "name_en", "fifa_code", "iso2", "flag", "groups"], "team");
    return { id: String(t.id), name: t.name_en, code: t.fifa_code, iso2: String(t.iso2).toLowerCase(), flag: t.flag, group: t.groups };
  }).sort((a, b) => Number(a.id) - Number(b.id));

  // --- groups: the draw + standings (pts/gf/ga are the group table, static between matches) ---
  const groups = groupsRaw.map((g) => {
    req(g, ["name", "teams"], "group");
    const standings = g.teams.map((s) => {
      req(s, ["team_id", "mp", "w", "d", "l", "gf", "ga", "gd", "pts"], `group ${g.name} row`);
      return { teamId: String(s.team_id), mp: num(s.mp), w: num(s.w), d: num(s.d), l: num(s.l), gf: num(s.gf), ga: num(s.ga), gd: num(s.gd), pts: num(s.pts) };
    }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    return { name: g.name, standings };
  }).sort((a, b) => a.name.localeCompare(b.name));

  // --- stadiums: name/city/country/capacity ---
  const stadiums = stadiumsRaw.map((s) => {
    req(s, ["id", "name_en", "city_en", "country_en", "capacity"], "stadium");
    return { id: String(s.id), name: s.name_en, fifaName: s.fifa_name ?? null, city: s.city_en, country: s.country_en, capacity: num(s.capacity), region: s.region ?? null };
  }).sort((a, b) => Number(a.id) - Number(b.id));

  // --- games: STATIC skeleton only. Strip scores/finished/elapsed/scorers. Knockout team refs -> null
  //     (results are TxLINE/reality's, never worldcup26's); keep the static placeholder labels. ---
  const games = gamesRaw.map((g) => {
    req(g, ["id", "type", "matchday", "local_date", "stadium_id"], "game");
    const isKO = KNOCKOUT.has(g.type);
    return {
      id: String(g.id),
      type: g.type,
      matchday: num(g.matchday),
      kickoff: g.local_date, // "MM/DD/YYYY HH:MM" venue-local; UI formats
      stadiumId: String(g.stadium_id),
      homeTeamId: isKO ? null : String(g.home_team_id),
      awayTeamId: isKO ? null : String(g.away_team_id),
      homeLabel: g.home_team_label ?? null, // "Winner Group A" / "Winner Match 101" (knockouts)
      awayLabel: g.away_team_label ?? null,
    };
  }).sort((a, b) => Number(a.id) - Number(b.id));

  mkdirSync(OUT, { recursive: true });
  const write = (name, data) => {
    writeFileSync(join(OUT, `${name}.json`), JSON.stringify(data, null, 2) + "\n");
    console.log(`  ✓ ${name}.json (${data.length})`);
  };
  write("teams", teams);
  write("groups", groups);
  write("stadiums", stadiums);
  write("games", games);
  console.log("· done. Committed JSON is the only WC26 context source; runtime never calls worldcup26.");
}

main().catch((e) => {
  console.error("✗ wc26 bake failed (no files written):", e.message);
  process.exit(1);
});
