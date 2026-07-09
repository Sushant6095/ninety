// REST routes for markets. Reads Postgres (canonical) + the markets-read Redis cache (live marks). NEVER touches
// engine state directly — orders go through the engine queue.
import type { FastifyInstance } from "fastify";
import type { Market, Match } from "@prisma/client";
import { prisma } from "../../db";
import { redis } from "../../redis";
import { authFromBearer } from "../../auth/middleware";
import { grantMatchCredits, PrismaGrantStore } from "../../auth/grant";
import { getMark, getMarks, type MarkSnapshot } from "../../services/markets-read";

type MarketWithMatch = Market & { match: Match };

/** The market view the frontend consumes (SCREEN-DATA-MAP). `mark` = the live price distribution; null until priced. */
function marketView(m: MarketWithMatch, mark?: MarkSnapshot | null) {
  return {
    marketId: m.id,
    matchId: m.matchId,
    kind: m.kind,
    status: m.status, // SCHEDULED | OPEN | LIVE | HALTED | RESOLVING | SETTLED | VOIDED
    home: m.match.home,
    away: m.match.away,
    stage: m.match.stage,
    kickoffAt: m.match.kickoffAt,
    mark: mark?.fair ?? null, // outcome → probability (0..1), one-decimal on render
    hazard: mark?.hazard ?? null,
    markTs: mark?.ts ?? null,
    settledOutcome: m.settledOutcome,
    settleSig: m.settleSig, // Solscan tx on a settled market (the chain surface)
  };
}

export function registerMarketRoutes(app: FastifyInstance): void {
  const grantStore = new PrismaGrantStore(prisma);

  // GET /markets — the discovery list (Home). Public. Postgres market list ⨝ live marks from Redis.
  app.get("/markets", async () => {
    const markets = (await prisma.market.findMany({ include: { match: true } })) as MarketWithMatch[];
    const marks = await getMarks(redis, markets.map((m) => m.id));
    return { markets: markets.map((m) => marketView(m, marks.get(m.id))) };
  });

  // GET /markets/:matchId — match detail. Auth-gated; grants the per-match 1,000 credits on FIRST open
  // (idempotent per user·match, prompt 25). Returns {status, mark, amm} — the shape the trade sheet prices from.
  app.get("/markets/:matchId", async (req, reply) => {
    const user = authFromBearer(req.headers.authorization);
    if (!user) return reply.code(401).send({ error: "unauthenticated" });
    const { matchId } = req.params as { matchId: string };
    const market = (await prisma.market.findFirst({ where: { matchId }, include: { match: true } })) as MarketWithMatch | null;
    if (!market) return reply.code(404).send({ error: "market not found" }); // validate BEFORE granting — no farming on bogus matchIds
    const { granted } = await grantMatchCredits(grantStore, user.userId, matchId); // fires once per (user, match)
    const mark = await getMark(redis, market.id);
    return {
      market: marketView(market, mark),
      granted,
      // amm: `b` is real (the LMSR liquidity the live mark implies). `q` (shares outstanding) + `spread_mult` live
      // ONLY in the engine's journaled state and are not yet exposed to a read store — a guarded engine-emit
      // follow-up (ADR-042). Home doesn't need them; the trade sheet's local pricing (Match view) will.
      amm: { q: null as number[] | null, b: mark?.bHint ?? market.bParam, spread_mult: null as number | null },
    };
  });
}
