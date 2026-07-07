import { z } from "zod";
import { EnvelopeBase } from "./envelope";
import { Mark } from "./market";
import {
  OddsTickPayload,
  GoalPayload,
  CardPayload,
  PenaltyPayload,
  StatusPayload,
  OrderPayload,
  FillPayload,
  PositionPayload,
  CreditPayload,
  HaltReopenPayload,
  CommentaryPayload,
  SettledPayload,
} from "./payloads";

// A fully-typed event = the shared envelope fields + a literal `type` + its matching
// payload. This is the ONLY place Envelope.type is bound to a payload shape; services
// import these, they never redefine an event (CLAUDE.md architecture law).

export const OddsTickEvent = EnvelopeBase.extend({ type: z.literal("odds_tick"), payload: OddsTickPayload });
export const GoalEvent = EnvelopeBase.extend({ type: z.literal("goal"), payload: GoalPayload });
export const CardEvent = EnvelopeBase.extend({ type: z.literal("card"), payload: CardPayload });
export const PenaltyEvent = EnvelopeBase.extend({ type: z.literal("penalty"), payload: PenaltyPayload });
export const KickoffEvent = EnvelopeBase.extend({ type: z.literal("kickoff"), payload: StatusPayload });
export const HtEvent = EnvelopeBase.extend({ type: z.literal("ht"), payload: StatusPayload });
export const FtEvent = EnvelopeBase.extend({ type: z.literal("ft"), payload: StatusPayload });
export const OrderEvent = EnvelopeBase.extend({ type: z.literal("order"), payload: OrderPayload });
export const FillEvent = EnvelopeBase.extend({ type: z.literal("fill"), payload: FillPayload });
export const PositionEvent = EnvelopeBase.extend({ type: z.literal("position"), payload: PositionPayload });
export const CreditEvent = EnvelopeBase.extend({ type: z.literal("credit"), payload: CreditPayload });
export const HaltEvent = EnvelopeBase.extend({ type: z.literal("halt"), payload: HaltReopenPayload });
export const ReopenEvent = EnvelopeBase.extend({ type: z.literal("reopen"), payload: HaltReopenPayload });
export const MarkEvent = EnvelopeBase.extend({ type: z.literal("mark"), payload: Mark });
export const CommentaryEvent = EnvelopeBase.extend({ type: z.literal("commentary"), payload: CommentaryPayload });
export const SettledEvent = EnvelopeBase.extend({ type: z.literal("settled"), payload: SettledPayload });

// Discriminated on `type` — parsing narrows payload automatically.
export const AnyEvent = z.discriminatedUnion("type", [
  OddsTickEvent,
  GoalEvent,
  CardEvent,
  PenaltyEvent,
  KickoffEvent,
  HtEvent,
  FtEvent,
  OrderEvent,
  FillEvent,
  PositionEvent,
  CreditEvent,
  HaltEvent,
  ReopenEvent,
  MarkEvent,
  CommentaryEvent,
  SettledEvent,
]);
export type AnyEvent = z.infer<typeof AnyEvent>;

// Narrow an event by its literal type, e.g. EventOfType<"goal">.
export type EventOfType<T extends AnyEvent["type"]> = Extract<AnyEvent, { type: T }>;

// Registry: type → payload schema. Producers building an event validate their payload
// against PAYLOAD_BY_TYPE[type]; nobody hand-writes a payload shape elsewhere.
export const PAYLOAD_BY_TYPE = {
  odds_tick: OddsTickPayload,
  goal: GoalPayload,
  card: CardPayload,
  penalty: PenaltyPayload,
  kickoff: StatusPayload,
  ht: StatusPayload,
  ft: StatusPayload,
  order: OrderPayload,
  fill: FillPayload,
  position: PositionPayload,
  credit: CreditPayload,
  halt: HaltReopenPayload,
  reopen: HaltReopenPayload,
  mark: Mark,
  commentary: CommentaryPayload,
  settled: SettledPayload,
} as const;

// --- parse helpers ---
/** Parse+validate an unknown value into a typed, discriminated event. Throws on invalid. */
export const parseEvent = (u: unknown): AnyEvent => AnyEvent.parse(u);

/** Non-throwing variant — returns zod's SafeParseReturnType. */
export const safeParseEvent = (u: unknown): z.SafeParseReturnType<unknown, AnyEvent> => AnyEvent.safeParse(u);

/** Validate a bare payload against the schema for a given event type. Throws on invalid. */
export const parsePayload = <T extends keyof typeof PAYLOAD_BY_TYPE>(
  type: T,
  payload: unknown,
): z.infer<(typeof PAYLOAD_BY_TYPE)[T]> => PAYLOAD_BY_TYPE[type].parse(payload) as z.infer<(typeof PAYLOAD_BY_TYPE)[T]>;
