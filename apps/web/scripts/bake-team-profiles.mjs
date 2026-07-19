#!/usr/bin/env node
// Bake the /team/[code] PROFILE layer (ADR-083). Source: football-data.org v4. STILL data only under the
// two-source law (ADR-051): identity, squads, staff, schedule + FINAL results, league/group tables. Nothing
// that MOVES during a match (live minute, in-play score, halts, prices, results-as-they-happen) is baked —
// that stays TxLINE's. Never fetched at runtime; the page reads only this JSON.
//
// COST (rate-limited, not budget-starved — 10/min free tier). Reality is far cheaper than per-team calls:
//   NATIONS (48): 3 competition-level calls total — /competitions/2000/{teams,matches,standings}. One call
//     each returns ALL 48 teams' identity, EVERY WC match, and ALL 12 group tables. Squads + coaches are
//     already baked (players.json / coaches.json, ADR-081) — we JOIN them, never refetch.
//   CLUBS (10):  2 calls each (/teams/{id} identity+squad+coach, /teams/{id}/matches) + one /standings per
//     distinct domestic league (deduped). ~25 calls. A club id that 404s is logged and skipped (self-verifying
//     the free-tier coverage the prompt says to verify, never assume).
//   Total ≈ 28 calls ≈ 4 min at a 6.5s throttle. RESUMABLE: every raw response is cached under
//   scripts/.cache/team-profiles/, so a 429 mid-run resumes instead of restarting.
//
// CRESTS (ADR-055 — no runtime CDN): nations REUSE the baked flags (TeamCrest → Flag disc by FIFA code).
//   Clubs have no FIFA code, so we download each club crest once into public/crests/{fdId}.{ext}.
//
// SECRET: FOOTBALL_DATA_TOKEN from env, or parsed from apps/api/.env. Never printed, never committed.
//
// Run:  node apps/web/scripts/bake-team-profiles.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "src", "data", "wc26");
const CREST_DIR = join(HERE, "..", "public", "crests");
const CACHE = join(HERE, ".cache", "team-profiles");
const BASE = "https://api.football-data.org/v4";
const COMPETITION = 2000; // FIFA World Cup 2026
const THROTTLE_MS = 6500; // < 10/min, comfortably

