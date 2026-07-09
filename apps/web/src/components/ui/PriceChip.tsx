interface PriceChipProps {
  label: string; // "H" | "D" | "A"
  price: number; // 0..100
  lead?: boolean; // the leading outcome — slightly emphasized
}

/** One outcome's price cell (mono, one decimal). Highlights with the row on hover. */
export function PriceChip({ label, price, lead = false }: PriceChipProps) {
  return (
    <span
      className={`flex min-w-[52px] flex-col items-center gap-0.5 rounded-md px-2 py-1.5 ring-1 ring-inset transition-colors duration-200 ${
        lead ? "bg-hairline/40 ring-hairline" : "bg-bg/50 ring-hairline/60"
      } group-hover:ring-up/30`}
    >
      <span className="text-[9px] font-medium uppercase tracking-wide text-lo">{label}</span>
      <span className={`num text-[13px] font-semibold tabular-nums ${lead ? "text-hi" : "text-hi/90"}`}>{price.toFixed(1)}</span>
    </span>
  );
}
