// Topic names are identical on Redis Streams and Kafka (ADR-007) — the bus driver is swappable.
export const TOPICS = {
  fixtures: "fixtures.v1",
  oddsRaw: "odds.raw.v1",
  matchEvents: "match.events.v1",
  matchActions: "match.actions.v1", // in-play action feed (shot/free_kick/var/…) for the Events tab (ADR-059)
  pricesMarks: "prices.marks.v1",
  orders: "orders.v1",
  fills: "fills.v1",
  positions: "positions.v1",
  credits: "credits.v1", // engine credit-ledger deltas (debit/credit/burn) → projection consumer (ADR-027)
  commentary: "commentary.v1",
  settlement: "settlement.v1",
  // System/ops plane (sys.*, ADR-020) — carries SysEvent signals, never domain data. Same Bus, distinct plane.
  sysSignals: "sys.signals.v1",
} as const;
export type Topic = (typeof TOPICS)[keyof typeof TOPICS];
