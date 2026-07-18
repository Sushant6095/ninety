"use client";
// GoalReplayScroll — scroll-scrubbed image sequence for the LANDING (ADR-058 dynamism; landing-only,
// NEVER on /terminal, the board, or any live-price surface — a full-screen canvas scrub contends with the
// 150ms tick path). Technique is the Apple/"iron-man-jet" frame-scrub: pin a full-bleed <canvas>, preload N
// JPG frames, and paint frame = round(progress * N) as the user scrolls. We drive it through GSAP
// ScrollTrigger (our PRIMARY animation lib, ADR-052/059) — pin + scrub + auto-refresh on resize — instead of
// hand-rolled scroll math. Colours via tokens only; numbers .num/tabular; prefers-reduced-motion honoured.
//
// Perf: frames are decoded OFF the main thread via createImageBitmap (with a small concurrency pool) so the
// decode never janks the River tick or the hero gradient. Right-size the asset: ~80–100 frames at ~1600px,
// JPG q≈72. A blank/duplicated canvas is a ship-blocker (Verification law) — the loader gates paint until the
// first frame is decoded, and resize re-paints the last frame so the panel is never empty.
import { useRef, useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "../../lib/gsap";

void ScrollTrigger; // registered in lib/gsap.ts; referenced so the plugin ships with this island

type Decoded = ImageBitmap | HTMLImageElement;
const dimOf = (d: Decoded): { w: number; h: number } =>
  d instanceof HTMLImageElement ? { w: d.naturalWidth, h: d.naturalHeight } : { w: d.width, h: d.height };

export interface GoalReplayScrollProps {
  /** Number of frames in the sequence (1-indexed files). */
  frameCount?: number;
  /** Path for frame n (1..frameCount). Default: /frames/goal/goal_0001.jpg … */
  framePath?: (n: number) => string;
  /** Scroll length of the pinned scrub, in viewport heights (matches the iron-man 300–400vh feel). */
  pinLengthVh?: number;
  /** Parallel decode workers — keep low so the landing's other assets aren't starved. */
  concurrency?: number;
  eyebrow?: string;
  headline?: string;
  sub?: string;
  className?: string;
}

export function GoalReplayScroll({
  frameCount = 90,
  framePath = (n) => `/frames/goal/goal_${String(n).padStart(4, "0")}.jpg`,
  pinLengthVh = 360,
  concurrency = 6,
  eyebrow = "REPLAY · 74'",
  headline = "Every goal moves the market.",
  sub = "Scroll the goal. The price re-rates in real time — priced by TxLINE, proven on-chain.",
  className = "",
}: GoalReplayScrollProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const seqRef = useRef<HTMLSpanElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);

  const framesRef = useRef<Decoded[]>([]);
  const lastDrawn = useRef(-1);
  const [progress, setProgress] = useState(0); // decode progress 0..1
  const [ready, setReady] = useState(false);

  // Cover-fit paint (DPR-aware), centred — same geometry as the reference, tokenised background.
  const draw = (index: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    const ctx = canvas?.getContext("2d");
    if (!canvas || !img || !ctx) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const { w: iw, h: ih } = dimOf(img);
    if (!iw || !ih) return;
    const imgRatio = iw / ih;
    const canvasRatio = cw / ch;
    let drawW: number;
    let drawH: number;
    if (canvasRatio > imgRatio) {
      drawW = cw;
      drawH = cw / imgRatio;
    } else {
      drawH = ch;
      drawW = ch * imgRatio;
    }
    // Mobile: cover-fit + 1.3× zoom so the subject reads larger on small screens (skill ref 03).
    if (window.innerWidth <= 768) {
      drawW *= 1.3;
      drawH *= 1.3;
    }
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - drawW) / 2, (ch - drawH) / 2, drawW, drawH);
  };

  const sizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR — 3x on phones is wasted fill-rate
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    draw(lastDrawn.current >= 0 ? lastDrawn.current : 0);
  };

  useGSAP(
    () => {
      const section = sectionRef.current;
      const panel = panelRef.current;
      if (!section || !panel) return;

      let cancelled = false;
      const mm = gsap.matchMedia();

      // Decode a single frame off the main thread; fall back to <img> where createImageBitmap is absent.
      const decode = async (n: number): Promise<Decoded> => {
        const url = framePath(n);
        if ("createImageBitmap" in window) {
          const res = await fetch(url);
          return createImageBitmap(await res.blob());
        }
        return new Promise((resolve, reject) => {
          const im = new Image();
          im.onload = () => resolve(im);
          im.onerror = reject;
          im.src = url;
        });
      };

      // Bounded-concurrency preload so we don't open 90 sockets at once on a landing that also
      // streams the hero gradient + River. Poster (last frame) first, so reduced-motion can paint instantly.
      const preload = async (indices: number[]) => {
        let done = 0;
        const queue = indices.slice();
        const work = async () => {
          while (!cancelled && queue.length) {
            const i = queue.shift()!;
            try {
              framesRef.current[i] = await decode(i + 1);
            } catch {
              /* leave undefined — draw() skips missing frames rather than throwing */
            }
            done++;
            if (!cancelled) setProgress(done / indices.length);
          }
        };
        await Promise.all(Array.from({ length: Math.min(concurrency, indices.length) }, work));
      };

      sizeCanvas();
      window.addEventListener("resize", sizeCanvas);

      // FULL EXPERIENCE — decode all frames, pin the panel, scrub frame index to scroll progress.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        (async () => {
          await preload(Array.from({ length: frameCount }, (_, i) => i));
          if (cancelled) return;
          draw(0);
          lastDrawn.current = 0;
          setReady(true);

          const proxy = { f: 0 };
          gsap.to(proxy, {
            f: frameCount - 1,
            ease: "none",
            scrollTrigger: {
              trigger: panel,
              start: "top top",
              end: () => "+=" + window.innerHeight * (pinLengthVh / 100),
              pin: panel,
              scrub: true,
              invalidateOnRefresh: true,
            },
            onUpdate: () => {
              const idx = Math.min(frameCount - 1, Math.max(0, Math.round(proxy.f)));
              if (idx !== lastDrawn.current) {
                lastDrawn.current = idx;
                draw(idx);
                if (seqRef.current) seqRef.current.textContent = `SEQ ${String(idx + 1).padStart(3, "0")} / ${frameCount}`;
              }
              if (fillRef.current) fillRef.current.style.transform = `scaleX(${proxy.f / (frameCount - 1)})`;
            },
          });
          ScrollTrigger.refresh(); // heights settled after async decode — recompute the pinned track
        })();
      });

      // REDUCED MOTION — no pin, no scrub: decode only the final frame and hold it as a still hero.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        (async () => {
          const last = frameCount - 1;
          try {
            framesRef.current[last] = await decode(frameCount);
          } catch {
            /* ignore */
          }
          if (cancelled) return;
          draw(last);
          lastDrawn.current = last;
          setProgress(1);
          setReady(true);
          if (seqRef.current) seqRef.current.textContent = `SEQ ${String(frameCount).padStart(3, "0")} / ${frameCount}`;
          if (fillRef.current) fillRef.current.style.transform = "scaleX(1)";
        })();
      });

      return () => {
        cancelled = true;
        window.removeEventListener("resize", sizeCanvas);
        mm.revert();
        // release GPU memory held by decoded bitmaps
        framesRef.current.forEach((d) => d instanceof ImageBitmap && d.close());
        framesRef.current = [];
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="goal-replay"
      className={`relative border-t border-border bg-background ${className}`}
      aria-label="Goal replay — scroll to scrub the sequence"
    >
      <div
        ref={panelRef}
        className="relative min-h-[100dvh] w-full overflow-hidden bg-background"
        style={{ height: "100dvh", willChange: "transform", transform: "translateZ(0)" }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ willChange: "contents" }} />

        {/* Legibility scrims so the overlay copy stays readable over ANY frame in BOTH themes (token-tinted,
            not raw hex): a bottom vignette for the progress hairline + a top band for the eyebrow/SEQ labels.
            The scrim tracks var(--bg), so paired with text-hi/text-lo copy it clears AA in light and dark. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 92%, transparent 34%, color-mix(in srgb, var(--bg) 55%, transparent) 72%, color-mix(in srgb, var(--bg) 88%, transparent) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-44"
          style={{
            background:
              "linear-gradient(to bottom, color-mix(in srgb, var(--bg) 82%, transparent) 0%, color-mix(in srgb, var(--bg) 40%, transparent) 55%, transparent 100%)",
          }}
        />

        {/* Eyebrow + headline */}
        <div className="pointer-events-none absolute left-6 top-24 z-10 flex max-w-[46ch] flex-col gap-4 md:left-12 md:top-28">
          <span className="num text-label uppercase tracking-caps text-hi">
            {eyebrow}
          </span>
          <h2
            className="font-semibold leading-[0.98] tracking-tight text-foreground"
            style={{ fontSize: "var(--text-section)" }}
          >
            {headline}
          </h2>
          <p className="max-w-[42ch] text-sm leading-relaxed md:text-base" style={{ color: "var(--text-lo)" }}>
            {sub}
          </p>
        </div>

        {/* SEQ readout (mono/tabular) */}
        <div className="pointer-events-none absolute right-6 top-24 z-10 flex items-center gap-3 md:right-12 md:top-28">
          <span ref={seqRef} className="num text-label uppercase tracking-caps text-hi">
            SEQ 001 / {frameCount}
          </span>
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--up)" }} />
        </div>

        {/* Scrub progress hairline */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
          <div className="mx-6 mb-4 h-px md:mx-12" style={{ background: "var(--hairline)" }}>
            <div
              ref={fillRef}
              className="h-full origin-left"
              style={{ background: "var(--up)", transform: "scaleX(0)" }}
            />
          </div>
        </div>

        {/* Loader — gates paint until the first frame is decoded (never ship a blank canvas) */}
        {!ready && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-background px-6">
            <span className="num text-label uppercase tracking-caps" style={{ color: "var(--text-lo)" }}>
              Loading replay
            </span>
            <div className="h-px w-60 md:w-80" style={{ background: "var(--hairline)" }}>
              <div
                className="h-full"
                style={{ background: "var(--up)", width: `${Math.round(progress * 100)}%`, transition: "width var(--duration) var(--ease-out)" }}
              />
            </div>
            <span className="num text-label tabular-nums" style={{ color: "var(--text-lo)" }}>
              {Math.round(progress * 100)}%
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export default GoalReplayScroll;
