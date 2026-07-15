"use client";
// godui "particle-dissolve" (godui.design/r/particle-dissolve), re-skinned to Ninety:
// - the pull's rAF loop ran FOREVER once started (an idle "breathe" shimmer kept it alive);
//   re-skin: the loop starts only when triggered and STOPS when the shape settles — a one-shot
//   entrance leaves a static canvas and zero rAF behind (GPU law)
// - devicePixelRatio cap 2 → 1.5
// - the hardcoded ui-sans-serif font default is gone: the family resolves from the canvas's
//   computed style, so `className="font-ui text-lo"` gives Inter particles in the lo token
//   (color already resolved from computed style in the pull — kept)
// - reduced motion → the formed shape drawn once, instantly (as pulled)

import { useReducedMotion } from "framer-motion";
import * as React from "react";

export type ParticleDissolveProps = Omit<
  React.HTMLAttributes<HTMLCanvasElement>,
  "children"
> & {
  /** Text to render as particles. Ignored when `src` is set. */
  text?: string;
  /** Image URL to sample into particles. */
  src?: string;
  /** Canvas width in CSS px. */
  width?: number;
  /** Canvas height in CSS px. */
  height?: number;
  /** Resting behaviour once triggered. */
  mode?: "assemble" | "disperse" | "loop";
  /** When the animation starts. */
  trigger?: "mount" | "in-view" | "hover";
  /** Pixel sampling step — smaller is denser (and heavier). */
  density?: number;
  /** Particle dot size in px. */
  particleSize?: number;
  /** Fill color for text particles (any CSS color). Defaults to the text color. */
  color?: string;
  /** Full CSS font override for text particles. Defaults to fontWeight/fontSize + the computed family. */
  font?: string;
  /** Text particle font size in px (ignored when `font` is set). */
  fontSize?: number;
  /** Text particle font weight (ignored when `font` is set). */
  fontWeight?: number;
};

type Particle = {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  delay: number;
  jitter: number;
  color: string;
};

const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;

const ParticleDissolve = React.forwardRef<
  HTMLCanvasElement,
  ParticleDissolveProps
