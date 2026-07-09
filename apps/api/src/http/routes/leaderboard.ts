// REST route for the global leaderboard. Reads the projection's `lb:global` Redis zset (ADR-027). Public.
import type { FastifyInstance } from "fastify";
import { redis } from "../../redis";
import { getLeaderboard } from "../../services/leaderboard";

export function registerLeaderboardRoutes(app: FastifyInstance): void {
  app.get("/leaderboard", async (req) => {
    const limit = Math.min(200, Math.max(1, Number((req.query as { limit?: string }).limit ?? 100)));
    return { leaderboard: await getLeaderboard(redis, limit) };
  });
}
