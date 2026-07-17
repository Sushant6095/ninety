// REST route for global search (ADR-072). Reads Postgres Match rows only — matches by fixture and the team names
// that appear on them. Teams are not their own model (team metadata is baked worldcup26, ADR-051), so team hits are
// the distinct home/away names that match the query; the frontend derives code + crest/flag from baked wc26.
// Read-only, public, never touches engine state. Live score/status on a hit is TxLINE-owned (two-source rule).
import type { FastifyInstance } from "fastify";
import type { Match } from "@prisma/client";
import { prisma } from "../../db";

const MIN_Q = 2; // below this, a search returns nothing rather than the whole tournament

function matchView(m: Match) {
  return { id: m.id, home: m.home, away: m.away, stage: m.stage, kickoffAt: m.kickoffAt, status: m.status };
}

// --- OpenAPI schema (additive). ---
const searchResponseSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    q: { type: "string" },
    teams: { type: "array", items: { type: "object", additionalProperties: true, properties: { name: { type: "string" } } } },
    matches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "string" },
          home: { type: "string" },
          away: { type: "string" },
          stage: { type: "string" },
          kickoffAt: { type: "string", format: "date-time" },
          status: { type: "string" },
        },
      },
    },
  },
};

export function registerSearchRoutes(app: FastifyInstance): void {
  // GET /search?q=arg&limit= — teams + matches whose names contain the query (case-insensitive).
  app.get("/search", {
    schema: {
      tags: ["search"],
      summary: "Search teams + matches",
      description: "Public. Matches by fixture home/away (case-insensitive); teams are the distinct names that contain the query. `q` must be ≥ 2 chars, else empty results. Client derives code/crest/flag from baked wc26.",
      querystring: { type: "object", additionalProperties: true, properties: { q: { type: "string", description: "query (≥ 2 chars)" }, limit: { type: "string", description: "max matches (1..25; default 10)" } } },
      response: { 200: searchResponseSchema },
    },
  }, async (req) => {
    const q = String((req.query as { q?: string }).q ?? "").trim();
    if (q.length < MIN_Q) return { q, teams: [], matches: [] };
    const limit = Math.min(25, Math.max(1, Number((req.query as { limit?: string }).limit) || 10));

    const rows = (await prisma.match.findMany({
      where: {
        OR: [
          { home: { contains: q, mode: "insensitive" } },
          { away: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { kickoffAt: "asc" },
      take: limit,
    })) as Match[];

    // Distinct team names that actually contain the query (a match can hit on one side only).
    const ql = q.toLowerCase();
    const names = new Set<string>();
    for (const m of rows) {
      if (m.home.toLowerCase().includes(ql)) names.add(m.home);
      if (m.away.toLowerCase().includes(ql)) names.add(m.away);
    }
    const teams = [...names].slice(0, 12).map((name) => ({ name }));
    return { q, teams, matches: rows.map(matchView) };
  });
}
