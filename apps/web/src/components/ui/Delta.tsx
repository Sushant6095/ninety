const FLAT = 0.05; // below this a price hasn't moved — and "hasn't moved" is not "up"

/** A signed price move. Green ▲ / pink ▼ / neutral — because a flat market rendering three green ▲0.0s is the
 *  cheapest way to look like you don't know what your own numbers mean. The ONE place the sign→tone rule lives. */
export function Delta({ value, suffix, className = "" }: { value: number; suffix?: string; className?: string }) {
  const flat = Math.abs(value) < FLAT;
  const tone = flat ? "text-lo" : value > 0 ? "text-up" : "text-down";
  const glyph = flat ? "–" : value > 0 ? "▲" : "▼";
  return (
    <span className={`num tabular-nums ${tone} ${className}`}>
      {glyph}
      {Math.abs(value).toFixed(1)}
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
}
