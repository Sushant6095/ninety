import { describe, it, expect } from "vitest";
import { price } from "./amm";
describe("lmsr", () => it("prices sum to 1", () => {
  const q = [0, 0, 0], b = 300;
  const s = [0, 1, 2].map(i => price(q, b, i)).reduce((a, x) => a + x, 0);
  expect(Math.abs(s - 1)).toBeLessThan(1e-9);
}));
