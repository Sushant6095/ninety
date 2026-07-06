// Topic names are identical on Redis Streams and Kafka (ADR-007) — the bus driver is swappable.
export const TOPICS = {
  fixtures: "fixtures.v1",
  oddsRaw: "odds.raw.v1",
  matchEvents: "match.events.v1",
  pricesMarks: "prices.marks.v1",
  orders: "orders.v1",
  fills: "fills.v1",
  positions: "positions.v1",
  commentary: "commentary.v1",
  settlement: "settlement.v1",
} as const;
export type Topic = (typeof TOPICS)[keyof typeof TOPICS];
