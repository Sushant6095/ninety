// Stale-mark watchdog (ADR-028). A HALTED market reopens on the NEXT mark once the halt window clears (see the
// mark branch in engineApply). If NO fresh mark arrives while halted, the market correctly STAYS halted — but a
// wedged pricing feed must be SURFACED, not silently sat on. This watchdog is OPERATIONAL: it uses a wall clock
// (injected) and is NOT part of the journaled market state — exactly like the RedisLease renew loop (ADR-025).
// It never mutates market state; it only raises an alert once per stale episode so ops can investigate.
export type StaleAlert = { marketId: string; staleMs: number };

export class MarkWatchdog {
  private readonly lastMarkAt = new Map<string, number>(); // marketId → wall-time of the last processed mark
  private readonly alerted = new Set<string>(); // markets with a standing (un-cleared) stale alert

  constructor(
    private readonly thresholdMs: number,
    private readonly onStale: (a: StaleAlert) => void,
  ) {}

  /** A fresh mark was processed for this market — record it and clear any standing alert (re-arm). */
  markSeen(marketId: string, now: number): void {
    this.lastMarkAt.set(marketId, now);
    this.alerted.delete(marketId);
  }

  /** The market left HALTED (reopened/settled/voided) — drop its standing alert so a future halt can alert again. */
  clear(marketId: string): void {
    this.alerted.delete(marketId);
  }

  /**
   * Raise an alert ONCE for each currently-HALTED market whose last mark is older than the threshold (or which
   * has never seen a mark → Infinity). Deterministic in the injected `now`, so it is unit-testable without timers.
   * Returns the alerts raised this pass (for tests/metrics).
   */
  check(now: number, haltedMarkets: Iterable<string>): StaleAlert[] {
    const raised: StaleAlert[] = [];
    for (const marketId of haltedMarkets) {
      const last = this.lastMarkAt.get(marketId);
      const staleMs = last === undefined ? Infinity : now - last;
      if (staleMs > this.thresholdMs && !this.alerted.has(marketId)) {
        this.alerted.add(marketId);
        const alert = { marketId, staleMs };
        raised.push(alert);
        this.onStale(alert);
      }
    }
    return raised;
  }
}
