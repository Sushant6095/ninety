// LMSR (ADR-002). Pure math — no IO. Numerically stabilized with the log-sum-exp trick (subtract the max
// exponent before exp) so a small b combined with large accumulated q can NEVER overflow exp() to Infinity —
// which would make cost = Inf − Inf = NaN and (unguarded) let a NaN price/fee into the journaled ledger.
const logSumExp = (xs: readonly number[]): { max: number; sumExp: number } => {
  let max = -Infinity;
  for (const x of xs) if (x > max) max = x;
  let sumExp = 0;
  for (const x of xs) sumExp += Math.exp(x - max);
  return { max, sumExp };
};

export const cost = (q: number[], b: number): number => {
  const { max, sumExp } = logSumExp(q.map((qi) => qi / b));
  return b * (max + Math.log(sumExp)); // ≡ b·ln(Σ e^(q_i/b)), overflow-safe
};
export const price = (q: number[], b: number, i: number): number => {
  const xs = q.map((qi) => qi / b);
  const { max, sumExp } = logSumExp(xs);
  return Math.exp(xs[i] - max) / sumExp; // ≡ e^(q_i/b) / Σ e^(q_j/b)
};
export const buyCost = (q: number[], b: number, i: number, delta: number): number => {
  const q2 = [...q];
  q2[i] += delta;
  return cost(q2, b) - cost(q, b);
};
// dynamic liquidity: b(t) = b0 * (1 + k * hazard) — hazard arrives from cortex via prices.marks (ADR-022).
// The engine consumes the FULLY-COMPUTED b_hint; it must NOT re-apply hazard (that double-counts — ADR-028).
