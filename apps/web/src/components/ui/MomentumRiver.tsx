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
  const nextTimeRef = useRef<number>(0);
  const toRef = useRef<number>(0); // right edge of the visible logical range — grows as the river flows
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
      series.setData(d0.map((v, i) => ({ time: (i + 1) as never, value: v })));
      nextTimeRef.current = d0.length; // next append lands at length+1
      if (gi != null && d0[gi] != null) {
        series.setMarkers([{ time: (gi + 1) as never, position: "aboveBar", color: line, shape: "circle", text: "goal" }]);
      }
      // Plot toward full time; leave the unplayed tail empty on the right (DECISIONS.md) rather than stretching edge-to-edge.
      toRef.current = d0.length + Math.max(3, Math.round(d0.length * TAIL_FRACTION));
      chart.timeScale().setVisibleLogicalRange({ from: -0.5, to: toRef.current });
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
    nextTimeRef.current += 1;
    series.update({ time: nextTimeRef.current as never, value: liveValue });
    // Advance the right edge in lockstep so the newest point holds its position and the unplayed tail stays empty.
    toRef.current += 1;
    chartRef.current?.timeScale().setVisibleLogicalRange({ from: -0.5, to: toRef.current });
  }, [liveValue, up]);

  return <div ref={ref} style={{ height }} className="w-full" aria-hidden />;
}
