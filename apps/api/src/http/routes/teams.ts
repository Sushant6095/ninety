// REST route for a team's MATCH LIST — the one rich-data endpoint richdata.ts (Session A) doesn't cover (ADR-083).
// Source: football-data.org GET /teams/{id}/matches (10/min, generous). STILL data only under the two-source law
// (ADR-051): schedule + FINAL results only — the live in-play minute/score stays TxLINE-owned. Backed by the same
// cost-aware cached proxy as /rich/*; degrades honestly (503 unkeyed · 429 budget spent · 502 upstream), never faked.
//
// The /team/[code] PAGE does NOT call this at runtime — it reads baked team-profiles.json (ADR-051). This endpoint
// exists so the rich-data API surface is complete and so the CONNECT live path has a home once un-pinned.
import type { FastifyInstance, FastifyReply } from "fastify";
import { redis } from "../../redis";
import { proxyGet, RichError, type Source } from "../../services/richProxy";

const HOUR = 3600;

// ponytail: 6-line dup of richdata.ts's error/serve helpers — cheaper than exporting from a file Session A owns.
function sendRichError(reply: FastifyReply, err: unknown) {
  if (err instanceof RichError) {
    if (err.code === "UNCONFIGURED") return reply.code(503).send({ error: `${err.source} not configured`, needs: err.detail });
    if (err.code === "BUDGET") return reply.code(429).send({ error: `${err.source} request budget exhausted this window — retry shortly` });
    return reply.code(502).send({ error: `${err.source} upstream error`, detail: err.detail });
  }
  return reply.code(500).send({ error: "rich-data error" });
}

async function serve(reply: FastifyReply, source: Source, path: string, ttl: number) {
  try {
    const r = await proxyGet(redis, source, path, ttl);
    return reply.header("x-rich-cache", r.cached ? "hit" : "miss").send({ source: r.source, cached: r.cached, data: r.data });
  } catch (err) {
    return sendRichError(reply, err);
  }
}

const richErrorSchema = { type: "object", additionalProperties: true, properties: { error: { type: "string" }, needs: { type: "string" }, detail: {} } };
const teamMatchesSchema = {
  tags: ["rich"],
  summary: "Team match list (schedule + final results)",
  description: "Public, env-gated. Cost-aware cached proxy over football-data.org — STILL data only (schedule + FINAL results; live match state is TxLINE's, two-source law). Degrades honestly: 503 {needs} unkeyed · 429 budget spent · 502 upstream — never fabricated.",
  params: { type: "object", additionalProperties: true, properties: { id: { type: "string", description: "football-data team id" } } },
  querystring: {
    type: "object",
    additionalProperties: true,
    properties: {
      status: { type: "string", description: "FINISHED | SCHEDULED | TIMED (defaults to all)" },
      limit: { type: "string", description: "max rows (defaults to provider default)" },
    },
  },
  response: {
    200: { type: "object", additionalProperties: true, properties: { source: { type: "string" }, cached: { type: "boolean" }, data: {} } },
    429: richErrorSchema,
    502: richErrorSchema,
    503: richErrorSchema,
  },
};

export function registerTeamRoutes(app: FastifyInstance): void {
  // GET /rich/teams/:id/matches?status=&limit= — a team's fixtures + results across competitions.
  // TTL 30min: results settle within the hour, the live minute never lives here (TxLINE owns it).
  app.get("/rich/teams/:id/matches", { schema: teamMatchesSchema }, (req, reply) => {
    const id = (req.params as { id: string }).id;
    const q = req.query as { status?: string; limit?: string };
    const params = new URLSearchParams();
    if (q.status && /^[A-Z_]+$/.test(q.status)) params.set("status", q.status);
    if (q.limit && /^\d{1,3}$/.test(q.limit)) params.set("limit", q.limit);
    const qs = params.toString();
    return serve(reply, "football-data", `/teams/${id}/matches${qs ? `?${qs}` : ""}`, HOUR / 2);
  });
}
