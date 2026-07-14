"use client";
import { useCallback, useEffect, useRef } from "react";
import { resolveColor } from "../../design/tokens";

// Originkit "blackhole" (BlackHole accretion disk), ported to Ninety law: canvas-2D (no WebGL),
// token colors via resolveColor (zero hex), transparent stage, particle count trimmed 1000→320,
// rAF PAUSED offscreen (IntersectionObserver) and under reduced motion (one static frame, no loop).
// Landing "price is probability" backdrop ONLY — everything collapses into the one number.

interface Particle {
  angle: number;
  radius: number;
  height: number;
  speedOffset: number;
  colorIdx: number;
}

const PERSPECTIVE = 1300;
const COUNT = 320;
const VOID_RADIUS = 46;
const OUTER_PCT = 0.72; // of half-width
const TILT = 18;
const TILT_SIDEWAY = 160;
const ORBIT_SPEED = 3;
const PULL_SPEED = 0.35;
const TRAIL_ALPHA = 0.09; // slow fade → soft orbital trails
const PARTICLE_SIZE = 1.4;

export function PriceVoid({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef(0);
  const visibleRef = useRef(false);
  const sizeRef = useRef({ w: 600, h: 600 });

  const seed = useCallback((outerRad: number, colorsLength: number) => {
    const pts: Particle[] = [];
    for (let i = 0; i < COUNT; i++) {
      pts.push({
        angle: Math.random() * Math.PI * 2,
        // density clusters near the horizon (gravity)
        radius: VOID_RADIUS + Math.pow(Math.random(), 2) * (outerRad - VOID_RADIUS),
        height: (Math.random() - 0.5) * 16,
        speedOffset: 0.75 + Math.random() * 0.5,
        colorIdx: Math.floor(Math.random() * colorsLength),
      });
    }
    particlesRef.current = pts;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const colors = [resolveColor("up"), resolveColor("textLo"), resolveColor("hairline")].filter(Boolean) as string[];
    const bg = resolveColor("bg") || "";

    const outerRad = () => VOID_RADIUS + OUTER_PCT * (sizeRef.current.w / 2 - VOID_RADIUS);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const prev = sizeRef.current;
        sizeRef.current = { w: width, h: height };
        if (prev.w !== width || prev.h !== height) seed(outerRad(), colors.length);
        if (reduce) drawFrame(3, true); // keep the static frame sized
      }
    });
    ro.observe(container);
    seed(outerRad(), colors.length);

    let lastTime = performance.now();

    const drawFrame = (dt: number, clear: boolean) => {
      const { w, h } = sizeRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      if (clear) ctx.clearRect(0, 0, w, h);
      else {
        // trail fade via destination-out keeps the canvas transparent over the page bg
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = `rgba(0, 0, 0, ${TRAIL_ALPHA})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      }

      const oRad = outerRad();
      const cx = w / 2;
      const cy = h / 2;
      const tiltRad = (TILT * Math.PI) / 180;
      const rollRad = (TILT_SIDEWAY * Math.PI) / 180;
      const behind: Array<{ x: number; y: number; size: number; alpha: number; z: number; color: string }> = [];
      const front: typeof behind = [];

      for (const pt of particlesRef.current) {
        const speedFactor = Math.sqrt(VOID_RADIUS / Math.max(pt.radius, 10));
        pt.angle += ORBIT_SPEED * speedFactor * pt.speedOffset * 0.012 * dt;
        pt.radius -= PULL_SPEED * speedFactor * pt.speedOffset * dt;
        if (pt.radius < VOID_RADIUS) {
          pt.radius = VOID_RADIUS + (0.7 + Math.random() * 0.3) * (oRad - VOID_RADIUS);
          pt.angle = Math.random() * Math.PI * 2;
          pt.height = (Math.random() - 0.5) * 16;
          continue;
        }
        const xB = pt.radius * Math.cos(pt.angle);
        const yB = pt.height;
        const zB = pt.radius * Math.sin(pt.angle);
        const y1 = yB * Math.cos(tiltRad) + zB * Math.sin(tiltRad);
        const z1 = -yB * Math.sin(tiltRad) + zB * Math.cos(tiltRad);
        const x3 = xB * Math.cos(rollRad) - y1 * Math.sin(rollRad);
        const y3 = xB * Math.sin(rollRad) + y1 * Math.cos(rollRad);
        const scale = PERSPECTIVE / (PERSPECTIVE + z1);
        const px = cx + x3 * scale;
        const py = cy + y3 * scale;
        if (px < -30 || px > w + 30 || py < -30 || py > h + 30) continue;
        const item = {
          x: px,
          y: py,
          size: Math.max(0.3, PARTICLE_SIZE * scale),
          alpha: Math.max(0.3, 1 - ((z1 + oRad) / (2 * oRad)) * 0.5),
          z: z1,
          color: colors[pt.colorIdx % colors.length],
        };
        (z1 >= 0 ? behind : front).push(item);
      }
      behind.sort((a, b) => b.z - a.z);
      front.sort((a, b) => b.z - a.z);

      for (const pt of behind) {
        ctx.globalAlpha = pt.alpha * 0.9;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      // the event horizon — a flat token-bg disc (no gradient; design law)
      ctx.globalAlpha = 1;
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(cx, cy, VOID_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors[2] ?? colors[0];
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1;
      ctx.stroke();
      for (const pt of front) {
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.667, 3);
      lastTime = now;
      drawFrame(dt, false);
      animRef.current = requestAnimationFrame(loop);
    };

    const start = () => {
      if (animRef.current || reduce) return;
      lastTime = performance.now();
      animRef.current = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(animRef.current);
      animRef.current = 0;
    };

    if (reduce) {
      // no loop, no travel — one resolved frame
      drawFrame(3, true);
    } else {
      // the loop runs ONLY while the section is on screen
      const io = new IntersectionObserver(([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) start();
        else stop();
      });
      io.observe(container);
      return () => {
        io.disconnect();
        ro.disconnect();
        stop();
      };
    }
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  return (
    <div ref={containerRef} aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
