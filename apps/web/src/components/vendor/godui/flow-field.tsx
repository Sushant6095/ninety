"use client";
// godui "flow-field" (godui.design/r/flow-field), re-skinned to Ninety:
// - the godui theme probing is gone (--primary/--background span probes + a MutationObserver
//   watching for theme flips — Ninety is dark-only): trail colors resolve the lo/up tokens once
// - the pull painted its own OPAQUE themed background; rebuilt as a TRANSPARENT stage using
//   destination-out trail fade (the same technique as PriceVoid), so the host section's token
//   background shows through untouched
// - trails: text-lo base at low alpha with a sparse up-token accent stream (~1 in 8)
// - particle budget 900 → 260 (still area-clamped), dpr cap 2 → 1.5, rAF starts only at ≥20%
//   visibility and stops offscreen / on hidden tab (as pulled, thresholds tightened)
// - prefers-reduced-motion → one primed static frame, the loop never starts (as pulled)
import * as React from "react";

export type FlowFieldProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Number of particles tracing the field. Keep modest — this shares the landing GPU budget. */
  particleCount?: number;
  /** Field scale — smaller means broader, smoother currents. */
  noiseScale?: number;
  /** Flow speed multiplier. `1` is the calm default. */
  speed?: number;
  /** Trail fade per frame, `0`–`1`. Lower leaves longer, silkier trails. */
  fade?: number;
};

function rgbTriple(input: string): [number, number, number] {
  if (typeof document === "undefined") return [0, 0, 0];
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [0, 0, 0];
    ctx.fillStyle = input;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r as number, g as number, b as number];
  } catch {
    return [0, 0, 0];
  }
}

// Compact 2D value noise (hash + smooth interpolation) for the flow angles.
function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

type Particle = { x: number; y: number };

const UP_STREAM_RATIO = 8; // ~1 in 8 particles rides the up-token stream
const DPR_CAP = 1.5;

/**
 * A field of particles streaming along an evolving noise vector field, leaving silky fading
 * trails over a TRANSPARENT stage. Drop it as the first child of a `relative` section; the
 * section's token background shows through and the content sits above it.
 */
const FlowField = React.forwardRef<HTMLDivElement, FlowFieldProps>(
  (
    { className, style, particleCount = 260, noiseScale = 0.0016, speed = 1, fade = 0.05, ...props },
    ref,
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    React.useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Dark-only app: resolve the two token trail colors once via a computed-style probe.
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;width:0;height:0;opacity:0;color:var(--text-lo);background:var(--up)";
      container.appendChild(probe);
      const probeStyle = getComputedStyle(probe);
      const lo = rgbTriple(probeStyle.color);
      const up = rgbTriple(probeStyle.backgroundColor);
      probe.remove();

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      let w = 0;
      let h = 0;
      let loParticles: Particle[] = [];
      let upParticles: Particle[] = [];
      let rafId = 0;
      let visible = true;
      let z = 0;

      const setup = () => {
        w = container.clientWidth;
        h = container.clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const count = Math.max(80, Math.min(particleCount, Math.round((w * h) / 4200)));
        const spawn = (): Particle => ({ x: Math.random() * w, y: Math.random() * h });
        upParticles = Array.from({ length: Math.round(count / UP_STREAM_RATIO) }, spawn);
        loParticles = Array.from({ length: count - upParticles.length }, spawn);
      };

      const advance = (particles: Particle[]) => {
        ctx.beginPath();
        for (const p of particles) {
          const angle = valueNoise(p.x * noiseScale, p.y * noiseScale + z) * Math.PI * 4;
          const nx = p.x + Math.cos(angle) * 1.6 * speed;
          const ny = p.y + Math.sin(angle) * 1.6 * speed;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(nx, ny);
          p.x = nx;
          p.y = ny;
          if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
            p.x = Math.random() * w;
            p.y = Math.random() * h;
          }
        }
        ctx.stroke();
      };

      const step = () => {
        // Trail fade via destination-out keeps the stage transparent over the section bg.
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = `rgba(0, 0, 0, ${fade})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(${lo[0]}, ${lo[1]}, ${lo[2]}, 0.25)`;
        advance(loParticles);
        ctx.strokeStyle = `rgba(${up[0]}, ${up[1]}, ${up[2]}, 0.3)`;
        advance(upParticles);
        z += 0.0008 * speed;
      };

      const tick = () => {
        step();
        rafId = requestAnimationFrame(tick);
      };
      const start = () => {
        if (rafId || reduced.matches) return;
        rafId = requestAnimationFrame(tick);
      };
      const stop = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
      };

      const prime = () => {
        for (let i = 0; i < 240; i++) step();
      };

      setup();
      if (reduced.matches) prime();
      else start();

      const resizeObserver = new ResizeObserver(() => {
        setup();
        if (reduced.matches) prime();
      });
      resizeObserver.observe(container);

      const intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) start();
          else stop();
        },
        { threshold: 0.2 },
      );
      intersectionObserver.observe(container);

      const onVisibility = () => {
        if (document.hidden) stop();
        else if (visible) start();
      };
      document.addEventListener("visibilitychange", onVisibility);

      const onReducedChange = () => {
        if (reduced.matches) {
          stop();
          setup();
          prime();
        } else if (visible) start();
      };
      reduced.addEventListener("change", onReducedChange);

      return () => {
        stop();
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        reduced.removeEventListener("change", onReducedChange);
      };
    }, [particleCount, noiseScale, speed, fade]);

    return (
      <div
        ref={containerRef}
        data-slot="flow-field"
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
        style={style}
        {...props}
      >
        <canvas ref={canvasRef} className="pointer-events-none size-full" />
      </div>
    );
  },
);
FlowField.displayName = "FlowField";

export { FlowField };
