"use client";
import { useEffect, useRef } from "react";
import { resolveColor } from "../../design/tokens";

interface MomentumRiverProps {
  data: number[]; // fair×100 history — data[i] IS minute i+1 (the store's minute-indexed spark)
  up?: boolean; // color by direction
  height?: number;
  goalIndex?: number; // index to mark with a goal glyph
  secondary?: number[]; // optional context trace (e.g. the losing side's win%), drawn as a thin --down line
  yRange?: [number, number]; // pin the price axis (e.g. [0,100]) so a value maps to a FIXED height — needed so an
  // SVG cliff overlay can align to the canvas; without it lightweight-charts autoscales to the data range
  totalMinutes?: number; // the x-axis runs 0..totalMinutes, so the series ENDS at the live minute (ADR-055)
}

type AreaSeries = { setData: (d: object[]) => void; setMarkers: (m: object[]) => void; applyOptions: (o: object) => void };
type LineSeries = { setData: (d: object[]) => void };
type TimeScale = { setVisibleLogicalRange: (r: { from: number; to: number }) => void };
type Chart = { remove: () => void; applyOptions: (o: object) => void; timeScale: () => TimeScale };

const FULL_TIME = 90;
const toPoints = (v: number[]): object[] => v.map((value, i) => ({ time: (i + 1) as never, value }));

/** The hero price River — the ONE lightweight-charts instance (ADR-045), and the signature element where all
 *  visual boldness lives: a filled momentum area, not a thin line. Lazy-imports the lib (off SSR).
 *
 *  The x-axis is MATCH TIME, pinned to 0..totalMinutes: `data` holds one point per elapsed minute, so the trace
 *  ends exactly at the live minute and the unplayed remainder of the match stays empty on the right. It grows
 *  when the store's clock advances and re-draws in place when prices move within a minute — so the River can
 *  never render a future it hasn't played (ADR-055). A whole match is ≤90 points, so we just re-`setData` on
 *  change: no append/rolling-buffer machinery, and no way for the two traces to drift apart. */
export function MomentumRiver({ data, up = true, height = 96, goalIndex, secondary, yRange, totalMinutes = FULL_TIME }: MomentumRiverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<AreaSeries | null>(null);
  const secSeriesRef = useRef<LineSeries | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const upRef = useRef<boolean>(up);
  // The chart builds asynchronously; read the latest props from a ref so the build applies current data.
  const propsRef = useRef({ data, height, goalIndex, up, secondary, yRange, totalMinutes });
  propsRef.current = { data, height, goalIndex, up, secondary, yRange, totalMinutes };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;

    void (async () => {
      let lc: typeof import("lightweight-charts");
      try {
        lc = await import("lightweight-charts");
      } catch {
        return; // chart lib failed to load — the panel still renders without the River (graceful)
      }
      if (cancelled || !el) return;
      const { data: d0, height: h0, goalIndex: gi, up: up0, secondary: sec0, yRange: yr0, totalMinutes: tm0 } = propsRef.current;
      const line = (up0 ? resolveColor("up") : resolveColor("down")) || resolveColor("textHi");
      const chart = lc.createChart(el, {
        // autoSize (v4) hands sizing to lightweight-charts' own ResizeObserver, which sizes the pane the moment
        // the container has width — self-healing the race where the async import() resolves before the grid
        // track has resolved (a one-shot `width: el.clientWidth` read there is 0 → a blank 0×0 pane, the void).
        // width/height stay as the fallback used only if ResizeObserver is unavailable (context7 v4 docs).
        autoSize: true,
        width: el.clientWidth || 320,
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
        // Pin the price axis when asked so a value maps to a FIXED pixel height (the SVG cliff overlay aligns to it).
        ...(yr0 ? { autoscaleInfoProvider: () => ({ priceRange: { minValue: yr0[0], maxValue: yr0[1] } }) } : {}),
      });
      seriesRef.current = series;
      series.setData(toPoints(d0));
      if (gi != null && d0[gi] != null) {
        // Cliff dot only — the goal is named by the pill overlay in BigRiver, so no redundant marker text.
        series.setMarkers([{ time: (gi + 1) as never, position: "inBar", color: line, shape: "circle" }]);
      }
      // Optional context trace (the losing side's win%) — a thin --down line over the area, on the same x-domain.
      if (sec0 && sec0.length) {
        const secLine = (chart as unknown as { addLineSeries: (o: object) => LineSeries }).addLineSeries({
          color: resolveColor("down"),
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        secSeriesRef.current = secLine;
        secLine.setData(toPoints(sec0));
      }
      // Minute 0 at the left edge, full time at the right — the unplayed tail is real, empty match time.
      chart.timeScale().setVisibleLogicalRange({ from: -1, to: tm0 - 1 });
      // No hand-rolled ResizeObserver: autoSize owns width now, and a second RO calling applyOptions({width})
      // alongside LC's internal one just fights it. The logical range is re-pinned on data change (below).
    })();

    return () => {
      cancelled = true;
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
      secSeriesRef.current = null;
    };
  }, []); // build once

  // Re-draw on any change to the traces. A whole match is ≤90 points, so a full setData is cheaper than the
  // bookkeeping needed to tell "the price moved inside this minute" (replace) from "the clock ticked" (append).
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return; // still building — the build effect applies the current props from propsRef
    if (upRef.current !== up) {
      upRef.current = up;
      const line = (up ? resolveColor("up") : resolveColor("down")) || resolveColor("textHi");
      series.applyOptions({ lineColor: line, topColor: line + "6e", bottomColor: line + "08" });
    }
    series.setData(toPoints(data));
    if (secSeriesRef.current && secondary?.length) secSeriesRef.current.setData(toPoints(secondary));
    // The x-axis never rescales to the data — it stays pinned to the full match, so the series grows into it.
    chartRef.current?.timeScale().setVisibleLogicalRange({ from: -1, to: totalMinutes - 1 });
  }, [data, secondary, up, totalMinutes]);

  return <div ref={ref} style={{ height }} className="w-full" aria-hidden />;
}
