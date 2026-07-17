// REST routes for orders (ADR-071). POST /orders is the core trade action: validate → engine.submit on the
// market's single-writer lane → journal-then-ack → read the applied effects → 200 fill / typed 4xx reject.
// GET /orders reads the Order⨝Fill history from Postgres. This route NEVER touches engine state except through
// engine.submit (the queue) — the single-writer law holds. Play-money: every credit moves via the CreditLedger;
// there is no balance/deposit/payout and no bet/stake/odds vocabulary.
//
// KNOWN LIMITATIONS (ADR-071, flagged by review — follow-ups, not fixed here):
//  • Balance TOCTOU: `balance` is read here and baked into the command; the engine does not re-check it against
//    the ledger at apply time, and the ledger lags by the async projection. Concurrent orders from one user can
//    each read a pre-debit balance and both fill → the CreditLedger can go negative. Play-money-bounded (capped
//    positions, per-match grants). A correct fix is a per-user reservation / balance authority (future ADR).
//  • A reject that resolves AFTER the applied-timeout window (a backed-up lane) is not persisted — reject effects
//    aren't projected. The synchronous path surfaces the common case; a post-timeout reject is invisible in
//    GET /orders. Reject-projection is the follow-up.
import type { FastifyInstance } from "fastify";
import type { Market } from "@prisma/client";
import { prisma } from "../../db";
import { redis } from "../../redis";
import { authFromBearer } from "../../auth/middleware";
import { getBalance } from "../../services/balance";
import { recentOrderTimes, recordOrder } from "../../services/rate-limit";
import { OUTCOMES, isOutcome } from "../../services/quote";
import type { Engine, EngineEffect } from "../../engine";
import type { RejectCode, Side } from "../../engine/order";

const MAX_ORDER_SIZE = 100_000; // guards LMSR overflow; far above any real play-money order
const APPLIED_TIMEOUT_MS = 5_000; // if the lane is backed up, fall back to 202 rather than hang the request

// Typed engine reject → HTTP status. Play-money framing: never 402 (that implies payment) — a rejected trade is
// a 4xx client condition (bad size/outcome → 400, market state → 409, rate → 429, balance/position → 422).
const REJECT_STATUS: Record<RejectCode, number> = {
  INVALID_SIZE: 400,
  INVALID_OUTCOME: 400,
  PRICE_UNAVAILABLE: 409,
  MARKET_HALTED: 409,
  RATE_LIMIT: 429,
  SLIPPAGE: 409,
  INSUFFICIENT_BALANCE: 422,
  INSUFFICIENT_POSITION: 422,
  POSITION_CAP: 422,
};

// Market-fault rejects: NOT the user's trading velocity, so they must not fill the rate window (else a HALTED
// retry storm would rate-limit the user's next legitimate order).
const MARKET_FAULT: ReadonlySet<RejectCode> = new Set(["MARKET_HALTED", "PRICE_UNAVAILABLE"]);

const isReject = (e: EngineEffect): e is Extract<EngineEffect, { type: "reject" }> => e.type === "reject";
const isFill = (e: EngineEffect): e is Extract<EngineEffect, { type: "fill" }> => e.type === "fill";
const logErr = (evt: string, ctx: Record<string, unknown>, err: unknown): void =>
  console.error(JSON.stringify({ evt, ...ctx, msg: String((err as Error)?.message ?? err) }));

