// LMSR (ADR-002). Pure math — no IO.
export const cost = (q: number[], b: number) => b * Math.log(q.reduce((s, qi) => s + Math.exp(qi / b), 0));
export const price = (q: number[], b: number, i: number) => Math.exp(q[i] / b) / q.reduce((s, qi) => s + Math.exp(qi / b), 0);
export const buyCost = (q: number[], b: number, i: number, delta: number) => { const q2 = [...q]; q2[i] += delta; return cost(q2, b) - cost(q, b); };
// dynamic liquidity: b(t) = b0 * (1 + k * hazard) — hazard arrives from cortex via prices.marks
