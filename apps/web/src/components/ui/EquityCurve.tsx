// Wider area sparkline for equity-over-session (Portfolio hero, Profile). Inline SVG — NOT a chart lib.
// The hero Momentum River (lightweight-charts) is the only real chart; an area micro-viz here is cheap + static.
interface EquityCurveProps {
  values: number[];
  up?: boolean; // color by net direction (default: last >= first)
  width?: number;
  height?: number;
  className?: string;
}

export function EquityCurve({ values, up, width = 640, height = 120, className = "" }: EquityCurveProps) {
  if (values.length < 2) return <svg width={width} height={height} aria-hidden className={className} />;
  const rising = up ?? values[values.length - 1] >= values[0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 6;
  const x = (i: number) => (i / (values.length - 1)) * width;
  const y = (v: number) => height - pad - ((v - min) / range) * (height - pad * 2);
  const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  const stroke = rising ? "var(--up)" : "var(--down)";
  // Flat translucent fill (no gradient — design law); the stroke carries the read, the fill just seats it.
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" fill="none" aria-hidden className={className}>
      <polygon points={area} fill={stroke} fillOpacity="0.07" />
      <polyline points={line} stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
