import { z } from "zod";
// THE contract. Every input becomes this before touching the system (CLAUDE.md architecture law).
export const Envelope = z.object({
  event_id: z.string().uuid(),
  source: z.enum(["txline.odds", "txline.score", "txline.fixtures", "txline.proofs", "engine", "chain", "user", "replay"]),
  source_seq: z.number().int(),
  match_id: z.string(),
  market_id: z.string().optional(),
  ts_source: z.string(),
  ts_ingest: z.string(),
  type: z.enum(["odds_tick", "goal", "card", "penalty", "kickoff", "ht", "ft", "order", "fill", "position", "halt", "reopen", "mark", "commentary", "settled"]),
  payload: z.record(z.unknown()),
});
export type Envelope = z.infer<typeof Envelope>;
// Idempotency key: (source, source_seq). Ordering: bus partition key = match_id.
