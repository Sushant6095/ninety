interface SparklineProps {
  values: number[]; // fair×100 series
  up: boolean; // color by direction
  width?: number;
  height?: number;
}

/** Cheap inline-SVG micro-spark for a list row. NOT a chart lib — the hero River (Featured/match view) uses
 *  lightweight-charts; putting a chart instance in every row would be a re-render/perf disaster (ADR-045). */
export function Sparkline({ values, up, width = 68, height = 28 }: SparklineProps) {
  if (values.length < 2) return <svg width={width} height={height} aria-hidden />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 3;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const color = up ? "var(--up)" : "var(--down)";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden>
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
