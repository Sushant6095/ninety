"use client";
import { useCallback, useRef, type RefObject } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import motion from "../../design/motion";

/** State transitions the timeline drives on the React side. All visual travel is GSAP on transform / opacity /
 *  stroke-dashoffset; these callbacks only flip the market view and push the split reprice — no re-render storm. */
export interface HaltActions {
  reset: () => void; // t0: view LIVE, freeze the drift, snap mark+chart to PRE (31), score 0–0
  halt: () => void; // FREEZE: view HALTED (halt strip under the score, cells lock, Buy/Sell panel disables)
  land: () => void; // CLIFF: repriceCells(55) + score 0–1 — the cells/tags tick-flash up; the canvas is NOT touched yet
  settle: () => void; // after the draw-on: settleChart(55) — the canvas catches up to the drawn cliff (one append)
  resume: () => void; // resume: view LIVE, unfreeze drift — the Buy/Sell panel re-enables, the market breathes
  busy: (b: boolean) => void; // gate the Replay button while the timeline runs
}

const SEC = 1000;
const AUTOPLAY_DELAY = 1.2; // autoplay once ~1.2s after mount so a screenshot/recording captures the whole shot

// Owner-canonical cold-open schedule — the exact beat OFFSETS (seconds) as absolute positions on the ONE timeline.
const AT = { flash: 0, sweep: 0.08, freeze: 0.25, cliff: 0.9, booth: 1.2, resume: 1.4 } as const;

// Per-beat DURATIONS, from the 50–500ms motion scale (motion.md); token names where design/motion.ts has them.
const D = {
  pulse: 0.04, // ponytail: sub-token GOAL flash half — motion.ts has no <100ms token; owner mandates the fastest band
  sweep: (motion.transition * 2) / SEC, // 0.40 — the amber band's L→R travel (motion.md "slower")
  freeze: motion.transition / SEC, // 0.20 — banner/dim/mute settle (motion.ts transition)
  draw: motion.slow / SEC, // 0.25 — the cliff stroke-dashoffset reveal
  booth: motion.slow / SEC, // 0.25 — the Booth line reveal
  clear: motion.slow / SEC, // 0.25 — the drawcliff fade after the canvas settles
  decay: 1.0, // ponytail: demo-compressed spread walk-back; literal ~60s tail needs a non-amber bar (amber = halt-only)
} as const;

const SPREAD_WIDE = 4.2; // spread blows out on the halt …
const SPREAD_NORMAL = 1.1; // … then tightens back as liquidity returns
const SPREAD_SCALE = SPREAD_WIDE / SPREAD_NORMAL; // scaleX at the widest (transform-only)

/** The Tier-0 halt money-shot (the demo's cold open): ONE gsap.timeline, ~2.5s, choreographing GOAL flash →
 *  amber HALT sweep → FREEZE → the price LANDS (cliff DRAWS ON via SVG stroke-dashoffset, canvas settles under) →
 *  the Booth speaks → spread decay + resume — all on transform / opacity / stroke-dashoffset (the chart canvas is
 *  never animated). Autoplays once after mount and on the Replay button. Reduced motion → gsap.matchMedia applies
 *  every state instantly (no travel). `scope` is the match section; animated elements are found by `data-halt` hooks. */
