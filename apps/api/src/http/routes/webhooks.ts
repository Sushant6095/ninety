// POST /webhooks/helius (prompt 23): verify the shared secret → record settle txs to chain_events (idempotent by
// sig) → publish a settled envelope to the bus (source=chain). Reads the on-chain settle from a Helius enhanced
// payload; the pure parse/dispatch lives in @omnipitch/chain (unit-tested there).
import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { Bus } from "@omnipitch/bus";
import { TOPICS, type Envelope } from "@omnipitch/schema";
import { processHeliusWebhook, verifyHeliusSecret, type HeliusTx } from "@omnipitch/chain";
import { prisma } from "../../db";

const PROGRAM_ID = process.env.OMNIPITCH_PROGRAM_ID ?? "6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj";

// deterministic uuid from the tx sig → the settled envelope's event_id is stable (a webhook retry dedups downstream).
const uuidFromSig = (sig: string): string => {
  const h = createHash("sha256").update(`chain:settled:${sig}`).digest("hex").slice(0, 32);
  const v = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${v}${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

const settledEnvelope = (e: { matchId: string; result: string; sig: string }): Envelope => {
  const nowIso = new Date().toISOString();
  return { event_id: uuidFromSig(e.sig), source: "chain", source_seq: 0, match_id: e.matchId, market_id: e.matchId, ts_source: nowIso, ts_ingest: nowIso, type: "settled", payload: { result: e.result, sig: e.sig } };
};

export function registerWebhookRoutes(app: FastifyInstance, bus: Bus): void {
  // Body is a Helius enhanced payload (array of txs, or { transactions: [...] }) — left unschematised so the
  // array form is never rejected. Auth is a shared secret (Authorization header or ?secret=), not a bearer JWT.
  app.post("/webhooks/helius", {
    schema: {
      tags: ["system"],
      summary: "Helius settlement webhook",
      description: "Verifies the shared secret (Authorization header or ?secret=), records settle txs to chain_events (idempotent by sig), and publishes a settled envelope to the bus. Not a bearer route.",
      response: { 200: { type: "object", additionalProperties: true, properties: { ok: { type: "boolean" } } }, 401: { type: "object", additionalProperties: true, properties: { error: { type: "string" } } } },
    },
  }, async (req, reply) => {
    const secret = (req.headers.authorization as string | undefined) ?? (req.query as { secret?: string }).secret;
    if (!verifyHeliusSecret(secret, process.env.HELIUS_WEBHOOK_SECRET)) return reply.code(401).send({ error: "unauthorized" });
    const body = req.body as HeliusTx[] | { transactions?: HeliusTx[] };
    const txs = Array.isArray(body) ? body : (body?.transactions ?? []);
    const result = await processHeliusWebhook(txs, PROGRAM_ID, {
      writeChainEvent: async (ev) => {
        await prisma.chainEvent.upsert({ where: { sig: ev.sig }, update: {}, create: { sig: ev.sig, program: ev.program, kind: ev.kind, payload: ev.payload as object, slot: BigInt(ev.slot) } });
      },
      resolveMatchId: async (marketAccount) => (await prisma.market.findFirst({ where: { id: marketAccount } }))?.matchId ?? null,
      publishSettled: async (ev) => {
        await bus.publish(TOPICS.settlement, ev.matchId, settledEnvelope(ev));
      },
    });
    return { ok: true, ...result };
  });
}
