// Client-side entity search over the BAKED wc26 index (ADR-081). Zero network at query time — this is why
// the palette is instant and works with the API down. This module is HEAVY (imports the 285 KB player index),
// so CommandMenu dynamic-imports it on first open; it must never be imported from an app-wide module.
//
// Ranking is deliberately simple and specified (ADR-081): exact = prefix > word-start > substring, tie-broken
// by entity importance (WC26 teams above players). No fuzzy edit-distance — prefix/word/substring is enough.
import { TEAMS, STADIUMS, GAMES } from "../../data/wc26";
import type { WcPlayer, WcCoach } from "../../data/wc26";
import players from "../../data/wc26/players.json";
import coaches from "../../data/wc26/coaches.json";
import { routes } from "../routes";

export type EntityKind = "team" | "player" | "manager" | "venue" | "competition";

export interface Entity {
  kind: EntityKind;
  id: string; // unique within kind
  name: string; // primary display line
  meta: string; // secondary meta line
  teamCode?: string; // crest fallback + team linkage
  photo?: string | null; // baked local face, or null → crest/flag fallback
  href?: string; // present ⇒ navigable (honesty gate: absent ⇒ informational row, no route to a 404)
  importance: number; // tie-break within an equal text score
}

const IMPORTANCE: Record<EntityKind, number> = { competition: 96, team: 100, venue: 40, manager: 30, player: 20 };

// Curated marquee teams for the empty-state "Suggested" row (kept small + recognisable).
const SUGGESTED_TEAM_CODES = ["BRA", "ARG", "FRA", "ENG", "ESP", "GER", "POR", "NED"];

function ageFrom(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a -= 1;
  return a >= 0 && a < 120 ? a : null;
}

let CACHE: Entity[] | null = null;

/** Build the flat entity list once (memoised). Only entities with a real destination get an `href`. */
export function loadEntities(): Entity[] {
  if (CACHE) return CACHE;
  const list: Entity[] = [];

  // Competition — the tournament itself. Navigable to the group-standings surface.
  list.push({
    kind: "competition",
    id: "wc26",
    name: "FIFA World Cup 2026",
    meta: `${TEAMS.length} teams · ${GAMES.length} matches`,
    href: routes.competition,
    importance: IMPORTANCE.competition,
  });

  // Teams — navigable to /competition (Phase A honest destination; /team/[code] is Phase B).
  for (const t of TEAMS) {
    list.push({
      kind: "team",
      id: t.code,
      name: t.name,
      meta: `Group ${t.group} · World Cup 2026`,
      teamCode: t.code,
      href: routes.competition,
      importance: IMPORTANCE.team,
    });
  }

  // Managers — informational (no page yet). Every fact we hold is on the two lines.
  for (const c of coaches as WcCoach[]) {
    list.push({
      kind: "manager",
      id: c.id,
      name: c.name,
      meta: `Manager · ${c.teamName}`,
      teamCode: c.teamCode,
      photo: c.photo,
      importance: IMPORTANCE.manager,
    });
  }

  // Venues — informational. City/country + capacity.
  for (const s of STADIUMS) {
    list.push({
      kind: "venue",
      id: s.id,
      name: s.name,
      meta: `${s.city}, ${s.country} · ${s.capacity.toLocaleString("en-US")} seats`,
      importance: IMPORTANCE.venue,
    });
  }

  // Players — informational. Position · club · age.
  for (const p of players as WcPlayer[]) {
    const age = ageFrom(p.dob);
    list.push({
      kind: "player",
      id: p.id,
      name: p.name,
      meta: `${p.pos ?? "Player"} · ${p.teamName}${age != null ? ` · ${age}` : ""}`,
      teamCode: p.teamCode,
      photo: p.photo,
      importance: IMPORTANCE.player,
    });
  }

  CACHE = list;
  return list;
}

// Text score: lower is a better match; -1 means no match.
function score(name: string, q: string): number {
  const n = name.toLowerCase();
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.split(/[\s'’.-]+/).some((w) => w.startsWith(q))) return 2; // word-start
  if (n.includes(q)) return 3;
  return -1;
}

/** Rank entities for a query, optionally restricted to certain kinds. Sorted best-first, capped by `limit`. */
export function rankEntities(query: string, kinds: EntityKind[] | null, limit = 60): Entity[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const pool = loadEntities();
  const scored: { e: Entity; s: number }[] = [];
  for (const e of pool) {
    if (kinds && !kinds.includes(e.kind)) continue;
    const s = score(e.name, q);
    if (s < 0) continue;
    scored.push({ e, s });
  }
  scored.sort((a, b) => a.s - b.s || b.e.importance - a.e.importance || a.e.name.localeCompare(b.e.name));
  return scored.slice(0, limit).map((x) => x.e);
}

/** Empty-state suggestions: the tournament + a handful of marquee teams. */
export function suggestedEntities(): Entity[] {
  const pool = loadEntities();
  const comp = pool.find((e) => e.kind === "competition");
  const teams = SUGGESTED_TEAM_CODES.map((code) => pool.find((e) => e.kind === "team" && e.id === code)).filter(
    (e): e is Entity => !!e,
  );
  return comp ? [comp, ...teams] : teams;
}