>(
  (
    {
      text,
      src,
      width = 640,
      height = 240,
      mode = "assemble",
      trigger = "in-view",
      density = 4,
      particleSize = 2,
      color,
      font,
      fontSize = 96,
      fontWeight = 600,
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    React.useImperativeHandle(
      forwardedRef,
      () => canvasRef.current as HTMLCanvasElement,
    );
    const reduce = useReducedMotion();

    const particles = React.useRef<Particle[]>([]);
    const p = React.useRef(mode === "disperse" ? 1 : 0); // 0 = scattered, 1 = formed
    const goal = React.useRef(mode === "disperse" ? 1 : 0); // hold until triggered
    const raf = React.useRef<number | null>(null);
    const phaseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const kickRef = React.useRef<(() => void) | null>(null); // restarts the settled loop (hover trigger)

    // Build particle targets by rendering the source offscreen and sampling it.
    const build = React.useCallback(
      (resolvedColor: string, resolvedFont: string) => {
        const off = document.createElement("canvas");
        off.width = width;
        off.height = height;
        const octx = off.getContext("2d", { willReadFrequently: true });
        if (!octx) return Promise.resolve();

        const sample = () => {
          const data = octx.getImageData(0, 0, width, height).data;
          const next: Particle[] = [];
          for (let y = 0; y < height; y += density) {
            for (let x = 0; x < width; x += density) {
              const i = (y * width + x) * 4;
              if ((data[i + 3] as number) > 128) {
                const r = data[i] as number;
                const g = data[i + 1] as number;
                const b = data[i + 2] as number;
                next.push({
                  tx: x,
                  ty: y,
                  sx: Math.random() * width,
                  sy: Math.random() * height,
                  delay: Math.random() * 0.4,
                  jitter: Math.random() * Math.PI * 2,
                  color: src ? `rgb(${r},${g},${b})` : resolvedColor,
                });
              }
            }
          }
          particles.current = next;
        };

        if (src) {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              // Contain the image within the canvas.
              const scale = Math.min(width / img.width, height / img.height);
              const w = img.width * scale;
              const h = img.height * scale;
              octx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
              try {
                sample();
              } catch {
                // Cross-origin image without CORS — leave particles empty.
              }
              resolve();
            };
            img.onerror = () => resolve();
            img.src = src;
          });
        }

        octx.fillStyle = "rgb(255,255,255)"; // sampling mask only — alpha is what's read, never shown
        octx.textAlign = "center";
        octx.textBaseline = "middle";
        octx.font = resolvedFont;
        octx.fillText(text ?? "", width / 2, height / 2);
        sample();
        return Promise.resolve();
      },
      [width, height, density, src, text],
    );

    const draw = React.useCallback(
      (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, width, height);
        const prog = p.current;
        for (const pt of particles.current) {
          const eff =
            prog <= 0
              ? 0
              : easeInOut(
                  Math.max(0, Math.min(1, (prog - pt.delay) / (1 - pt.delay))),
                );
          // Re-skin: the pull's idle "breathe" shimmer is gone — it kept a rAF loop alive forever.
          const x = pt.sx + (pt.tx - pt.sx) * eff;
          const y = pt.sy + (pt.ty - pt.sy) * eff;
          ctx.globalAlpha = Math.max(0.1, eff);
          ctx.fillStyle = pt.color;
          ctx.fillRect(x, y, particleSize, particleSize);
        }
        ctx.globalAlpha = 1;
      },
      [width, height, particleSize],
    );

    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      const resolved = color || getComputedStyle(canvas).color || "rgb(0,0,0)";
      const family = getComputedStyle(canvas).fontFamily || "ui-sans-serif, system-ui, sans-serif";
      const resolvedFont = font ?? `${fontWeight} ${fontSize}px ${family}`;

      let cancelled = false;
      build(resolved, resolvedFont).then(() => {
        if (cancelled) return;

        // Reduced motion: render the formed shape once, no animation.
        if (reduce) {
          p.current = 1;
          draw(ctx);
          return;
        }

        // Paint the resting state once; the loop runs only from trigger until settle.
        draw(ctx);

        const loop = () => {
          const delta = goal.current - p.current;
          p.current += delta * 0.06;
          draw(ctx);
          if (mode !== "loop" && Math.abs(delta) < 0.004) {
            // Settled: snap, draw the final frame, and release the rAF entirely.
            p.current = goal.current;
            draw(ctx);
            raf.current = null;
            return;
          }
          raf.current = requestAnimationFrame(loop);
        };
        const kick = () => {
          if (raf.current == null && !cancelled) raf.current = requestAnimationFrame(loop);
        };
        kickRef.current = kick;

        const runLoopMode = () => {
          const cycle = () => {
            goal.current = goal.current > 0.5 ? 0 : 1;
            phaseTimer.current = setTimeout(cycle, 2600);
          };
          cycle();
        };

        const start = () => {
          if (mode === "loop") runLoopMode();
          else goal.current = mode === "disperse" ? 0 : 1;
          kick();
        };

        if (trigger === "mount") {
          start();
        } else if (trigger === "in-view") {
          const io = new IntersectionObserver(
            (entries) => {
              if (entries.some((e) => e.isIntersecting)) {
                start();
                io.disconnect();
              }
            },
            { threshold: 0.3 },
          );
          io.observe(canvas);
        }
        // `hover` is handled by the pointer handlers below.
      });

      return () => {
        cancelled = true;
        kickRef.current = null;
        if (raf.current != null) cancelAnimationFrame(raf.current);
        raf.current = null;
        if (phaseTimer.current != null) clearTimeout(phaseTimer.current);
      };
    }, [build, draw, reduce, mode, trigger, width, height, color, font, fontSize, fontWeight]);

    const hoverProps =
      trigger === "hover" && !reduce
        ? {
            onPointerEnter: () => {
              goal.current = mode === "disperse" ? 0 : 1;
              kickRef.current?.();
            },
            onPointerLeave: () => {
              goal.current = mode === "disperse" ? 1 : 0;
              kickRef.current?.();
            },
          }
        : {};

    return (
      <canvas
        ref={canvasRef}
        data-slot="particle-dissolve"
        role="img"
        aria-label={text ? text : "Particle image"}
        className={className}
        style={{ width, height, maxWidth: "100%" }}
        {...hoverProps}
        {...props}
      />
    );
  },
);
ParticleDissolve.displayName = "ParticleDissolve";

export { ParticleDissolve };
