// Live-data disclosure (ADR-084). TxLINE devnet ingest is ON — the World Cup Final is priced from the real
// feed (cortex-synthesised 1X2, GET /markets). Leads with what is REAL; the modeled halt/reprice tape carries
// its own "replay" marker where it is shown. Slim, token-only, non-dismissible — honesty over polish.
export function PrototypeRibbon() {
  return (
    <div
      role="region"
      aria-label="Live data disclosure"
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-hairline bg-surface px-4 py-1.5 text-center"
    >
      <span className="inline-flex items-center gap-1.5 rounded-chip bg-up/10 px-1.5 py-0.5 text-label font-semibold uppercase tracking-label text-up ring-1 ring-inset ring-up/30">
        <span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_5px_var(--up)]" aria-hidden />
        Live
      </span>
      <span className="text-label text-lo">
        TxLINE data: the World Cup Final priced from the real feed. Play-money: no deposits, no payouts.
      </span>
    </div>
  );
}
