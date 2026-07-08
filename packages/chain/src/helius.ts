// Helius webhook: enhanced-transaction payload types + a fail-closed secret verifier + a parser that extracts our
// program's settle_market events. Chain events land on the bus as source='chain'. Pure — unit-testable with a mock
// payload; the API route (apps/api) does the DB write + bus publish.
import { createHash, timingSafeEqual } from "node:crypto";
import bs58 from "bs58";

/** Anchor instruction discriminator = first 8 bytes of sha256("global:<name>"). */
export const anchorDiscriminator = (name: string): Buffer => createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
const SETTLE_DISC = anchorDiscriminator("settle_market");

export interface HeliusInstruction {
  programId: string;
  data: string; // base58-encoded instruction data
  accounts: string[];
}
export interface HeliusTx {
  signature: string;
  slot: number;
  instructions?: HeliusInstruction[];
}

// result byte (state.rs Market.result: 0 unset, 1 H, 2 D, 3 A) → 1X2 label.
const RESULT_LABEL = ["", "H", "D", "A"] as const;

export interface SettleEvent {
  signature: string;
  slot: number;
  result: number; // raw u8
  resultLabel: string; // "" if out of range
  marketAccount: string; // the writable market PDA (first account of settle_market)
}

/** Extract settle_market events fired by `programId` from a Helius enhanced-transaction batch. */
export function parseSettleEvents(txs: HeliusTx[], programId: string): SettleEvent[] {
  const out: SettleEvent[] = [];
  for (const tx of txs ?? []) {
    for (const ix of tx.instructions ?? []) {
      if (ix.programId !== programId) continue;
      let data: Buffer;
      try {
        data = Buffer.from(bs58.decode(ix.data));
      } catch {
        continue;
      }
      if (data.length < 9 || !data.subarray(0, 8).equals(SETTLE_DISC)) continue; // not settle_market
      const result = data[8];
      out.push({ signature: tx.signature, slot: tx.slot, result, resultLabel: RESULT_LABEL[result] ?? "", marketAccount: ix.accounts?.[0] ?? "" });
    }
  }
  return out;
}

/** Fail-closed webhook secret check (timing-safe). No configured secret → reject. */
export function verifyHeliusSecret(provided: string | undefined, expected: string | undefined): boolean {
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// The DB + bus sinks the webhook drives; injected so processHeliusWebhook is unit-testable without a DB/bus.
export interface WebhookSinks {
  /** Idempotent by sig — a Helius retry of the same tx must not duplicate. */
  writeChainEvent(e: { sig: string; program: string; kind: string; payload: unknown; slot: number }): Promise<void>;
  /** Map the on-chain market account to our matchId, or null if unknown. */
  resolveMatchId(marketAccount: string): Promise<string | null>;
  publishSettled(e: { matchId: string; marketAccount: string; result: string; sig: string }): Promise<void>;
}

/** Process a Helius batch: record every settle to chain_events, and publish a settled envelope per resolvable match. */
export async function processHeliusWebhook(txs: HeliusTx[], programId: string, sinks: WebhookSinks): Promise<{ chainEvents: number; settled: number }> {
  const settles = parseSettleEvents(txs, programId);
  let settled = 0;
  for (const s of settles) {
    await sinks.writeChainEvent({ sig: s.signature, program: programId, kind: "settled", payload: s, slot: s.slot });
    if (!s.resultLabel) continue; // unparseable result → recorded but not published
    const matchId = await sinks.resolveMatchId(s.marketAccount);
    if (!matchId) continue; // unknown market → recorded; the saga can reconcile later
    await sinks.publishSettled({ matchId, marketAccount: s.marketAccount, result: s.resultLabel, sig: s.signature });
    settled++;
  }
  return { chainEvents: settles.length, settled };
}
