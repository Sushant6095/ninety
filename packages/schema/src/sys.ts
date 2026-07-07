import { z } from "zod";
// The SYSTEM/OPS plane (ADR-020). The second of the two communication planes the architecture law allows —
// distinct from the domain-event plane (AnyEvent). System signals carry operational + admin traffic, NEVER
// market data, and deliberately have NO (source, source_seq) idempotency or match_id partition semantics.
// They ride the SAME Bus (packages/bus) on sys.* topics — never a raw side-channel stream.

export const SysSeverity = z.enum(["info", "warn", "crit"]);
export type SysSeverity = z.infer<typeof SysSeverity>;

// Shared header for every signal — minus the (kind, payload) discriminator pair.
const SysBase = z.object({
  sig_id: z.string().uuid(),
  ts: z.string(), // ISO-8601
  severity: SysSeverity,
});

// feed_gap — an ingest stream went silent/dropped and was recovered (emitted by worker-ingest, ADR-019).
export const FeedGapSignal = SysBase.extend({
  kind: z.literal("feed_gap"),
  payload: z.object({
    stream: z.string(),
    reason: z.enum(["silence", "closed", "error"]),
    detail: z.string().optional(),
    silentMs: z.number(),
    recovered: z.number(),
    match_id: z.string().optional(),
  }),
});

// backpressure — a consumer/topic is lagging behind its producer.
export const BackpressureSignal = SysBase.extend({
  kind: z.literal("backpressure"),
  payload: z.object({ topic: z.string(), lag: z.number(), consumer: z.string().optional() }),
});

// saga_stuck — a multi-step flow stalled mid-way.
export const SagaStuckSignal = SysBase.extend({
  kind: z.literal("saga_stuck"),
  payload: z.object({ saga: z.string(), step: z.string(), match_id: z.string().optional() }),
});

// replay_request — admin control: replay a finished fixture through the ingest plane at Nx (ADR-021).
// An ops/admin command, not market data. The architecture law permits exactly two planes; a command that
// crosses services is not a domain event, so it belongs here on the system plane rather than in AnyEvent.
export const ReplayRequestSignal = SysBase.extend({
  kind: z.literal("replay_request"),
  payload: z.object({ match_id: z.string(), speed: z.number().positive() }),
});

// Discriminated on `kind` — parsing narrows the payload automatically (mirrors AnyEvent on the domain plane).
export const SysEvent = z.discriminatedUnion("kind", [
  FeedGapSignal,
  BackpressureSignal,
  SagaStuckSignal,
  ReplayRequestSignal,
]);
export type SysEvent = z.infer<typeof SysEvent>;
export type SysKind = SysEvent["kind"];
export type SysOfKind<K extends SysKind> = Extract<SysEvent, { kind: K }>;

/** Parse+validate an unknown value into a typed, discriminated system signal. Throws on invalid. */
export const parseSysEvent = (u: unknown): SysEvent => SysEvent.parse(u);
/** Non-throwing variant. */
export const safeParseSysEvent = (u: unknown): z.SafeParseReturnType<unknown, SysEvent> => SysEvent.safeParse(u);
