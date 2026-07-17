import { describe, it, expect } from "vitest";
import { computePortfolio, type RawPosition } from "./portfolio";

// The pure portfolio computation (ADR-046). Covers the edge branches the review flagged: no mark → nulls,
// zero cost → pnlPct null, empty → equity === free. Prices 0..100; a share pays 100 credits.
const marks = (m: Record<string, Record<string, number>>) => new Map(Object.entries(m).map(([k, fair]) => [k, { fair }]));

describe("computePortfolio", () => {
  it("empty positions → equity === free, nothing held", () => {
    const p = computePortfolio([], marks({}), 2450);
    expect(p).toMatchObject({ free: 2450, held: 0, equity: 2450, positions: [] });
  });

  it("reproduces the reference position (90 EGY @0.41, mark 0.676)", () => {
    const rows: RawPosition[] = [{ marketId: "wc26-aus-egy", outcome: "A", qty: 90, avgPrice: 0.41 }];
    const p = computePortfolio(rows, marks({ "wc26-aus-egy": { H: 0.074, D: 0.25, A: 0.676 } }), 2450);
    const pos = p.positions[0];
    expect(pos.markNow).toBeCloseTo(67.6, 1);
    expect(pos.value).toBeCloseTo(6084, 0);
    expect(pos.pnl).toBeCloseTo(2394, 0);
    expect(pos.pnlPct).toBeCloseTo(64.9, 1);
    expect(p.equity).toBeCloseTo(8534, 0); // free 2450 + held 6084 — matches the reference
  });

  it("a position whose market has no mark → null value/pnl, not added to held", () => {
    const rows: RawPosition[] = [{ marketId: "wc26-can-mar", outcome: "H", qty: 120, avgPrice: 0.44 }];
    const p = computePortfolio(rows, marks({}), 1000);
    expect(p.positions[0]).toMatchObject({ markNow: null, value: null, pnl: null, pnlPct: null });
    expect(p.held).toBe(0);
    expect(p.equity).toBe(1000);
  });

  it("zero cost basis (avgPrice 0) → pnlPct null, no divide-by-zero", () => {
    const rows: RawPosition[] = [{ marketId: "m", outcome: "A", qty: 10, avgPrice: 0 }];
    const p = computePortfolio(rows, marks({ m: { H: 0.3, D: 0.3, A: 0.4 } }), 0);
    expect(p.positions[0].pnlPct).toBeNull();
    expect(p.positions[0].value).toBeCloseTo(400, 0); // 10 × 40
  });
});
