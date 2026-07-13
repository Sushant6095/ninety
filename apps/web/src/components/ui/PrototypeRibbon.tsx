// Honest prototype disclosure. This deploy renders fixture data; the live API + Solana wiring
// lands on the global-track branch (Jul 19). Slim, token-only, non-dismissible — honesty over polish.
export function PrototypeRibbon() {
  return (
    <div
      role="note"
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-hairline bg-surface px-4 py-1.5 text-center"
    >
      <span className="rounded-chip bg-bg px-1.5 py-0.5 text-label font-semibold uppercase tracking-[0.12em] text-lo ring-1 ring-inset ring-hairline">
        Prototype
      </span>
      <span className="text-label text-lo">
        Fixture data — live API &amp; Solana wiring lands for the global track. Play-money: no deposits, no payouts.
      </span>
    </div>
  );
}