export function useHaltSequence(scope: RefObject<HTMLElement | null>, actions: HaltActions): { replay: () => void } {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const reducedRef = useRef(false);
  const applyResolvedRef = useRef<() => void>(() => {});

  useGSAP(
    () => {
      const q = (sel: string): Element[] => (scope.current ? Array.from(scope.current.querySelectorAll(sel)) : []);
      const flash = q('[data-halt="flash"]');
      const sweep = q('[data-halt="sweep"]');
      const wash = q('[data-halt="wash"]');
      const chart = q('[data-halt="chart"]');
      const cliff = q('[data-halt="cliff"]');
      const draw = q('[data-halt="drawcliff"]');
      const drawPath = q('[data-halt="drawcliff-path"]')[0] as SVGPathElement | undefined;
      const booth = q('[data-halt="booth"]');
      const dim = q('[data-halt="dim"]');
      const spread = q('[data-halt="spread"]');
      const fill = q('[data-halt="spread-fill"]');
      const len = drawPath?.getTotalLength?.() ?? 60; // cliff path length, for the stroke-dashoffset reveal
      const setSpreadLabel = (v: number): void => {
        const el = q('[data-halt="spread-label"]')[0];
        if (el) el.textContent = `spread ${v.toFixed(1)}`;
      };

      const mm = gsap.matchMedia();

      // ── Reduced motion: no autoplay, no travel — apply the resolved LIVE-post-goal frame instantly ──────────
      mm.add("(prefers-reduced-motion: reduce)", () => {
        reducedRef.current = true;
        const applyResolved = (): void => {
          actionsRef.current.reset();
          actionsRef.current.land();
          actionsRef.current.settle();
          actionsRef.current.resume();
          gsap.set([...flash, ...sweep, ...wash, ...draw, ...spread], { autoAlpha: 0 });
          gsap.set(chart, { opacity: 1 });
          gsap.set(dim, { opacity: 1 });
          gsap.set(cliff, { autoAlpha: 1, y: 0 }); // the goal glyph stays — the goal happened
          gsap.set(booth, { autoAlpha: 1, y: 0 });
        };
        applyResolvedRef.current = applyResolved;
        applyResolved();
      });

      // ── Full motion: build the paused timeline at the owner's exact offsets, autoplay once after mount ──────
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const proxy = { v: SPREAD_WIDE };
        const tl = gsap.timeline({
          paused: true,
          onStart: () => actionsRef.current.busy(true),
          onComplete: () => actionsRef.current.busy(false),
        });

        // t0 — re-arm React + hide every overlay so Replay always starts clean (all positioned at absolute 0)
        tl.call(() => actionsRef.current.reset(), undefined, 0);
        tl.set(flash, { autoAlpha: 0 }, 0);
        tl.set(sweep, { xPercent: -100, autoAlpha: 0 }, 0);
        tl.set(wash, { autoAlpha: 0 }, 0);
        tl.set(chart, { opacity: 1 }, 0);
        tl.set(cliff, { autoAlpha: 0, y: 6 }, 0);
        tl.set(draw, { autoAlpha: 0 }, 0);
        tl.set(drawPath ?? [], { strokeDasharray: len, strokeDashoffset: len }, 0);
        tl.set(booth, { autoAlpha: 0, y: 10 }, 0);
        tl.set(spread, { autoAlpha: 0 }, 0);
        tl.set(fill, { scaleX: 1, transformOrigin: "left center" }, 0);
        tl.set(dim, { opacity: 1 }, 0);

        // 1 · GOAL flash (t0) — the whole River hard-flashes one sharp amber pulse: "something just happened"
        tl.to(flash, { autoAlpha: 0.5, duration: D.pulse }, AT.flash);
        tl.to(flash, { autoAlpha: 0, duration: D.pulse }, AT.flash + D.pulse);

        // 2 · HALT band sweeps L→R (+80ms) — a crisp moving amber band; the wash + HALTED watermark fade in behind it
        tl.set(sweep, { autoAlpha: 1 }, AT.sweep);
        tl.fromTo(sweep, { xPercent: -100 }, { xPercent: 120, duration: D.sweep }, AT.sweep);
        tl.to(wash, { autoAlpha: 1, duration: D.freeze }, AT.sweep + 0.06);
        tl.set(sweep, { autoAlpha: 0 }, AT.sweep + D.sweep);

        // 3 · FREEZE (+250ms) — view HALTED (strip under the score, cells lock, panel disables), mute + dim, spread blows out
        tl.call(() => actionsRef.current.halt(), undefined, AT.freeze);
        tl.to(chart, { opacity: 0.6, duration: D.freeze }, AT.freeze);
        tl.to(dim, { opacity: 0.55, duration: D.freeze }, AT.freeze);
        tl.set(spread, { autoAlpha: 1 }, AT.freeze);
        tl.set(fill, { scaleX: SPREAD_SCALE }, AT.freeze);
        tl.call(() => setSpreadLabel(SPREAD_WIDE), undefined, AT.freeze);

        // 4 · the price LANDS (+900ms) — cells tick-flash to 55; the cliff DRAWS ON (stroke-dashoffset), goal glyph reveals
        tl.call(() => actionsRef.current.land(), undefined, AT.cliff);
        tl.set(draw, { autoAlpha: 1 }, AT.cliff);
        tl.to(drawPath ?? [], { strokeDashoffset: 0, duration: D.draw }, AT.cliff);
        tl.fromTo(cliff, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: D.draw }, AT.cliff);
        // the canvas settles UNDER the drawn cliff, then the SVG fades out (its soft/blur edges mask the handoff)
        tl.call(() => actionsRef.current.settle(), undefined, AT.cliff + D.draw);
        tl.to(draw, { autoAlpha: 0, duration: D.clear }, AT.cliff + D.draw);

        // 5 · THE BOOTH SPEAKS (+1200ms) — slides/fades in quoting the real move; feels like it reacted
        tl.to(booth, { autoAlpha: 1, y: 0, duration: D.booth }, AT.booth);

        // 6 · resume + spread decay (+1400ms) — panel re-enables, market breathes; the spread begins walking back in
        tl.call(() => actionsRef.current.resume(), undefined, AT.resume);
        tl.to(chart, { opacity: 1, duration: D.freeze }, AT.resume);
        tl.to(dim, { opacity: 1, duration: D.freeze }, AT.resume);
        tl.set(proxy, { v: SPREAD_WIDE }, AT.resume);
        tl.to(fill, { scaleX: 1, duration: D.decay }, AT.resume);
        tl.to(proxy, { v: SPREAD_NORMAL, duration: D.decay, onUpdate: () => setSpreadLabel(proxy.v) }, AT.resume);
        tl.to([...wash, ...spread], { autoAlpha: 0, duration: D.decay }, AT.resume);

        tlRef.current = tl;
        gsap.delayedCall(AUTOPLAY_DELAY, () => tl.play(0));
      });
    },
    { scope, dependencies: [] },
  );

  const replay = useCallback(() => {
    if (reducedRef.current) {
      applyResolvedRef.current();
      return;
    }
    tlRef.current?.restart();
  }, []);

  return { replay };
}
