import { z } from "zod";
// THE contract. Every input becomes this before touching the system (CLAUDE.md architecture law).

export const EventSource = z.enum([
  "txline.odds",
  "txline.score",
  "txline.fixtures",
  "txline.proofs",
  "engine",
  "cortex", // pricing/quant worker — devigged marks on prices.marks (ADR-022)
  "chain",
  "user",
  "replay",
]);
export type EventSource = z.infer<typeof EventSource>;

export const EventType = z.enum([
  "odds_tick",
  "goal",
  "card",
  "penalty",
  "kickoff",
  "ht",
  "ft",
  "order",
  "fill",
  "position",
  "halt",
  "reopen",
  "mark",
  "commentary",
  "settled",
]);
export type EventType = z.infer<typeof EventType>;

// Shared envelope fields, minus the (type, payload) discriminator pair. Every typed
// event variant in ./events.ts extends this — one source for the envelope shape.
export const EnvelopeBase = z.object({
  event_id: z.string().uuid(),
  source: EventSource,
  source_seq: z.number().int(),
  match_id: z.string(),
  market_id: z.string().optional(),
  ts_source: z.string(),
  ts_ingest: z.string(),
});
export type EnvelopeBase = z.infer<typeof EnvelopeBase>;

// Loose wire-level contract kept for the bus transport layer (packages/bus). Consumers
// that need a typed payload parse with AnyEvent (./events.ts) instead.
export const Envelope = EnvelopeBase.extend({
  type: EventType,
  payload: z.record(z.unknown()),
});
export type Envelope = z.infer<typeof Envelope>;
// Idempotency key: (source, source_seq). Ordering: bus partition key = match_id.
