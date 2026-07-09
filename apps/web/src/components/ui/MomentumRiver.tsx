"use client";
import { useEffect, useRef } from "react";
import { resolveColor } from "../../design/tokens";

interface MomentumRiverProps {
  data: number[]; // fair×100 history (0..100)
  up?: boolean; // color by direction
  height?: number;
  goalIndex?: number; // index to mark with a goal glyph
  liveValue?: number; // latest fair×100 — appended to the river on change so it moves in real time
}

type AreaSeries = { setData: (d: object[]) => void; setMarkers: (m: object[]) => void; update: (p: object) => void };
type TimeScale = { fitContent: () => void; setVisibleLogicalRange: (r: { from: number; to: number }) => void };
type Chart = { remove: () => void; applyOptions: (o: object) => void; timeScale: () => TimeScale };

const TAIL_FRACTION = 0.22; // ~74'→90' of unplayed time stays empty on the right (DECISIONS.md)

/** The hero price River — the ONE lightweight-charts instance (ADR-045), and the signature element where all
 *  visual boldness lives: a filled momentum area, not a thin line. Lazy-imports the lib (off SSR). Built once;
 *  `liveValue` changes append a point via series.update() so the river flows without a costly rebuild. */
export function MomentumRiver({ data, up = true, height = 96, goalIndex, liveValue }: MomentumRiverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<AreaSeries | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const dataRef = useRef<{ time: number; value: number }[]>([]); // rolling buffer (capped → bounded memory)
  const timeRef = useRef<number>(0); // strictly-increasing time counter
  const windowRef = useRef<number>(0); // number of points held in the visible window
  const tailRef = useRef<number>(0); // empty unplayed bars kept on the right
  const lastValueRef = useRef<number | null>(null);
  const upRef = useRef<boolean>(up);
  // Build once — read mutable props from refs so a live tick never tears down the chart.
  const initRef = useRef({ data, height, goalIndex, up });
  initRef.current = { data, height, goalIndex, up };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    let ro: ResizeObserver | undefined;

    void (async () => {
      let lc: typeof import("lightweight-charts");
      try {
        lc = await import("lightweight-charts");
      } catch {
        return; // chart lib failed to load — the panel still renders without the River (graceful)
      }
      if (cancelled || !el) return;
      const { data: d0, height: h0, goalIndex: gi, up: up0 } = initRef.current;
      const line = (up0 ? resolveColor("up") : resolveColor("down")) || resolveColor("textHi");
      const chart = lc.createChart(el, {
        width: el.clientWidth,
        height: h0,
        layout: { background: { type: lc.ColorType.Solid, color: "transparent" }, textColor: resolveColor("textLo"), attributionLogo: false },
        grid: { horzLines: { visible: false }, vertLines: { visible: false } },
        rightPriceScale: { visible: false },
        leftPriceScale: { visible: false },
        timeScale: { visible: false, borderVisible: false, fixLeftEdge: true, fixRightEdge: false },
        crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
        handleScroll: false,
        handleScale: false,
      }) as unknown as Chart;
      chartRef.current = chart;
      const series = (chart as unknown as { addAreaSeries: (o: object) => AreaSeries }).addAreaSeries({
        lineColor: line,
        topColor: line + "6e", // ~43% — a real filled river, the signature element (design law)
        bottomColor: line + "08",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      seriesRef.current = series;
      const seed = d0.map((v, i) => ({ time: i + 1, value: v }));
      dataRef.current = seed.slice();
      timeRef.current = d0.length;
      windowRef.current = Math.max(12, d0.length);
      tailRef.current = Math.max(3, Math.round(windowRef.current * TAIL_FRACTION));
      lastValueRef.current = d0.length ? d0[d0.length - 1] : null;
      series.setData(seed.map((p) => ({ time: p.time as never, value: p.value })));
      if (gi != null && d0[gi] != null) {
        series.setMarkers([{ time: (gi + 1) as never, position: "aboveBar", color: line, shape: "circle", text: "goal" }]);
      }
      // Plot toward full time; leave the unplayed tail empty on the right (DECISIONS.md), never stretch edge-to-edge.
      chart.timeScale().setVisibleLogicalRange({ from: -0.5, to: seed.length - 1 + tailRef.current });
      ro = new ResizeObserver(() => chart.applyOptions({ width: el.clientWidth }));
      ro.observe(el);
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []); // build once

  // Live append — flow a new point onto the river when the latest value ticks.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || liveValue == null) return;
    if (upRef.current !== up) {
      upRef.current = up;
      const line = (up ? resolveColor("up") : resolveColor("down")) || resolveColor("textHi");
      (series as unknown as { applyOptions: (o: object) => void }).applyOptions?.({ lineColor: line, topColor: line + "6e", bottomColor: line + "08" });
    }
    // Only append on a real value change (guards a duplicate point when only `up` flips).
    if (lastValueRef.current != null && Math.abs(liveValue - lastValueRef.current) < 1e-9) return;
    lastValueRef.current = liveValue;
    // Fixed-width scrolling window over a capped buffer: push newest, drop oldest → bounded memory, and the
    // newest point holds its position with a constant empty tail (never compresses over a long match).
    timeRef.current += 1;
    const buf = dataRef.current;
    buf.push({ time: timeRef.current, value: liveValue });
    if (buf.length > windowRef.current) buf.shift();
    series.setData(buf.map((p) => ({ time: p.time as never, value: p.value })));
    chartRef.current?.timeScale().setVisibleLogicalRange({ from: -0.5, to: buf.length - 1 + tailRef.current });
  }, [liveValue, up]);

  return <div ref={ref} style={{ height }} className="w-full" aria-hidden />;
}
