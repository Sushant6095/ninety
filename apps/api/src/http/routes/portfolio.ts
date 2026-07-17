// GET /portfolio — the trader's open positions + equity (ADR-046 / ADR-027). Auth-gated; pure read model
// (Prisma Position ⨝ live marks + bal: cache). NEVER touches engine state — orders go through the engine queue.
import type { FastifyInstance } from "fastify";
import { prisma } from "../../db";
import { redis } from "../../redis";
import { authFromBearer } from "../../auth/middleware";
import { getPortfolio } from "../../services/portfolio";

// --- OpenAPI schema (additive). additionalProperties:true keeps every field the read model returns. ---
const positionSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    marketId: { type: "string" },
    outcome: { type: "string", description: "H | D | A" },
    shares: { type: "integer" },
    avgEntry: { type: "number", description: "0..100" },
    markNow: { type: "number", nullable: true, description: "live price 0..100; null when unpriced (never 0, ADR-071)" },
    value: { type: "number", nullable: true },
    pnl: { type: "number", nullable: true },
    pnlPct: { type: "number", nullable: true },
    matchId: { type: "string" },
    home: { type: "string" },
    away: { type: "string" },
    minute: { type: "integer", nullable: true },
    status: { type: "string", description: "LIVE | PRE" },
  },
};
const portfolioResponseSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    portfolio: {
      type: "object",
      additionalProperties: true,
      properties: {
        free: { type: "number", description: "uncommitted credits (play-money)" },
        held: { type: "number" },
        equity: { type: "number" },
        positions: { type: "array", items: positionSchema },
      },
    },
  },
};
const errorSchema = { type: "object", additionalProperties: true, properties: { error: { type: "string" } } };

export function registerPortfolioRoutes(app: FastifyInstance): void {
  app.get("/portfolio", {
    schema: {
      tags: ["portfolio"],
      summary: "Open positions, live P&L, free credits",
      description: "Auth-gated. The trader's open positions ⨝ live marks, plus free credits and total equity. An unpriced market yields markNow:null (never 0). Play-money — credits only, no balance/deposit/payout.",
      security: [{ bearerAuth: [] }],
      response: { 200: portfolioResponseSchema, 401: errorSchema },
    },
  }, async (req, reply) => {
    const user = authFromBearer(req.headers.authorization);
    if (!user) return reply.code(401).send({ error: "unauthenticated" });
    return { portfolio: await getPortfolio(prisma, redis, user.userId) };
  });
}
