import { describe, it, expect } from "vitest";
import { markImpliedQ, quoteTrade } from "./quote";
import { price } from "../engine/amm";

// ADR-046: the quote reconstructs a mark-implied q and reuses the pure engine LMSR math. Verify the reconstruction
// is exact, the preview is convex (buying moves the price up), and it reproduces the reference (AUS vs EGY).
describe("quote (ADR-046 mark-implied preview)", () => {
  const fair = { H: 0.074, D: 0.25, A: 0.676 };
  const b = 1200;

  it("markImpliedQ reproduces the fair distribution via price()", () => {
    const q = markImpliedQ(fair, b);
    expect(price(q, b, 0)).toBeCloseTo(0.074, 4);
    expect(price(q, b, 1)).toBeCloseTo(0.25, 4);
    expect(price(q, b, 2)).toBeCloseTo(0.676, 4);
  });

  it("avgPx ≈ the mark for a tiny size and rises with size (LMSR convexity)", () => {
    const tiny = quoteTrade(fair, b, "A", 1, "buy");
    expect(tiny.avgPx).toBeCloseTo(67.6, 0);
    const big = quoteTrade(fair, b, "A", 200, "buy");
    expect(big.avgPx).toBeGreaterThan(tiny.avgPx);
  });

  it("reproduces the reference quote (60 EGY ≈ avg 68, payout 6000)", () => {
    const q = quoteTrade(fair, b, "A", 60, "buy");
    expect(q.maxPayout).toBe(6000);
    expect(q.avgPx).toBeGreaterThan(67);
    expect(q.avgPx).toBeLessThan(69);
    expect(q.cost).toBeGreaterThan(4000);
    expect(q.cost).toBeLessThan(4200);
  });

  it("a sell refunds less than a buy costs at the same size + spread", () => {
    const buy = quoteTrade(fair, b, "A", 60, "buy", 1.5);
    const sell = quoteTrade(fair, b, "A", 60, "sell", 1.5);
    expect(sell.cost).toBeLessThan(buy.cost);
  });

  it("size 0 falls back to the marginal price and zero payout", () => {
    const q = quoteTrade(fair, b, "A", 0, "buy");
    expect(q.maxPayout).toBe(0);
    expect(q.avgPx).toBeCloseTo(67.6, 0);
  });
});
