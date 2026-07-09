import { BOOTH } from "../../lib/terminal";

// Static equalizer glyph — thin bars, fixed heights (no animation, just the "live" read).
const EQ_BARS = [5, 9, 6, 11] as const;

/** THE BOOTH — a wide, short strip carrying the calm AI match call. Center column, bottom. */
export function BoothCall() {
  return (
    <section className="elev rounded-card border border-hairline/70 bg-surface px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-3 items-end gap-[2px]" aria-hidden>
            {EQ_BARS.map((h, i) => (
              <span key={i} className="w-[2px] rounded-full bg-up" style={{ height: h }} />
            ))}
          </span>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lo">
            The booth · Live AI call
          </h2>
        </div>
        <span className="text-[10px] uppercase tracking-[0.12em] text-lo">
          {BOOTH.lang} · {BOOTH.mode}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-hi">{BOOTH.text}</p>
    </section>
  );
}
