import { createRegistry, apply, fromEnvelope } from "./market";
export async function startEngine() {
  const markets = createRegistry();
  // subscribe bus: match.events → fromEnvelope → apply(markets, marketId, matchId, cmd) → emit effects
  //   (halt/reopen/resolving/settled/voided) to the bus; prices.marks → re-anchor AMM b(t).
  // consume order commands from an in-proc queue fed by http/routes/orders.ts (rejected while HALTED).
  void markets;
  void apply;
  void fromEnvelope;
}
