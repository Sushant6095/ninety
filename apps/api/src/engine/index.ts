import { onCommand } from "./market";
export async function startEngine() {
  // subscribe bus: prices.marks (re-anchor AMM), match.events (goal → HALT ≤300ms)
  // consume order commands from an in-proc queue fed by http/routes/orders.ts
  void onCommand;
}
