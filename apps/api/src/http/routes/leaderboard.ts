// REST route for the global leaderboard. Reads the projection's `lb:global` Redis zset (ADR-027) then resolves
// each member's display handle from Postgres (the zset stores userId; the board shows @handle). Public.
import type { FastifyInstance } from "fastify";
import { redis } from "../../redis";
import { prisma } from "../../db";
import { getLeaderboard } from "../../services/leaderboard";

export function registerLeaderboardRoutes(app: FastifyInstance): void {
  app.get("/leaderboard", async (req) => {
    const limit = Math.min(200, Math.max(1, Number((req.query as { limit?: string }).limit ?? 100)));
    const rows = await getLeaderboard(redis, limit);
    // Resolve userId → handle in one query; the frontend renders the "@" prefix. Falls back to userId if the
    // user row is missing (a zset member without a User row — shouldn't happen, but never drop the ranked row).
    const users = await prisma.user.findMany({ where: { id: { in: rows.map((r) => r.userId) } }, select: { id: true, handle: true } });
    const handleById = new Map(users.map((u) => [u.id, u.handle]));
    return { leaderboard: rows.map((r) => ({ ...r, handle: handleById.get(r.userId) ?? r.userId })) };
  });
}
