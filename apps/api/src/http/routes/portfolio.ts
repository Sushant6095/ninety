// GET /portfolio — the trader's open positions + equity (ADR-046 / ADR-027). Auth-gated; pure read model
// (Prisma Position ⨝ live marks + bal: cache). NEVER touches engine state — orders go through the engine queue.
import type { FastifyInstance } from "fastify";
import { prisma } from "../../db";
import { redis } from "../../redis";
import { authFromBearer } from "../../auth/middleware";
import { getPortfolio } from "../../services/portfolio";

export function registerPortfolioRoutes(app: FastifyInstance): void {
  app.get("/portfolio", async (req, reply) => {
    const user = authFromBearer(req.headers.authorization);
    if (!user) return reply.code(401).send({ error: "unauthenticated" });
    return { portfolio: await getPortfolio(prisma, redis, user.userId) };
  });
}
