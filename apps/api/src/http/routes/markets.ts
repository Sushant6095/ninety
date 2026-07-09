// REST routes for markets. Reads Postgres (canonical) + the markets-read Redis cache (live marks). NEVER touches
// engine state directly — orders go through the engine queue.
import type { FastifyInstance } from "fastify";
import type { Market, Match } from "@prisma/client";
import { prisma } from "../../db";
import { redis } from "../../redis";
import { authFromBearer } from "../../auth/middleware";
import { grantMatchCredits, PrismaGrantStore } from "../../auth/grant";
import { getMark, getMarks, type MarkSnapshot } from "../../services/markets-read";
import { quoteTrade, markImpliedQ, isOutcome } from "../../services/quote";

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
    const b = mark?.bHint ?? market.bParam;
    return {
      market: marketView(market, mark),
      granted,
      // amm: `b` is real. `q` is MARK-IMPLIED (q = b·ln(fair), ADR-046) — an advisory reconstruction for the trade
      // sheet's cost preview, NOT the engine's exact q (that guarded engine-emit stays deferred until fills ship,
      // ADR-042/ADR-026). `spread_mult` is 1 here (the lifecycle reopen-decay lives in the engine). markImplied flags it.
      amm: { q: mark?.fair ? markImpliedQ(mark.fair, b) : null, b, spread_mult: 1, markImplied: true as const },
    };
  });

  // GET /markets/:matchId/quote?outcome=A&size=60&side=buy — advisory LMSR cost preview (ADR-046). Auth-gated.
  // Reconstructs mark-implied q from the live mark and reuses the pure engine amm.buyCost. Server price wins at fill.
  app.get("/markets/:matchId/quote", async (req, reply) => {
    const user = authFromBearer(req.headers.authorization);
    if (!user) return reply.code(401).send({ error: "unauthenticated" });
    const { matchId } = req.params as { matchId: string };
    const query = req.query as { outcome?: string; size?: string; side?: string };
    if (!isOutcome(query.outcome)) return reply.code(400).send({ error: "outcome must be H, D or A" });
    const size = Number(query.size);
    if (!Number.isFinite(size) || size <= 0) return reply.code(400).send({ error: "size must be a positive number" });
    const side = query.side === "sell" ? "sell" : "buy";
    const market = (await prisma.market.findFirst({ where: { matchId }, include: { match: true } })) as MarketWithMatch | null;
    if (!market) return reply.code(404).send({ error: "market not found" });
    const mark = await getMark(redis, market.id);
    if (!mark?.fair) return reply.code(409).send({ error: "market not priced yet" });
    return { quote: quoteTrade(mark.fair, mark.bHint || market.bParam, query.outcome, size, side) };
  });
}
