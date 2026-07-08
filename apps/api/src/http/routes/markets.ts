// REST routes for markets. Reads Postgres/Redis. NEVER touches engine state directly — orders go through the engine queue.
import type { FastifyInstance } from "fastify";
import { prisma } from "../../db";
import { authFromBearer } from "../../auth/middleware";
import { grantMatchCredits, PrismaGrantStore } from "../../auth/grant";

export function registerMarketRoutes(app: FastifyInstance): void {
  const grantStore = new PrismaGrantStore(prisma);
  // Opening a match's market grants the per-match 1,000 credits on FIRST open (idempotent per user·match, prompt 25).
  app.get("/markets/:matchId", async (req, reply) => {
    const user = authFromBearer(req.headers.authorization);
    if (!user) return reply.code(401).send({ error: "unauthenticated" });
    const { matchId } = req.params as { matchId: string };
    const market = await prisma.market.findFirst({ where: { matchId } });
    if (!market) return reply.code(404).send({ error: "market not found" }); // validate BEFORE granting — no farming grants on bogus matchIds
    const { granted } = await grantMatchCredits(grantStore, user.userId, matchId); // fires once per (user, match)
    return { market, granted };
  });
}
