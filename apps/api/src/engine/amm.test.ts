import { describe, it, expect } from "vitest";
import { price, cost } from "./amm";
describe("lmsr", () => {
  it("prices sum to 1", () => {
    const q = [0, 0, 0],
      b = 300;
    const s = [0, 1, 2].map((i) => price(q, b, i)).reduce((a, x) => a + x, 0);
    expect(Math.abs(s - 1)).toBeLessThan(1e-9);
  });

  it("cost stays FINITE for a small b + large q (log-sum-exp guards the exp overflow)", () => {
    // Naive b·ln(Σ e^(q_i/b)) overflows: e^(70000/100)=e^700=Infinity → Inf−Inf=NaN. Log-sum-exp keeps it finite.
    const c = cost([70_000, 0, 0], 100);
    expect(Number.isFinite(c)).toBe(true);
    expect(c).toBeCloseTo(70_000, 6); // dominated by the huge outcome: b·(max + ln(1+2e^-max)) ≈ q_max
    // and prices remain a valid distribution even in the overflow regime
    const s = [0, 1, 2].map((i) => price([70_000, 0, 0], 100, i)).reduce((a, x) => a + x, 0);
    expect(Math.abs(s - 1)).toBeLessThan(1e-9);
  });
});
