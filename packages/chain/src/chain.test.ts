import { describe, it, expect } from "vitest";
import bs58 from "bs58";
import { parseSettleEvents, verifyHeliusSecret, processHeliusWebhook, anchorDiscriminator, type WebhookSinks, type HeliusTx } from "./helius";
import { priorityFeeIxs, settleData, postRootData, claimData, mintData } from "./builders";

const PROGRAM = "6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj";

// encode a settle_market ix's data (discriminator + result u8 + Vec<u8> proof), base58 as Helius delivers it.
const settleIx = (result: number, proof: number[]): string => {
  const len = Buffer.alloc(4);
  len.writeUInt32LE(proof.length);
  return bs58.encode(Buffer.concat([anchorDiscriminator("settle_market"), Buffer.from([result]), len, Buffer.from(proof)]));
};

describe("chain — helius webhook", () => {
  it("extracts settle events for our program; ignores other programs and non-settle instructions", () => {
    const txs: HeliusTx[] = [
      { signature: "sigA", slot: 100, instructions: [{ programId: PROGRAM, data: settleIx(1, [9, 9]), accounts: ["MKT_A", "caller"] }] },
      { signature: "sigB", slot: 101, instructions: [{ programId: "OtherProgram1111", data: settleIx(2, []), accounts: ["x"] }] },
      { signature: "sigC", slot: 102, instructions: [{ programId: PROGRAM, data: bs58.encode(Buffer.from([1, 2, 3])), accounts: ["y"] }] },
    ];
    const events = parseSettleEvents(txs, PROGRAM);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ signature: "sigA", slot: 100, result: 1, resultLabel: "H", marketAccount: "MKT_A" });
  });

  it("verifies the webhook secret fail-closed (timing-safe)", () => {
    expect(verifyHeliusSecret("s3cr3t", "s3cr3t")).toBe(true);
    expect(verifyHeliusSecret("wrong", "s3cr3t")).toBe(false);
    expect(verifyHeliusSecret("s3cr3t", undefined)).toBe(false); // no configured secret → reject
    expect(verifyHeliusSecret(undefined, "s3cr3t")).toBe(false);
  });

  it("records every settle to chain_events + publishes settled only for resolvable matches", async () => {
    const chainEvents: { sig: string }[] = [];
    const settled: unknown[] = [];
    const sinks: WebhookSinks = {
      writeChainEvent: async (e) => void chainEvents.push(e),
      resolveMatchId: async (acct) => (acct === "MKT_A" ? "wc26-bra-arg" : null),
      publishSettled: async (e) => void settled.push(e),
    };
    const txs: HeliusTx[] = [
      { signature: "sigA", slot: 100, instructions: [{ programId: PROGRAM, data: settleIx(3, []), accounts: ["MKT_A"] }] },
      { signature: "sigB", slot: 101, instructions: [{ programId: PROGRAM, data: settleIx(1, []), accounts: ["UNKNOWN"] }] },
    ];
    expect(await processHeliusWebhook(txs, PROGRAM, sinks)).toEqual({ chainEvents: 2, settled: 1 });
    expect(chainEvents.map((e) => e.sig)).toEqual(["sigA", "sigB"]); // both audited
    expect(settled).toEqual([{ matchId: "wc26-bra-arg", marketAccount: "MKT_A", result: "A", sig: "sigA" }]); // only resolvable published
  });
});

describe("chain — tx builders", () => {
  it("priority-fee ixs target the ComputeBudget program (limit + price)", () => {
    const ixs = priorityFeeIxs(5000, 1_400_000);
    expect(ixs).toHaveLength(2);
    expect(ixs.every((i) => i.programId.toBase58() === "ComputeBudget111111111111111111111111111111")).toBe(true);
  });

  it("instruction data starts with the anchor discriminator and encodes args (LE borsh)", () => {
    const s = settleData(2, Buffer.from([7]));
    expect(s.subarray(0, 8)).toEqual(anchorDiscriminator("settle_market"));
    expect(s[8]).toBe(2);
    const pr = postRootData(7, new Uint8Array(32).fill(9));
    expect(pr.subarray(0, 8)).toEqual(anchorDiscriminator("post_leaderboard_root"));
    expect(pr.readUInt32LE(8)).toBe(7);
    const c = claimData(3, 100n, [new Uint8Array(32).fill(1)]);
    expect(c.readUInt32LE(8)).toBe(3);
    expect(c.readBigUInt64LE(12)).toBe(100n);
    const m = mintData("ipfs://x");
    expect(m.subarray(0, 8)).toEqual(anchorDiscriminator("mint_moment"));
    expect(m.readUInt32LE(8)).toBe("ipfs://x".length);
  });
});
