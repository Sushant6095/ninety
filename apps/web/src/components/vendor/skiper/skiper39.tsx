"use client";
// skiper-ui "skiper39" CrowdCanvas (skiper-ui.com/registry/skiper39), re-skinned to Ninety:
// - `import { gsap } from "gsap"` → the @/lib/gsap wrapper (law: never the bare package), so the
//   walk timelines inherit the registered plugins and the ninety ease defaults
// - the openpeeps sprite sheet is gone (no such asset ships, and stock illustration art is
//   non-Ninety content): peeps are abstract silhouettes — a head dot over a body capsule — drawn
//   in token colors resolved at runtime (text-lo base, roughly one in eight carries the up accent)
// - gsap.ticker render + all walk timelines are IntersectionObserver-gated: everything PAUSES
//   offscreen; devicePixelRatio capped at 1.5; count is modest (default 90)
// - prefers-reduced-motion → one static scattered crowd frame, no timelines, no ticker
// - the white demo stage (Skiper39) is deleted; only the canvas primitive ships
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { resolveColor } from "@/design/tokens";

interface CrowdCanvasProps {
  /** How many peeps walk the band. Keep modest — every peep is a live gsap timeline. */
  count?: number;
  className?: string;
}

type WalkTimeline = ReturnType<typeof gsap.timeline>;

interface Peep {
  x: number;
  y: number; // baseline (feet)
  h: number; // silhouette height
  scaleX: number;
  depth: number; // 0 = front row, 1 = back row
  color: string;
  alpha: number;
  walk: WalkTimeline | null;
}

const UP_ACCENT_RATIO = 8; // ~1 in 8 peeps wears the up color
const DPR_CAP = 1.5;

export function CrowdCanvas({ count = 90, className = "" }: CrowdCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lo = resolveColor("textLo") || "";
    const up = resolveColor("up") || "";
    const stage = { w: 0, h: 0 };
    const peeps: Peep[] = [];
    let ticking = false;

    const makePeep = (i: number): Peep => {
      const depth = Math.random();
      const h = 24 - depth * 12; // back rows are smaller
      return {
        x: 0,
        y: 0,
        h,
        scaleX: 1,
        depth,
        color: i % UP_ACCENT_RATIO === 0 ? up : lo,
        alpha: 0.28 + (1 - depth) * 0.38, // front rows read stronger
        walk: null,
      };
    };

    const placePeep = (peep: Peep) => {
      // Baseline: back rows sit higher up the band (cheap depth).
      peep.y = stage.h - 2 - peep.depth * Math.max(0, stage.h * 0.45 - peep.h);
    };

    // ponytail: one walk style (amble across + bob), the vendor's walks[] indirection dropped
    const startWalk = (peep: Peep) => {
      const dir = Math.random() > 0.5 ? 1 : -1;
      const margin = peep.h;
      const startX = dir === 1 ? -margin : stage.w + margin;
      const endX = dir === 1 ? stage.w + margin : -margin;
      peep.scaleX = dir;
      peep.x = startX;
      placePeep(peep);

      const xDuration = 14;
      const bob = 0.28;
      const tl = gsap.timeline({
        onComplete: () => startWalk(peep), // recycle: re-enter from a random side
      });
      tl.timeScale(0.5 + Math.random());
      tl.to(peep, { duration: xDuration, x: endX, ease: "none" }, 0);
      tl.to(peep, { duration: bob, repeat: Math.round(xDuration / bob), yoyo: true, y: peep.y - 2.5, ease: "none" }, 0);
      peep.walk?.kill();
      peep.walk = tl;
    };

    const drawPeep = (peep: Peep) => {
      const { h } = peep;
      const headR = h * 0.17;
      const bodyW = h * 0.34;
      ctx.save();
      ctx.translate(peep.x, peep.y);
      ctx.scale(peep.scaleX, 1);
      ctx.globalAlpha = peep.alpha;
      ctx.fillStyle = peep.color;
      // body capsule (feet at y=0)
      ctx.beginPath();
      const bodyH = h - headR * 2.4;
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(-bodyW / 2, -bodyH, bodyW, bodyH, bodyW / 2);
      } else {
        ctx.rect(-bodyW / 2, -bodyH, bodyW, bodyH);
      }
      ctx.fill();
      // head
      ctx.beginPath();
      ctx.arc(0, -bodyH - headR * 1.15, headR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      ctx.scale(dpr, dpr);
      // back-to-front by baseline
      for (const peep of [...peeps].sort((a, b) => a.y - b.y)) drawPeep(peep);
    };

    const startAll = () => {
      if (ticking) return;
      ticking = true;
      peeps.forEach((p) => p.walk?.resume());
      gsap.ticker.add(render);
    };
    const stopAll = () => {
      if (!ticking) return;
      ticking = false;
      peeps.forEach((p) => p.walk?.pause());
      gsap.ticker.remove(render);
    };

    const resize = () => {
      stage.w = canvas.clientWidth;
      stage.h = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = stage.w * dpr;
      canvas.height = stage.h * dpr;
      if (reduce) {
        // Static scatter: place everyone somewhere along the band, draw once.
        peeps.forEach((p) => {
          p.x = Math.random() * stage.w;
          placePeep(p);
        });
        render();
      } else {
        peeps.forEach((p) => {
          startWalk(p);
          p.walk?.progress(Math.random()); // mid-stride, not a synchronized start
          if (!ticking) p.walk?.pause();
        });
        if (ticking) render();
      }
    };

    for (let i = 0; i < count; i++) peeps.push(makePeep(i));
    resize();

    window.addEventListener("resize", resize);

    let io: IntersectionObserver | null = null;
    if (!reduce) {
      io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) startAll();
        else stopAll();
      });
      io.observe(canvas);
    }

    return () => {
      window.removeEventListener("resize", resize);
      io?.disconnect();
      stopAll();
      peeps.forEach((p) => p.walk?.kill());
    };
  }, [count]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}

/**
 * Skiper 39 Canvas_Landing_004 — React + Canvas
 * Inspired by and adapted from https://codepen.io/zadvorsky/pen/xxwbBQV
 * We respect the original creators. This is an inspired rebuild with our own taste and does not claim any ownership.
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 *
 * Author: @gurvinder-singh02 · https://gxuri.me
 */
