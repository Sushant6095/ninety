// REST routes for rich STILL data (ADR-072) — squads, standings, scorers, H2H, lineups, player bios. Backed by the
// cost-aware cached proxy (services/richProxy.ts). Two-source law (ADR-051): NOTHING here is live match state —
// scores/goals/halts/prices/results are TxLINE-owned. These endpoints degrade honestly: a missing key → 503 (never
// fake data), an exhausted per-source budget → 429.
//
// ROUTING (spend the scarce provider only on the gaps):
//   Football-Data.org (10/min, generous)  → standings · teams/squads · scorers · head-to-head
//   API-Football (100/DAY, scarce, deep)   → lineups/formations · player stats · injuries  (FD.org has none of these)
//
// NOTE on ids: providers use their OWN fixture/team/competition ids (not TxLINE match ids). Callers pass the
// provider-native id; the TxLINE↔provider mapping is a separate concern (baked worldcup26 / a mapping table).
import type { FastifyInstance } from "fastify";
import { redis } from "../../redis";
import { proxyGet, RichError, type Source } from "../../services/richProxy";

const HOUR = 3600;

function sendRichError(reply: import("fastify").FastifyReply, err: unknown) {
  if (err instanceof RichError) {
    if (err.code === "UNCONFIGURED") return reply.code(503).send({ error: `${err.source} not configured`, needs: err.detail });
    if (err.code === "BUDGET") return reply.code(429).send({ error: `${err.source} request budget exhausted this window — retry shortly` });
    return reply.code(502).send({ error: `${err.source} upstream error`, detail: err.detail });
  }
  return reply.code(500).send({ error: "rich-data error" });
}

async function serve(reply: import("fastify").FastifyReply, source: Source, path: string, ttl: number) {
  try {
    const r = await proxyGet(redis, source, path, ttl);
    return reply.header("x-rich-cache", r.cached ? "hit" : "miss").send({ source: r.source, cached: r.cached, data: r.data });
  } catch (err) {
    return sendRichError(reply, err);
  }
}

// --- OpenAPI schemas (additive). One response shape reused across every /rich/* route. `data` is arbitrary
// provider JSON (object or array) → typed `{}` (any) so the serializer passes it through unchanged. ---
const richErrorSchema = { type: "object", additionalProperties: true, properties: { error: { type: "string" }, needs: { type: "string", description: "the ENV var to configure (503 UNCONFIGURED)" }, detail: {} } };
const richResponse = {
  200: { type: "object", additionalProperties: true, properties: { source: { type: "string" }, cached: { type: "boolean" }, data: {} } },
  429: richErrorSchema,
  502: richErrorSchema,
  503: richErrorSchema,
};
const richParams = (name: string) => ({ type: "object", additionalProperties: true, properties: { [name]: { type: "string" } } });
const richSchema = (summary: string, params: string) => ({
  tags: ["rich"],
  summary,
  description: "Public, env-gated. Cost-aware cached proxy over free providers — STILL data only (never live match state, two-source law). Degrades honestly: 503 {needs} if the source is unkeyed, 429 if the per-source budget is spent, 502 on upstream error — never fabricated.",
  params: richParams(params),
  response: richResponse,
});

export function registerRichDataRoutes(app: FastifyInstance): void {
  // --- Football-Data.org (generous) --------------------------------------------------------------
  // GET /rich/standings/:competition — league/group table. Cache 1h (tables move slowly).
  app.get("/rich/standings/:competition", { schema: richSchema("Standings (league/group table)", "competition") }, (req, reply) =>
    serve(reply, "football-data", `/competitions/${(req.params as { competition: string }).competition}/standings`, HOUR));

  // GET /rich/scorers/:competition — top scorers. Cache 1h.
  app.get("/rich/scorers/:competition", { schema: richSchema("Top scorers", "competition") }, (req, reply) =>
    serve(reply, "football-data", `/competitions/${(req.params as { competition: string }).competition}/scorers`, HOUR));

  // GET /rich/teams/:id — team + squad. Cache 12h (squads are stable within a tournament).
  app.get("/rich/teams/:id", { schema: richSchema("Team + squad", "id") }, (req, reply) =>
    serve(reply, "football-data", `/teams/${(req.params as { id: string }).id}`, 12 * HOUR));

  // GET /rich/matches/:id/h2h — head-to-head history. Cache 24h.
  app.get("/rich/matches/:id/h2h", { schema: richSchema("Head-to-head history", "id") }, (req, reply) =>
    serve(reply, "football-data", `/matches/${(req.params as { id: string }).id}/head2head?limit=10`, 24 * HOUR));

  // --- API-Football (scarce; only the gaps FD.org can't fill) -------------------------------------
  // GET /rich/lineups/:fixture — starting XI + formation + coach. Cache 6h (posted ~1h pre-kickoff, then fixed).
  app.get("/rich/lineups/:fixture", { schema: richSchema("Lineups (XI + formation + coach)", "fixture") }, (req, reply) =>
    serve(reply, "api-football", `/fixtures/lineups?fixture=${(req.params as { fixture: string }).fixture}`, 6 * HOUR));

  // GET /rich/players/:id?season=2026 — detailed player stats/bio. Cache 6h.
  app.get("/rich/players/:id", {
    schema: {
      ...richSchema("Player stats/bio", "id"),
      querystring: { type: "object", additionalProperties: true, properties: { season: { type: "string", description: "season year; defaults to the current UTC year" } } },
    },
  }, (req, reply) => {
    const id = (req.params as { id: string }).id;
    const season = String((req.query as { season?: string }).season ?? new Date().getUTCFullYear());
    return serve(reply, "api-football", `/players?id=${id}&season=${season}`, 6 * HOUR);
  });

  // GET /rich/injuries/:fixture — injuries/suspensions for a fixture. Cache 1h.
  app.get("/rich/injuries/:fixture", { schema: richSchema("Injuries/suspensions", "fixture") }, (req, reply) =>
    serve(reply, "api-football", `/injuries?fixture=${(req.params as { fixture: string }).fixture}`, HOUR));
}
