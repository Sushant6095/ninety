// REST route for the global leaderboard. Reads the projection's `lb:global` Redis zset (ADR-027) then resolves
// each member's display handle from Postgres (the zset stores userId; the board shows @handle). Public.
import type { FastifyInstance } from "fastify";
import { redis } from "../../redis";
import { prisma } from "../../db";
import { getLeaderboard } from "../../services/leaderboard";

// --- OpenAPI schema (additive). ---
const leaderboardResponseSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    leaderboard: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
        properties: {
          rank: { type: "integer" },
          userId: { type: "string" },
          pnl: { type: "number", description: "net credit P&L (play-money)" },
          handle: { type: "string", description: "display handle; client renders the @ prefix" },
        },
      },
    },
  },
};

export function registerLeaderboardRoutes(app: FastifyInstance): void {
  app.get("/leaderboard", {
    schema: {
      tags: ["leaderboard"],
      summary: "Net play-money P&L ranking",
      description: "Public. Top-N traders by net credit P&L (play-money). Reads the lb:global projection.",
      querystring: { type: "object", additionalProperties: true, properties: { limit: { type: "string", description: "max rows (1..200; default 100); non-numeric falls back to the default" } } },
      response: { 200: leaderboardResponseSchema },
    },
  }, async (req) => {
    const limit = Math.min(200, Math.max(1, Number((req.query as { limit?: string }).limit ?? 100)));
    const rows = await getLeaderboard(redis, limit);
    // Resolve userId → handle in one query; the frontend renders the "@" prefix. Falls back to userId if the
    // user row is missing (a zset member without a User row — shouldn't happen, but never drop the ranked row).
    const users = await prisma.user.findMany({ where: { id: { in: rows.map((r) => r.userId) } }, select: { id: true, handle: true } });
    const handleById = new Map(users.map((u) => [u.id, u.handle]));
    return { leaderboard: rows.map((r) => ({ ...r, handle: handleById.get(r.userId) ?? r.userId })) };
  });
}
