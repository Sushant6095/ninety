// REST routes for markets. Reads Postgres (canonical) + the markets-read Redis cache (live marks). NEVER touches
// engine state directly — orders go through the engine queue.
import type { FastifyInstance } from "fastify";
import type { Market, Match } from "@prisma/client";
import { prisma } from "../../db";
import { redis } from "../../redis";
import { authFromBearer } from "../../auth/middleware";
import { grantMatchCredits, PrismaGrantStore } from "../../auth/grant";
import { getMark, getMarks, type MarkSnapshot } from "../../services/markets-read";
import { quoteTrade, markImpliedQ, isOutcome, hasCompleteFair } from "../../services/quote";

type MarketWithMatch = Market & { match: Match };

const MAX_QUOTE_SIZE = 100_000; // advisory-quote size ceiling — far above any real order; guards LMSR overflow

/** Parse the TxLINE "home-away" score string (e.g. "0-1") into the {home,away} shape the board consumes; null
 *  pre-match or on a malformed value. Match.score is the SSOT live score (ADR-051, TxLINE-owned). */
function parseScore(s: string | null): { home: number; away: number } | null {
  if (!s) return null;
  const parts = s.split("-");
  if (parts.length !== 2) return null; // "-", "1-2-3", …
  const hs = parts[0].trim();
  const as = parts[1].trim();
  if (hs === "" || as === "") return null; // Number("") === 0 must NOT read as a real 0-0 (ADR-071)
  const h = Number(hs);
  const a = Number(as);
  return Number.isInteger(h) && h >= 0 && Number.isInteger(a) && a >= 0 ? { home: h, away: a } : null;
}

/** The market view the frontend consumes (SCREEN-DATA-MAP). `mark` is the live 1X2 distribution, shown ONLY when
 *  the mark is COMPLETE (all of H/D/A) — an over/under feed mark or a low-confidence synthesis renders as
 *  unpriced (`mark: null`), never a fabricated even book (ADR-071). `minute`/`score` are TxLINE-owned live state
 *  read from the Match row (ADR-051 two-source rule). Team codes/flags are derived frontend-side from baked wc26. */
function marketView(m: MarketWithMatch, mark?: MarkSnapshot | null) {
  const priced = !!mark && hasCompleteFair(mark.fair);
  return {
    marketId: m.id,
    matchId: m.matchId,
    kind: m.kind,
    status: m.status, // SCHEDULED | OPEN | LIVE | HALTED | RESOLVING | SETTLED | VOIDED
    home: m.match.home,
    away: m.match.away,
    stage: m.match.stage,
    kickoffAt: m.match.kickoffAt,
    minute: m.match.minute ?? null, // live clock minute (TxLINE); null pre-match/settled
    score: parseScore(m.match.score), // live {home,away}; null pre-match
    mark: priced ? mark!.fair : null, // outcome → probability (0..1); null unless a complete 1X2 mark exists
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
    const b = mark?.bHint || market.bParam; // `||` not `??`: a mark with no b_hint stores bHint=0, which is a
    // degenerate liquidity — fall back to bParam (matches the /quote route). `??` would leak b=0 → q=[0,0,0].
    return {
      market: marketView(market, mark),
      granted,
      // amm: `b` is real. `q` is MARK-IMPLIED (q = b·ln(fair), ADR-046) — an advisory reconstruction for the trade
      // sheet's cost preview, NOT the engine's exact q (that guarded engine-emit stays deferred until fills ship,
      // ADR-042/ADR-026). `spread_mult` is 1 here (the lifecycle reopen-decay lives in the engine). markImplied flags it.
      amm: { q: hasCompleteFair(mark?.fair) ? markImpliedQ(mark!.fair, b) : null, b, spread_mult: 1, markImplied: true as const },
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
    // Upper-bound size: an unbounded size drives the LMSR exp underflow → cost = ±Infinity/NaN, which JSON.stringify
    // silently emits as `null` in a 200. Reject it with a clear 400 instead (MAX_QUOTE_SIZE ≫ any real order).
    if (!Number.isFinite(size) || size <= 0 || size > MAX_QUOTE_SIZE) return reply.code(400).send({ error: `size must be a positive number ≤ ${MAX_QUOTE_SIZE}` });
    const side = query.side === "sell" ? "sell" : "buy";
    const market = (await prisma.market.findFirst({ where: { matchId }, include: { match: true } })) as MarketWithMatch | null;
    if (!market) return reply.code(404).send({ error: "market not found" });
    if (market.status === "SETTLED" || market.status === "VOIDED") return reply.code(409).send({ error: "market not tradeable" }); // stale mark may linger; don't quote a decided market
    const mark = await getMark(redis, market.id);
    // Incomplete mark (over/under feed mark, partial, or low-confidence synthesis) → unpriced. Never quote off a
    // fabricated even book (ADR-071); the mark-implied q would otherwise fall back to a uniform 1/3 distribution.
    if (!hasCompleteFair(mark?.fair)) return reply.code(409).send({ error: "market not priced yet" });
    return { quote: quoteTrade(mark!.fair, mark!.bHint || market.bParam, query.outcome, size, side) };
  });
}
