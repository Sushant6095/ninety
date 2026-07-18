// REST read-model for the top-20 WC26 player profiles (ADR-082, Session C). STILL data only (ADR-051): identity +
// FINAL tournament results, baked once by apps/web/scripts/bake-player-profiles.mjs into the web app's data dir.
// This route re-serves that same baked file so non-web consumers (search, lineups) have a canonical player
// read-model. It NEVER calls a provider at runtime and NEVER fabricates: if the bake file isn't present (e.g. an
// api-only deploy without the web source), it degrades honestly to 503 — same contract as the rich-data proxy.
import fs from "node:fs";
import path from "node:path";
import type { FastifyInstance } from "fastify";

interface PlayerProfile {
  id: string;
  name: string;
  nat: string;
  natName: string | null;
  pos: string | null;
  shirt: number | null;
  photo: string | null;
  rank: number;
  goals: number;
  assists: number;
  penalties: number;
  playedMatches: number;
  matches: unknown[];
  ninetyIndex: unknown[];
  [k: string]: unknown;
}
interface ProfilesFile {
  source: string;
  bakedAt: string;
  players: PlayerProfile[];
}

const CANDIDATES = [
  path.resolve(process.cwd(), "../web/src/data/wc26/player-profiles.json"), // cwd = apps/api
  path.resolve(process.cwd(), "apps/web/src/data/wc26/player-profiles.json"), // cwd = repo root
];
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (globalThis as any).__dirname === "string") CANDIDATES.push(path.resolve((globalThis as any).__dirname, "../../../../web/src/data/wc26/player-profiles.json"));
} catch {
  /* ESM — no __dirname; the cwd candidates cover dev */
}

/** Load + cache the baked profiles once. Returns null (→ 503) if no candidate path is readable/parseable. */
let cache: ProfilesFile | null | undefined;
function load(): ProfilesFile | null {
  if (cache !== undefined) return cache;
  for (const file of CANDIDATES) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as ProfilesFile;
      if (Array.isArray(parsed.players)) {
        cache = parsed;
        return cache;
      }
    } catch {
      /* try the next candidate */
    }
  }
  cache = null;
  return cache;
}

const summary = (p: PlayerProfile) => ({
  id: p.id,
  name: p.name,
  nat: p.nat,
  natName: p.natName,
  pos: p.pos,
  photo: p.photo,
  rank: p.rank,
  goals: p.goals,
  assists: p.assists,
  playedMatches: p.playedMatches,
});

const unconfigured = { error: "player-profiles not baked", needs: "apps/web/scripts/bake-player-profiles.mjs" };

export function registerPlayerRoutes(app: FastifyInstance): void {
  // GET /players — the top-20 index (ranked by goals+assists). Lightweight summary rows.
  app.get("/players", {
    schema: {
      tags: ["players"],
      summary: "Top-20 WC26 player index",
      description: "Public. The baked top-20 scorers (ADR-082, football-data). STILL data only (ADR-051). 503 if the bake file is absent — never fabricated.",
      response: {
        200: { type: "object", additionalProperties: true, properties: { source: { type: "string" }, bakedAt: { type: "string" }, players: { type: "array", items: { type: "object", additionalProperties: true } } } },
        503: { type: "object", additionalProperties: true, properties: { error: { type: "string" }, needs: { type: "string" } } },
      },
    },
  }, (_req, reply) => {
    const data = load();
    if (!data) return reply.code(503).send(unconfigured);
    return reply.send({ source: data.source, bakedAt: data.bakedAt, players: data.players.map(summary) });
  });

  // GET /players/:id — one full profile (identity + match log + Ninety index). 404 for an unknown id, 503 if unbaked.
  app.get("/players/:id", {
    schema: {
      tags: ["players"],
      summary: "One WC26 player profile",
      description: "Public. Full baked profile for a football-data person id. 404 unknown id · 503 if the bake is absent.",
      params: { type: "object", additionalProperties: true, properties: { id: { type: "string" } } },
      response: {
        200: { type: "object", additionalProperties: true, properties: { player: {} } },
        404: { type: "object", additionalProperties: true, properties: { error: { type: "string" } } },
        503: { type: "object", additionalProperties: true, properties: { error: { type: "string" }, needs: { type: "string" } } },
      },
    },
  }, (req, reply) => {
    const data = load();
    if (!data) return reply.code(503).send(unconfigured);
    const id = (req.params as { id: string }).id;
    const player = data.players.find((p) => p.id === id);
    if (!player) return reply.code(404).send({ error: "player not found" });
    return reply.send({ player });
  });
}
