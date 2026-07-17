// REST routes for the Next-Goal game (ADR-072). A free, one-tap PREDICTION: which side scores the next goal.
// PLAY-MONEY TO THE CORE — no credits are risked, there is no stake and no payout. A correct pick is resolved by
// the real TxLINE goal event and earns points/streak (leaderboard glory), nothing more. NEVER bet/stake/odds/wager.
// This route only CREATES and READS picks; resolution (OPEN → WON/LOST/VOID) happens in a worker on the goal event
// (two-source law, ADR-051 — the goal is TxLINE-owned), never in the HTTP layer.
import type { FastifyInstance } from "fastify";
import type { Pick } from "@prisma/client";
import { prisma } from "../../db";
import { authFromBearer } from "../../auth/middleware";

const CHOICES = new Set(["home", "away", "none"]); // "none" = you predict no goal before the window closes
const KINDS = new Set(["next_goal"]); // room for next_card / next_corner later — validate against the allowlist

function pickView(p: Pick) {
  return {
    id: p.id,
    matchId: p.matchId,
    kind: p.kind,
    choice: p.choice,
    status: p.status, // OPEN | WON | LOST | VOID
    openMinute: p.openMinute,
    createdAt: p.createdAt,
    resolvedAt: p.resolvedAt,
  };
}

// --- OpenAPI schemas (additive). ---
const pickSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    id: { type: "string" },
    matchId: { type: "string" },
    kind: { type: "string", description: "prediction kind (next_goal)" },
    choice: { type: "string", enum: ["home", "away", "none"] },
    status: { type: "string", description: "OPEN | WON | LOST | VOID" },
    openMinute: { type: "integer", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    resolvedAt: { type: "string", format: "date-time", nullable: true },
  },
};
const errorSchema = { type: "object", additionalProperties: true, properties: { error: { type: "string" }, pick: pickSchema } };

export function registerGameRoutes(app: FastifyInstance): void {
  // POST /games/picks — make a Next-Goal prediction. Body: { matchId, choice: "home"|"away"|"none", kind? }.
  app.post("/games/picks", {
    schema: {
      tags: ["games"],
      summary: "Make a Next-Goal prediction",
      description: "Auth-gated. A free, one-tap prediction of which side scores next. PLAY-MONEY TO THE CORE — nothing is risked, there is no stake and no payout; a correct pick earns points/streak only. 409 if an OPEN pick already exists for this match. Resolution happens worker-side on the real TxLINE goal, never here.",
      security: [{ bearerAuth: [] }],
      body: { type: "object", additionalProperties: true, properties: { matchId: { type: "string" }, choice: { type: "string", enum: ["home", "away", "none"], description: "none = you predict no goal before the window closes" }, kind: { type: "string", description: "prediction kind; defaults to next_goal" } } },
      response: { 201: { type: "object", additionalProperties: true, properties: { pick: pickSchema } }, 400: errorSchema, 401: errorSchema, 404: errorSchema, 409: errorSchema },
    },
  }, async (req, reply) => {
    const user = authFromBearer(req.headers.authorization);
    if (!user) return reply.code(401).send({ error: "unauthenticated" });

    const body = (req.body ?? {}) as { matchId?: unknown; choice?: unknown; kind?: unknown };
    const matchId = typeof body.matchId === "string" ? body.matchId : "";
    if (!matchId) return reply.code(400).send({ error: "matchId required" });
    const choice = typeof body.choice === "string" ? body.choice : "";
    if (!CHOICES.has(choice)) return reply.code(400).send({ error: "choice must be home, away or none" });
    const kind = typeof body.kind === "string" && body.kind ? body.kind : "next_goal";
    if (!KINDS.has(kind)) return reply.code(400).send({ error: "unknown game kind" });

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return reply.code(404).send({ error: "match not found" }); // validate before writing — no picks on bogus ids
    if (match.status === "SETTLED" || match.status === "VOIDED") return reply.code(409).send({ error: "match is over" });

    // One OPEN pick per (user, match, kind) at a time — a new prediction waits until the last one resolves.
    const existing = await prisma.pick.findFirst({ where: { userId: user.userId, matchId, kind, status: "OPEN" } });
    if (existing) return reply.code(409).send({ error: "you already have an open pick for this match", pick: pickView(existing) });

    const pick = await prisma.pick.create({
      data: { userId: user.userId, matchId, kind, choice, openMinute: match.minute ?? null, status: "OPEN" },
    });
    return reply.code(201).send({ pick: pickView(pick) });
  });

  // GET /games/picks — the caller's picks, newest first. Optional ?matchId= filter, ?limit= (≤100).
  app.get("/games/picks", {
    schema: {
      tags: ["games"],
      summary: "The caller's Next-Goal picks",
      description: "Auth-gated. The caller's picks, newest first. Optional matchId filter. Play-money predictions — no stake, no payout.",
      security: [{ bearerAuth: [] }],
      querystring: { type: "object", additionalProperties: true, properties: { matchId: { type: "string" }, limit: { type: "string", description: "max rows (1..100; default 50)" } } },
      response: { 200: { type: "object", additionalProperties: true, properties: { picks: { type: "array", items: pickSchema } } }, 401: errorSchema },
    },
  }, async (req, reply) => {
    const user = authFromBearer(req.headers.authorization);
    if (!user) return reply.code(401).send({ error: "unauthenticated" });
    const q = req.query as { matchId?: string; limit?: string };
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 50));
    const picks = await prisma.pick.findMany({
      where: { userId: user.userId, ...(q.matchId ? { matchId: q.matchId } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return { picks: picks.map(pickView) };
  });
}
