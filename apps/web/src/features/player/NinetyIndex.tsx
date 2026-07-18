import type { NinetyAxis } from "./data";

const R = 78;
const CX = 110;
const CY = 96;
const RINGS = [0.25, 0.5, 0.75, 1];

// Polar → cartesian; axis 0 at top (−90°), clockwise.
function pt(i: number, n: number, radius: number): [number, number] {
  const a = (-90 + (360 / n) * i) * (Math.PI / 180);
  return [CX + radius * Math.cos(a), CY + radius * Math.sin(a)];
}
const poly = (pts: [number, number][]): string => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** The Ninety index — a radar DERIVED from real WC26 per-match production and normalised across the top 20. It is
 *  NOT an official rating (Sofascore's ATT/TEC/… model is proprietary and unsourceable); every axis names its own
 *  formula on hover. Tokens only: the shape is drawn in --up, the grid in --hairline. */
export function NinetyIndex({ axes }: { axes: NinetyAxis[] }) {
  const n = axes.length;
  const shape = axes.map((a, i) => pt(i, n, (R * Math.max(0, Math.min(100, a.value))) / 100));
  return (
    <section className="elev rounded-card border border-hairline bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-strong font-semibold text-hi">Ninety index</h2>
        <span className="text-label uppercase tracking-micro text-lo">per-90 · derived</span>
      </div>
      <p className="mt-1 text-caption text-lo">Derived from WC26 per-match production, normalised across the top 20. Not an official rating.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr] sm:items-center">
        <svg viewBox="0 0 220 200" className="mx-auto h-auto w-[220px]" role="img" aria-label="Ninety index radar">
          {RINGS.map((r) => (
            <polygon key={r} points={poly(axes.map((_, i) => pt(i, n, R * r)))} className="fill-none" stroke="var(--hairline)" strokeWidth="1" />
          ))}
          {axes.map((_, i) => {
            const [x, y] = pt(i, n, R);
            return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--hairline)" strokeWidth="1" />;
          })}
          <polygon points={poly(shape)} fill="color-mix(in srgb, var(--up) 18%, transparent)" stroke="var(--up)" strokeWidth="1.5" />
          {shape.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.5" fill="var(--up)" />
          ))}
        </svg>

        <ul className="flex flex-col gap-2">
          {axes.map((a) => (
            <li key={a.key} className="flex items-center justify-between gap-3" title={`${a.label} — ${a.input} = ${a.raw}`}>
              <span className="flex items-center gap-2 text-caption text-hi">
                <span className="h-1.5 w-1.5 rounded-full bg-up" />
                {a.label}
                <span className="text-label text-lo">{a.input}</span>
              </span>
              <span className="num text-caption font-semibold tabular-nums text-hi">{a.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
