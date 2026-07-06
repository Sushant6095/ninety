import { z } from "zod";
export const Outcome = z.enum(["H", "D", "A"]);
export const Mark = z.object({ market_id: z.string(), fair: z.record(Outcome, z.number()), hazard: z.number(), b_hint: z.number() });
export type Mark = z.infer<typeof Mark>;
