import { describe, it, expect } from "vitest";
import { MOMENTS_ONCHAIN, recordMoment, runMomentsStep } from "./moments";
import type { MarkSample, MomentDeps } from "./swing-card";

describe("moments — MOMENTS_ONCHAIN cut (ADR-032/041)", () => {
  it("defaults OFF — on-chain Bubblegum cNFT mint is deferred", () => {
    expect(MOMENTS_ONCHAIN).toBe(false);
  });

  it("records a moment off-chain (no mint) while the flag is off", async () => {
    expect(await recordMoment({ marketId: "wc26-bra-arg", imageUri: "ipfs://moment.png" })).toEqual({ onchain: false });
  });
});

describe("runMomentsStep — PNG-only saga MOMENTS step (flag off)", () => {
  const series: MarkSample[] = [
    { minute: 5, fair: { H: 0.5 } },
    { minute: 60, fair: { H: 0.75 } }, // +25pt swing
  ];
  function mockDeps(samples: MarkSample[]) {
    const uploads: string[] = [];
    const saved: Array<{ marketId: string; imageUri: string }> = [];
    const deps: MomentDeps = {
      getMatchMarks: async () => samples,
      uploadImage: async (key) => (uploads.push(key), `https://cdn/${key}`),
      saveMoment: async (m) => void saved.push(m),
    };
    return { deps, uploads, saved };
  }

  it("builds + persists the PNG card and reports off-chain (no mint sig)", async () => {
    const { deps, uploads, saved } = mockDeps(series);
    const res = await runMomentsStep("m1", deps);
    expect(res).toEqual({ onchain: false, imageUri: "https://cdn/moments/m1.svg" });
    expect(uploads).toEqual(["moments/m1.svg"]);
    expect(saved).toEqual([{ marketId: "m1", imageUri: "https://cdn/moments/m1.svg" }]);
  });

  it("returns null (no card) on a flat match", async () => {
    const { deps, uploads } = mockDeps([{ minute: 5, fair: { H: 0.5 } }]);
    expect(await runMomentsStep("m2", deps)).toBeNull();
    expect(uploads).toHaveLength(0);
  });
});
