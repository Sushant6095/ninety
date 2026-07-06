// State machine: SCHEDULED → OPEN → LIVE ⇄ HALTED → RESOLVING → SETTLED | VOIDED
export type MarketStatus = "SCHEDULED" | "OPEN" | "LIVE" | "HALTED" | "RESOLVING" | "SETTLED" | "VOIDED";
export function onCommand(/* cmd */) { /* validate → journal.append → apply → emit fills/positions to bus */ }
