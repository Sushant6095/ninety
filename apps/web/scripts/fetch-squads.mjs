#!/usr/bin/env node
// Bake the WC26 ROSTER layer at build time (ADR-081). Source: football-data.org v4, competition 2000
// (FIFA World Cup, season 2026). This is STILL data — squads, staff, match officials — so baking it is
// correct under the two-source law (ADR-051): TxLINE still owns everything that MOVES (scores, prices,
// halts, results). Nothing here is fetched at runtime; the ⌘K entity search reads only these JSON files.
//
// COST: the /competitions/2000/teams payload already embeds each team's full squad AND coach, so the whole
// roster is ONE request, not 48. Plus one /matches request for referees. Two calls total — well under the
// free tier's 10/min. (The original plan budgeted 48 per-team calls; reality is far cheaper.)
//
// PHOTOS: football-data has no player images. We already bake TheSportsDB faces into public/teams/{id}/players
// (media.json). We attach a photo by slug-matching within the same team; unmatched players fall back to the
// team crest/flag in the UI (honest — never a wrong face).
//
// SECRET: FOOTBALL_DATA_TOKEN from env, or parsed from apps/api/.env if absent. Never printed, never committed.
//
// Run:  pnpm wc26:refresh   (runs fetch-wc26.mjs then this)

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "src", "data", "wc26");
const BASE = "https://api.football-data.org/v4";
const COMPETITION = 2000;

function loadToken() {
  if (process.env.FOOTBALL_DATA_TOKEN) return process.env.FOOTBALL_DATA_TOKEN;
  try {
    const env = readFileSync(join(HERE, "..", "..", "api", ".env"), "utf8");
    const m = env.match(/^FOOTBALL_DATA_TOKEN=(.*)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    /* no local .env — fall through */
  }
  return null;
}

async function get(token, path) {
  const r = await fetch(BASE + path, { headers: { "X-Auth-Token": token, Accept: "application/json" } });
  if (!r.ok) throw new Error(`GET ${path} -> HTTP ${r.status}`);
  return r.json();
}

// Slug matching TheSportsDB's kebab convention in media.json (accent-stripped, lowercase, hyphenated).
const slugify = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Normalise a team name for fuzzy comparison (accent/punct-insensitive).
const normName = (s) => slugify(s).replace(/-/g, "");

// football-data team name (or tla) → our wc26 team, when tla and name both miss.
const ALIASES = {
  usa: "United States",
  "koreardpr": "North Korea",
  "irandotislamicrepublicof": "Iran",
  czechia: "Czech Republic",
  turkiye: "Turkey",
  "capeverdeislands": "Cape Verde",
};

async function main() {
  const token = loadToken();
  if (!token) throw new Error("FOOTBALL_DATA_TOKEN not set (env or apps/api/.env) — cannot bake roster");

  // wc26 teams (the identity we bake against) + baked TheSportsDB media (for photos).
  const wcTeams = JSON.parse(readFileSync(join(OUT, "teams.json"), "utf8"));
  const media = JSON.parse(readFileSync(join(OUT, "media.json"), "utf8")).teams; // keyed by wc26 id
  const byCode = new Map(wcTeams.map((t) => [t.code.toUpperCase(), t]));
  const byNorm = new Map(wcTeams.map((t) => [normName(t.name), t]));

  const resolveTeam = (fd) => {
    if (fd.tla && byCode.has(fd.tla.toUpperCase())) return byCode.get(fd.tla.toUpperCase());
    for (const cand of [fd.name, fd.shortName]) {
      if (cand && byNorm.has(normName(cand))) return byNorm.get(normName(cand));
    }
    const alias = ALIASES[normName(fd.name)] ?? ALIASES[normName(fd.tla ?? "")];
    if (alias && byNorm.has(normName(alias))) return byNorm.get(normName(alias));
    return null;
  };

  // Photo path for a player, by slug within the matched wc26 team's media entry.
  const photoFor = (wc, playerName) => {
    const m = media[wc.id];
    if (!m) return null;
    const slug = slugify(playerName);
    const hit = m.players.find((p) => p.slug === slug);
    return hit ? hit.file : null;
  };

  console.log(`· football-data.org WC26 (competition ${COMPETITION}) roster bake…`);
  const teamsPayload = await get(token, `/competitions/${COMPETITION}/teams`);
  const fdTeams = teamsPayload.teams ?? [];
  console.log(`  fetched ${fdTeams.length} teams`);

  const players = [];
  const coaches = [];
  const unmatched = [];

  for (const fd of fdTeams) {
    const wc = resolveTeam(fd);
    if (!wc) {
      unmatched.push(`${fd.name}${fd.tla ? ` (${fd.tla})` : ""}`);
      continue;
    }
    for (const p of fd.squad ?? []) {
      if (!p?.name) continue;
      players.push({
        id: String(p.id),
        name: p.name,
        pos: p.position ?? null,
        dob: p.dateOfBirth ?? null,
        nat: p.nationality ?? null,
        teamId: wc.id,
        teamCode: wc.code,
        teamName: wc.name,
        photo: photoFor(wc, p.name),
      });
    }
    if (fd.coach?.name) {
      coaches.push({
        id: String(fd.coach.id ?? `${wc.code}-coach`),
        name: fd.coach.name,
        nat: fd.coach.nationality ?? null,
        teamId: wc.id,
        teamCode: wc.code,
        teamName: wc.name,
        photo: photoFor(wc, fd.coach.name),
      });
    }
  }

  // Referees — from the match payload's per-match `referees` array, deduped by name.
  const matchesPayload = await get(token, `/competitions/${COMPETITION}/matches`);
  const refMap = new Map();
  for (const m of matchesPayload.matches ?? []) {
    for (const r of m.referees ?? []) {
      if (r?.name && !refMap.has(r.name)) refMap.set(r.name, { name: r.name, nat: r.nationality ?? null });
    }
  }
  const referees = [...refMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  if (unmatched.length) console.warn(`  ⚠ ${unmatched.length} fd team(s) unmatched to wc26: ${unmatched.join(", ")}`);
  const withPhoto = players.filter((p) => p.photo).length;

  const write = (name, data) => {
    writeFileSync(join(OUT, `${name}.json`), JSON.stringify(data, null, 2) + "\n");
    console.log(`  ✓ ${name}.json (${data.length})`);
  };
  write("players", players.sort((a, b) => a.name.localeCompare(b.name)));
  write("coaches", coaches.sort((a, b) => a.name.localeCompare(b.name)));
  write("referees", referees);

  console.log(`· done. players=${players.length} (${withPhoto} with photo) · coaches=${coaches.length} · referees=${referees.length}`);
  if (unmatched.length) {
    console.error(`✗ ${unmatched.length} team(s) unmatched — add to ALIASES and re-run (refusing silent gaps).`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("✗ squad bake failed (no files written on a hard error):", e.message);
  process.exit(1);
});
