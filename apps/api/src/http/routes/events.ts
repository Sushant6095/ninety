// REST routes for the in-play timeline (ADR-072). Serves the SNAPSHOT of a match's recent events + actions from the
// events-read Redis cache (services/events-read.ts); the WS channels m:{id}:events|actions stream the live delta on
// top. Read-only, public, never touches engine state. Two-source law: these are TxLINE-owned in-play events.
import type { FastifyInstance } from "fastify";
import { redis } from "../../redis";
import { getEvents, getActions } from "../../services/events-read";

const clampLimit = (raw: unknown, def: number, max: number): number =>
  Math.min(max, Math.max(1, Number(raw) || def));

// --- OpenAPI schemas (additive). Timeline items are dynamic TxLINE frames → additionalProperties:true. ---
const feedItemSchema = { type: "object", additionalProperties: true, properties: { ts: { type: "number" } } };
const idParamsSchema = { type: "object", additionalProperties: true, properties: { id: { type: "string" } } };
const limitQuerySchema = { type: "object", additionalProperties: true, properties: { limit: { type: "string", description: "max rows (1..200; default 50)" } } };

export function registerEventRoutes(app: FastifyInstance): void {
  // GET /matches/:id/events — significant events (goal, red card, halt/resume, half…), newest first.
  app.get("/matches/:id/events", {
    schema: {
      tags: ["matches"],
      summary: "In-play events snapshot",
      description: "Public. Significant events (goal, red card, halt/resume, half…), newest first, from the events-read cache; the WS m:{id}:events channel streams the live delta on top. TxLINE-owned (two-source law).",
      params: idParamsSchema,
      querystring: limitQuerySchema,
      response: { 200: { type: "object", additionalProperties: true, properties: { matchId: { type: "string" }, events: { type: "array", items: feedItemSchema } } } },
    },
  }, async (req) => {
    const { id } = req.params as { id: string };
    const { limit } = req.query as { limit?: string };
    const events = await getEvents(redis, id, clampLimit(limit, 50, 200));
    return { matchId: id, events };
  });

  // GET /matches/:id/actions — the in-play action feed (shot, free kick, VAR, substitution…), newest first.
  app.get("/matches/:id/actions", {
    schema: {
      tags: ["matches"],
      summary: "In-play actions snapshot",
      description: "Public. The in-play action feed (shot, free kick, VAR, substitution…), newest first, from the events-read cache; the WS m:{id}:actions channel streams the live delta on top. TxLINE-owned (two-source law).",
      params: idParamsSchema,
      querystring: limitQuerySchema,
      response: { 200: { type: "object", additionalProperties: true, properties: { matchId: { type: "string" }, actions: { type: "array", items: feedItemSchema } } } },
    },
  }, async (req) => {
    const { id } = req.params as { id: string };
    const { limit } = req.query as { limit?: string };
    const actions = await getActions(redis, id, clampLimit(limit, 50, 200));
    return { matchId: id, actions };
  });
}
