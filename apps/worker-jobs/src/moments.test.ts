import { describe, it, expect } from "vitest";
import { MOMENTS_ONCHAIN, recordMoment } from "./moments";

describe("moments — MOMENTS_ONCHAIN cut (ADR-032)", () => {
  it("defaults OFF — on-chain Bubblegum cNFT mint is deferred", () => {
    expect(MOMENTS_ONCHAIN).toBe(false);
  });

  it("records a moment off-chain (no mint) while the flag is off", async () => {
    expect(await recordMoment({ marketId: "wc26-bra-arg", imageUri: "ipfs://moment.png" })).toEqual({ onchain: false });
  });
});