export function registerOrderRoutes(app: FastifyInstance, engine: Engine | null): void {
  // POST /orders — place a trade. Body: { matchId, outcome: "H"|"D"|"A", side: "buy"|"sell", size: int, limit? }
  app.post("/orders", async (req, reply) => {
    const user = authFromBearer(req.headers.authorization);
    if (!user) return reply.code(401).send({ error: "unauthenticated" });
    if (!engine) return reply.code(503).send({ error: "engine unavailable" }); // no redis → no single writer wired

    const body = (req.body ?? {}) as { matchId?: unknown; outcome?: unknown; side?: unknown; size?: unknown; limit?: unknown };
    const matchId = typeof body.matchId === "string" ? body.matchId : "";
    if (!matchId) return reply.code(400).send({ error: "matchId required" });
    if (!isOutcome(body.outcome)) return reply.code(400).send({ error: "outcome must be H, D or A" });
    const side: Side | null = body.side === "buy" ? "buy" : body.side === "sell" ? "sell" : null;
    if (!side) return reply.code(400).send({ error: "side must be buy or sell" });
    // Require real JSON numbers — `Number(true)===1`, `Number([5])===5` would otherwise pass the integer check.
    if (typeof body.size !== "number" || !Number.isInteger(body.size) || body.size <= 0 || body.size > MAX_ORDER_SIZE) {
      return reply.code(400).send({ error: `size must be a positive integer ≤ ${MAX_ORDER_SIZE}` });
    }
    const size = body.size;
    if (body.limit !== undefined && (typeof body.limit !== "number" || !Number.isFinite(body.limit))) {
      return reply.code(400).send({ error: "limit must be a finite number" });
    }
    const limit = body.limit as number | undefined;

    const market = (await prisma.market.findFirst({ where: { matchId } })) as Market | null;
    if (!market) return reply.code(404).send({ error: "market not found" }); // validate before any credit read
    if (market.status === "SETTLED" || market.status === "VOIDED") return reply.code(409).send({ error: "market not tradeable" });

    const outcome = OUTCOMES.indexOf(body.outcome); // H=0 D=1 A=2 — the engine's numeric outcome index
    const at = Date.now(); // the order originates HERE → this IS its event-time (a server-authored command)
    // Balance authority = Σ CreditLedger.delta; recent-order window from Redis. See the balance-TOCTOU note above:
    // these are read-then-submit, not re-checked at apply, so a concurrent order from the same user can overspend.
    const [balance, recent] = await Promise.all([getBalance(prisma, user.userId), recentOrderTimes(redis, user.userId, at)]);

    // v1 invariant (emit.ts / startEngine): marketId === matchId. Submit on the matchId lane so the order fills
    // against the SAME journaled AMM state the marks + lifecycle events for this match land on.
    const res = engine.submit(market.matchId, market.matchId, {
      kind: "order",
      at,
      order: { user: user.userId, side, outcome, size, balance, recentOrderTimes: recent, limit },
    });
    if (!res.accepted) {
      if (res.reason === "BACKPRESSURE") return reply.code(503).send({ error: "engine busy, retry" });
      return reply.code(409).send({ error: "market unavailable" }); // UNSERVEABLE — lane quarantined (already alerted)
    }

    try {
      await res.durable; // journal-then-ack: the command is durable before we respond about it
    } catch (err) {
      logErr("orders.journal_failed", { userId: user.userId, matchId }, err);
      return reply.code(503).send({ error: "could not journal order, retry" });
    }

    // Read the effects THIS order produced. Time-boxed: a backed-up lane falls back to 202 rather than hanging.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<"timeout">((r) => {
      timer = setTimeout(() => r("timeout"), APPLIED_TIMEOUT_MS);
    });
    let settled: readonly EngineEffect[] | "timeout";
    try {
      settled = await Promise.race([res.applied, timeout]);
    } catch (err) {
      // applied rejected: engineApply threw AFTER the command was journaled (durable). It will apply
      // deterministically on replay → report processing, not 500 (engine-guardian LOW-1).
      logErr("orders.apply_threw_post_durable", { userId: user.userId, matchId }, err);
      settled = "timeout";
    } finally {
      if (timer) clearTimeout(timer); // don't leak a 5s timer when applied wins the race (the common case)
    }

    if (settled === "timeout") {
      await recordOrder(redis, user.userId, at); // an in-flight submission counts against the rate window
      return reply.code(202).send({ accepted: true, matchId, status: "processing" });
    }

    const effects = settled;
    // An order command always yields ≥1 effect (a fill set, or exactly one reject). An EMPTY array can only come
    // from the engine's quarantined dead-lane branch — the command was DROPPED without journaling. Never report
    // that as "processing" (CRITICAL, silent-failure review).
    if (effects.length === 0) return reply.code(409).send({ error: "market unavailable" });

    const reject = effects.find(isReject);
    if (reject) {
      if (!MARKET_FAULT.has(reject.code)) await recordOrder(redis, user.userId, at); // real attempt → counts
      return reply.code(REJECT_STATUS[reject.code] ?? 409).send({ error: "order rejected", code: reject.code });
    }
    const fill = effects.find(isFill);
    if (!fill) return reply.code(409).send({ error: "market unavailable" }); // non-empty but no fill/reject — defensive

    await recordOrder(redis, user.userId, at); // a filled order counts against the rate window
    // Fill numbers are ENGINE-NATIVE credits (same scale as CreditLedger/balance): price/cost ~0..1 per share, NOT
    // the ×100 display scale quote.ts/portfolio.ts use (a pre-existing inconsistency flagged for quant, ADR-071).
    return reply.code(200).send({
      accepted: true,
      matchId,
      outcome: body.outcome,
      side,
      fill: { size: fill.size, price: fill.price, cost: fill.cost, fee: fill.fee },
      note: "credits in engine-native units (see ADR-071 scaling note)",
    });
  });

  // GET /orders — the caller's order history (open + filled), newest first. Pure Postgres read, no engine.
  app.get("/orders", async (req, reply) => {
    const user = authFromBearer(req.headers.authorization);
    if (!user) return reply.code(401).send({ error: "unauthenticated" });
    const limit = Math.min(200, Math.max(1, Number((req.query as { limit?: string }).limit) || 100));
    const rows = await prisma.order.findMany({
      where: { userId: user.userId },
      orderBy: { ts: "desc" },
      take: limit,
      include: { fills: true, market: { include: { match: true } } },
    });
    const orders = rows.map((o) => {
      const filled = o.fills.reduce((s, f) => s + f.size, 0);
      const credits = o.fills.reduce((s, f) => s + f.price * f.size, 0); // engine-native credits
      const fee = o.fills.reduce((s, f) => s + f.fee, 0);
      return {
        id: o.id,
        ts: o.ts,
        matchId: o.market.matchId,
        home: o.market.match.home, // full name; the frontend derives code + crest from baked wc26 (ADR-051)
        away: o.market.match.away,
        outcome: o.outcome, // H | D | A — the frontend maps to the picked team/DRAW
        side: o.side,
        size: o.size,
        filled,
        status: o.status,
        avgPrice: filled > 0 ? credits / filled : null, // engine-native (0..1); display ×100 downstream
        credits,
        fee,
      };
    });
    return { orders };
  });
}