// 10 major clubs the free tier covers — verified fd ids + domestic league + route slug. A wrong id 404s and is
// skipped honestly (the prompt: "or whatever football-data's free tier actually covers; verify before assuming").
const CLUBS = [
  { fdId: 81, slug: "barcelona", league: "PD" },
  { fdId: 86, slug: "real-madrid", league: "PD" },
  { fdId: 65, slug: "man-city", league: "PL" },
  { fdId: 64, slug: "liverpool", league: "PL" },
  { fdId: 66, slug: "man-united", league: "PL" },
  { fdId: 57, slug: "arsenal", league: "PL" },
  { fdId: 524, slug: "psg", league: "FL1" },
  { fdId: 61, slug: "chelsea", league: "PL" },
  { fdId: 5, slug: "bayern", league: "BL1" },
  { fdId: 108, slug: "inter", league: "SA" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

// Cached GET with 429 back-off + throttle. `key` names the cache file (resumable). Returns parsed JSON or null on
// a hard non-2xx after retries (caller decides: skip that entity, never fabricate).
async function cachedGet(token, path, key, { optional = false } = {}) {
  const cacheFile = join(CACHE, `${key}.json`);
  if (existsSync(cacheFile)) {
    try {
      return JSON.parse(readFileSync(cacheFile, "utf8"));
    } catch {
      /* corrupt cache — refetch */
    }
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(BASE + path, { headers: { "X-Auth-Token": token, Accept: "application/json" } });
    if (r.ok) {
      const data = await r.json();
      writeFileSync(cacheFile, JSON.stringify(data));
      await sleep(THROTTLE_MS);
      return data;
    }
    if (r.status === 429) {
      console.warn(`  · 429 on ${path} — cooling 60s (attempt ${attempt + 1}/3)`);
      await sleep(60_000);
      continue;
    }
    if (r.status === 404 || r.status === 403) {
      console.warn(`  · ${r.status} on ${path}${optional ? " (optional — skipped)" : ""}`);
      await sleep(THROTTLE_MS);
      return null;
    }
    console.warn(`  · HTTP ${r.status} on ${path} (attempt ${attempt + 1}/3)`);
    await sleep(THROTTLE_MS);
  }
  return null;
}

async function downloadCrest(url, fdId) {
  if (!url) return null;
  const ext = url.split("?")[0].endsWith(".svg") ? "svg" : "png";
  const dest = join(CREST_DIR, `${fdId}.${ext}`);
  const rel = `/crests/${fdId}.${ext}`;
  if (existsSync(dest)) return rel;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(dest, buf);
    return rel;
  } catch {
    return null;
  }
}

// --- name/code matching (ported from fetch-squads.mjs) -------------------------------------------------
const slugify = (s) =>
  String(s).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const normName = (s) => slugify(s).replace(/-/g, "");
const ALIASES = {
  usa: "United States",
  irandotislamicrepublicof: "Iran",
  czechia: "Czech Republic",
  turkiye: "Turkey",
  capeverdeislands: "Cape Verde",
};

// --- match/result helpers ------------------------------------------------------------------------------
const resultFor = (side, winner) => {
  if (!winner) return null;
  if (winner === "DRAW") return "D";
  return (winner === "HOME_TEAM" && side === "home") || (winner === "AWAY_TEAM" && side === "away") ? "W" : "L";
};

function toTeamMatch(fdMatch, side, comp) {
  const ft = fdMatch.score?.fullTime ?? {};
  const finished = fdMatch.status === "FINISHED" && ft.home != null && ft.away != null;
  // crest: null — never bake a CDN url (ADR-055). Sides render by `code` (TeamCrest/flag) or a token disc.
  const t = (x) => ({ code: x?.tla ?? null, name: x?.shortName ?? x?.name ?? "—", crest: null });
  return {
    id: String(fdMatch.id),
    date: fdMatch.utcDate,
    status: fdMatch.status,
    competition: comp ?? { code: fdMatch.competition?.code ?? null, name: fdMatch.competition?.name ?? "—", emblem: null },
    stage: fdMatch.stage ?? null,
    home: t(fdMatch.homeTeam),
    away: t(fdMatch.awayTeam),
    side,
    score: finished ? { h: ft.home, a: ft.away, winner: fdMatch.score?.winner ?? null } : null,
    result: finished ? resultFor(side, fdMatch.score?.winner) : null,
  };
}

// Finished first (most-recent → oldest), then upcoming (soonest → latest) — reads out top-down like the reference.
function sortMatches(matches) {
  const finished = matches.filter((m) => m.score).sort((a, b) => b.date.localeCompare(a.date));
  const upcoming = matches.filter((m) => !m.score).sort((a, b) => a.date.localeCompare(b.date));
  return [...finished, ...upcoming];
}

function standingRow(row, { code = null, crest = null, zone = null } = {}) {
  return {
    position: row.position,
    teamId: String(row.team?.id ?? ""),
    code,
    name: row.team?.shortName ?? row.team?.name ?? "—",
    crest,
    played: row.playedGames ?? 0,
    won: row.won ?? 0,
    draw: row.draw ?? 0,
    lost: row.lost ?? 0,
    gf: row.goalsFor ?? 0,
    ga: row.goalsAgainst ?? 0,
    gd: row.goalDifference ?? 0,
    points: row.points ?? 0,
    form: row.form ?? null, // "W,W,D,L,W" for leagues; null for WC group stage (derived from matches in the UI)
    zone,
  };
}

async function main() {
  const token = loadToken();
  if (!token) throw new Error("FOOTBALL_DATA_TOKEN not set (env or apps/api/.env) — cannot bake team profiles");
  mkdirSync(CACHE, { recursive: true });
  mkdirSync(CREST_DIR, { recursive: true });

  const wcTeams = JSON.parse(readFileSync(join(OUT, "teams.json"), "utf8"));
  const players = JSON.parse(readFileSync(join(OUT, "players.json"), "utf8")); // baked squads, keyed by wc26 id
  const coaches = JSON.parse(readFileSync(join(OUT, "coaches.json"), "utf8"));
  const profFile = JSON.parse(readFileSync(join(OUT, "player-profiles.json"), "utf8"));
  const navigableIds = new Set((profFile.players ?? []).map((p) => String(p.id))); // only these link to /player/[id]

  const byCode = new Map(wcTeams.map((t) => [t.code.toUpperCase(), t]));
  const byNorm = new Map(wcTeams.map((t) => [normName(t.name), t]));
  const resolveTeam = (fd) => {
    if (fd.tla && byCode.has(fd.tla.toUpperCase())) return byCode.get(fd.tla.toUpperCase());
    for (const cand of [fd.name, fd.shortName]) if (cand && byNorm.has(normName(cand))) return byNorm.get(normName(cand));
    const alias = ALIASES[normName(fd.name)] ?? ALIASES[normName(fd.tla ?? "")];
    if (alias && byNorm.has(normName(alias))) return byNorm.get(normName(alias));
    return null;
  };
  const squadFor = (teamId) =>
    players
      .filter((p) => p.teamId === teamId)
      .map((p) => ({ id: String(p.id), name: p.name, pos: p.pos, dob: p.dob, photo: p.photo, navigable: navigableIds.has(String(p.id)) }));
  const coachFor = (teamId) => {
    const c = coaches.find((x) => x.teamId === teamId);
    return c ? { name: c.name, nat: c.nat, photo: c.photo } : null;
  };

  const teams = [];

  // ===== NATIONS ========================================================================================
  console.log("· nations — 3 competition-level calls…");
  const teamsPayload = await cachedGet(token, `/competitions/${COMPETITION}/teams`, "wc-teams");
  const matchesPayload = await cachedGet(token, `/competitions/${COMPETITION}/matches`, "wc-matches");
  const standingsPayload = await cachedGet(token, `/competitions/${COMPETITION}/standings`, "wc-standings");
  if (!teamsPayload) throw new Error("no /competitions/2000/teams payload — cannot bake nations");

  const wcComp = { code: "WC", name: teamsPayload.competition?.name ?? "FIFA World Cup", emblem: null };
  const fdIdToNation = new Map(); // fd team id → wc26 team
  const identity = new Map(); // wc26 id → {founded, venue, clubColors, website, area}
  for (const fd of teamsPayload.teams ?? []) {
    const wc = resolveTeam(fd);
    if (!wc) continue;
    fdIdToNation.set(fd.id, wc);
    identity.set(wc.id, { founded: fd.founded ?? null, venue: fd.venue ?? null, clubColors: fd.clubColors ?? null, website: fd.website ?? null, area: fd.area?.name ?? wc.name });
  }

  // group matches per nation
  const nationMatches = new Map(); // wc26 id → TeamMatch[]
  const pushMatch = (id, tm) => {
    if (!nationMatches.has(id)) nationMatches.set(id, []);
    nationMatches.get(id).push(tm);
  };
  for (const m of matchesPayload?.matches ?? []) {
    const homeWc = fdIdToNation.get(m.homeTeam?.id);
    const awayWc = fdIdToNation.get(m.awayTeam?.id);
    if (homeWc) pushMatch(homeWc.id, toTeamMatch(m, "home", wcComp));
    if (awayWc) pushMatch(awayWc.id, toTeamMatch(m, "away", wcComp));
  }

  // group standings by group letter — top 2 advance (zone), plus honest "best third" note handled in UI
  const groupTables = new Map(); // "A" → rows[]
  for (const s of standingsPayload?.standings ?? []) {
    if (s.type && s.type !== "TOTAL") continue;
    const letter = (s.group ?? "").replace(/^Group\s+/i, "").trim();
    if (!letter) continue;
    const rows = (s.table ?? []).map((row) => {
      const wc = fdIdToNation.get(row.team?.id);
      const zone = row.position <= 2 ? "advance" : null;
      return standingRow(row, { code: wc?.code ?? null, crest: null, zone });
    });
    groupTables.set(letter, rows);
  }

  for (const wc of wcTeams) {
    const id = identity.get(wc.id) ?? {};
    const matches = sortMatches(nationMatches.get(wc.id) ?? []);
    const groupRows = groupTables.get(wc.group) ?? [];
    teams.push({
      code: wc.code, // route key
      kind: "nation",
      fdId: null,
      name: wc.name,
      shortName: null,
      tla: wc.code,
      fifaCode: wc.code,
      crest: null, // nations render via TeamCrest(fifaCode) → baked flag disc (ADR-055)
      country: wc.name,
      group: wc.group,
      founded: id.founded ?? null,
      clubColors: id.clubColors ?? null,
      venue: id.venue ?? null,
      website: id.website ?? null,
      coach: coachFor(wc.id),
      squad: squadFor(wc.id),
      matches,
      standings: groupRows.length ? [{ competition: wcComp.name, groupName: `Group ${wc.group}`, note: "Top 2 advance · best third-placed also qualify", rows: groupRows }] : [],
    });
  }
  console.log(`  ✓ ${teams.length} nations (${teams.filter((t) => t.matches.length).length} with matches, ${teams.filter((t) => t.standings.length).length} with a group table)`);

  // ===== CLUBS ==========================================================================================
  console.log("· clubs…");
  const leagueTables = new Map(); // league code → { name, rows[] (raw fd), total }
  for (const club of CLUBS) {
    const team = await cachedGet(token, `/teams/${club.fdId}`, `club-${club.fdId}`, { optional: true });
    if (!team) {
      console.warn(`  ⚠ club ${club.slug} (${club.fdId}) not on the free tier — skipped honestly`);
      continue;
    }
    const matchesRaw = await cachedGet(token, `/teams/${club.fdId}/matches`, `club-${club.fdId}-matches`, { optional: true });

    // league standings (deduped per competition)
    if (!leagueTables.has(club.league)) {
      const st = await cachedGet(token, `/competitions/${club.league}/standings`, `league-${club.league}`, { optional: true });
      const total = (st?.standings ?? []).find((s) => s.type === "TOTAL");
      leagueTables.set(club.league, { name: st?.competition?.name ?? club.league, table: total?.table ?? [] });
    }
    const lt = leagueTables.get(club.league);
    const nRows = lt.table.length;
    const rows = lt.table.map((row) => {
      const zone = row.position <= 4 ? "advance" : nRows && row.position > nRows - 3 ? "eliminated" : null;
      // crest: null — never bake a CDN url (ADR-055); the club's own row renders its baked local crest, others a token disc.
      return standingRow(row, { code: null, crest: null, zone });
    });

    const crest = await downloadCrest(team.crest, club.fdId);
    const matches = sortMatches((matchesRaw?.matches ?? []).map((m) => {
      const side = m.homeTeam?.id === club.fdId ? "home" : "away";
      return toTeamMatch(m, side, { code: m.competition?.code ?? null, name: m.competition?.name ?? "—", emblem: null });
    }));
    const squad = (team.squad ?? []).map((p) => ({ id: String(p.id), name: p.name, pos: p.position ?? null, dob: p.dateOfBirth ?? null, photo: null, navigable: false }));

    teams.push({
      code: club.slug,
      kind: "club",
      fdId: club.fdId,
      name: team.name,
      shortName: team.shortName ?? null,
      tla: team.tla ?? null,
      fifaCode: null,
      crest, // baked local /crests/{id}.{ext}
      country: team.area?.name ?? null,
      group: null,
      founded: team.founded ?? null,
      clubColors: team.clubColors ?? null,
      venue: team.venue ?? null,
      website: team.website ?? null,
      coach: team.coach?.name ? { name: team.coach.name, nat: team.coach.nationality ?? null, photo: null } : null,
      squad,
      matches,
      standings: rows.length ? [{ competition: lt.name, groupName: null, note: "Top 4 → Champions League · bottom 3 → relegation", rows }] : [],
    });
    console.log(`  ✓ ${club.slug}: ${team.name} — ${matches.length} matches, squad ${squad.length}, crest ${crest ? "baked" : "—"}`);
  }

  // ===== WRITE ==========================================================================================
  const doc = {
    source: "football-data.org v4 (competition 2000 + club endpoints)",
    bakedAt: new Date().toISOString(),
    note: "STILL data only (ADR-051/083). Squads+coaches joined from players.json/coaches.json (ADR-081). Nations reuse baked flags; clubs bake crests into public/crests (ADR-055). Not fetched at runtime.",
    counts: { nations: teams.filter((t) => t.kind === "nation").length, clubs: teams.filter((t) => t.kind === "club").length },
    teams,
  };
  writeFileSync(join(OUT, "team-profiles.json"), JSON.stringify(doc, null, 2) + "\n");
  console.log(`· done. ${doc.counts.nations} nations + ${doc.counts.clubs} clubs → team-profiles.json`);
}

main().catch((e) => {
  console.error("✗ team-profiles bake failed (resumable — cached calls are kept; re-run to continue):", e.message);
  process.exit(1);
});
