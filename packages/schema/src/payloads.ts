import { z } from "zod";
import { Outcome } from "./market";

// Per-event-type payloads. THE single source of truth — no service defines its own
// event shape (CLAUDE.md architecture law). Every payload here is referenced by exactly
// one Envelope.type variant in ./events.ts.

// --- shared primitives ---
export const Decimal = z.number().positive(); // decimal-format odds / positive price
export const TeamSide = z.enum(["home", "away"]);
export const Side = z.enum(["buy", "sell"]);
export const Minute = z.number().int().min(0).max(130); // match minute incl. stoppage + extra time
export const Score = z.object({
  home: z.number().int().min(0),
  away: z.number().int().min(0),
});
export type Score = z.infer<typeof Score>;

// --- TxLINE market feed ---
export const OddsTickPayload = z.object({
  // TxLINE consensus decimal odds for the three 1X2 outcomes
  outcomes: z.object({ H: Decimal, D: Decimal, A: Decimal }),
});
export type OddsTickPayload = z.infer<typeof OddsTickPayload>;

// --- TxLINE match events ---
export const GoalPayload = z.object({ team: TeamSide, minute: Minute, score: Score });
export type GoalPayload = z.infer<typeof GoalPayload>;

export const CardPayload = z.object({
  color: z.enum(["yellow", "red"]),
  team: TeamSide,
  minute: Minute,
});
export type CardPayload = z.infer<typeof CardPayload>;

export const PenaltyPayload = z.object({
  team: TeamSide,
  minute: Minute,
  outcome: z.enum(["awarded", "scored", "missed"]).optional(),
});
export type PenaltyPayload = z.infer<typeof PenaltyPayload>;

// kickoff | ht | ft — all three carry a match status string (Match.status is free-form).
export const StatusPayload = z.object({ status: z.string().min(1) });
export type StatusPayload = z.infer<typeof StatusPayload>;

// --- trading (engine) ---
// market_id lives on the Envelope; payloads never duplicate envelope fields.
export const OrderPayload = z.object({
  order_id: z.string().optional(), // assigned by the engine
  user_id: z.string(),
  outcome: Outcome,
  side: Side,
  size: z.number().int().positive(),
  status: z.string().optional(),
});
export type OrderPayload = z.infer<typeof OrderPayload>;

export const FillPayload = z.object({
  order_id: z.string().optional(),
  price: z.number(),
  size: z.number().int().positive(),
  fee: z.number().min(0),
});
export type FillPayload = z.infer<typeof FillPayload>;

export const PositionPayload = z.object({
  user_id: z.string().optional(),
  outcome: Outcome.optional(),
  qty: z.number().int(),
  avg: z.number(),
});
export type PositionPayload = z.infer<typeof PositionPayload>;

// --- market lifecycle (ADR-005: goal → HALT → re-anchor with decaying spread) ---
export const HaltReopenPayload = z.object({
  reason: z.string().min(1),
  spread_mult: z.number().positive(),
});
export type HaltReopenPayload = z.infer<typeof HaltReopenPayload>;

// --- AI booth ---
export const CommentaryPayload = z.object({
  text: z.string().min(1),
  voice: z.string().optional(),
});
export type CommentaryPayload = z.infer<typeof CommentaryPayload>;

// --- settlement (on-chain, proof-verified) ---
export const SettledPayload = z.object({
  result: Outcome, // winning 1X2 outcome
  sig: z.string(), // Solana settlement tx signature
});
export type SettledPayload = z.infer<typeof SettledPayload>;
