"use client";
import { useEffect, useRef } from "react";
import { resolveColor } from "../../design/tokens";

interface MomentumRiverProps {
  data: number[]; // fair×100 series (0..100)
  up?: boolean; // color by direction
  height?: number;
  goalIndex?: number; // index to mark with a goal glyph
}

/** The hero price River — the ONE lightweight-charts instance (ADR-045). Lazy-imports the lib (off SSR + off
 *  other routes' bundle). Live updates land via series.update() in chunk 5; here it plots the fixture series. */
export function MomentumRiver({ data, up = true, height = 96, goalIndex }: MomentumRiverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    let chart: { remove: () => void; applyOptions: (o: object) => void; timeScale: () => { fitContent: () => void } } | undefined;
    let ro: ResizeObserver | undefined;

    void (async () => {
      const lc = await import("lightweight-charts");
      if (cancelled || !el) return;
      const line = (up ? resolveColor("up") : resolveColor("down")) || resolveColor("textHi");
      chart = lc.createChart(el, {
        width: el.clientWidth,
        height,
        layout: { background: { type: lc.ColorType.Solid, color: "transparent" }, textColor: resolveColor("textLo"), attributionLogo: false },
        grid: { horzLines: { visible: false }, vertLines: { visible: false } },
        rightPriceScale: { visible: false },
        leftPriceScale: { visible: false },
        timeScale: { visible: false, borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
        crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
        handleScroll: false,
        handleScale: false,
      }) as typeof chart;
      const series = (chart as unknown as { addAreaSeries: (o: object) => { setData: (d: object[]) => void; setMarkers: (m: object[]) => void } }).addAreaSeries({
        lineColor: line,
        topColor: line + "2e",
        bottomColor: line + "00",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      series.setData(data.map((v, i) => ({ time: (i + 1) as never, value: v })));
      if (goalIndex != null && data[goalIndex] != null) {
        series.setMarkers([{ time: (goalIndex + 1) as never, position: "aboveBar", color: line, shape: "circle", text: "goal" }]);
      }
      chart!.timeScale().fitContent();
      ro = new ResizeObserver(() => chart?.applyOptions({ width: el.clientWidth }));
      ro.observe(el);
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      chart?.remove();
    };
  }, [data, up, height, goalIndex]);

  return <div ref={ref} style={{ height }} className="w-full" aria-hidden />;
}
