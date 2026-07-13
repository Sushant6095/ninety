"use client";

/** Speaking indicator — the Booth's eq-bars (the BoothTimeline motif) pulsing on scaleY via a CSS keyframe.
 *  Isolated micro-motion on its own elements (never the GSAP timeline, never Framer) so no double-animation. */
function EqBars() {
  const bars = [0, 120, 240, 360, 180]; // staggered start so the bars read as live speech, not a sync flash
  return (
    <span className="flex h-4 shrink-0 items-end gap-[2px]" aria-hidden>
      {bars.map((delay, i) => (
        <span key={i} className="eq-bar h-full w-[2px] rounded-full bg-up" style={{ animationDelay: `${delay}ms` }} />
      ))}
    </span>
  );
}

interface BoothLineProps {
  quote: string; // the reactive call, bound to the real before→after away-win%
  delta: number; // points the away-win% stepped (POST − PRE)
}

/** The Booth line under the River (Booth Mount A) — a persistent, reactive AI call. Hidden until the halt
 *  choreography reveals it as the final beat (GSAP slides `[data-halt="booth"]` up + fades it in), then it
 *  STAYS through the resume to LIVE. Hand-built Ninety piece: no registry has the Booth. */
export function BoothLine({ quote, delta }: BoothLineProps) {
  return (
    <div
      data-halt="booth"
      className="invisible mt-2 flex items-start gap-2.5 border-t border-hairline px-1 pt-3 opacity-0"
    >
      <EqBars />
      <div className="min-w-0 flex-1">
        <span className="text-label font-semibold uppercase tracking-[0.12em] text-lo">The booth · live</span>
        <p className="mt-0.5 text-body leading-snug text-hi">{quote}</p>
      </div>
      <span className="num shrink-0 rounded bg-up/12 px-1 py-0.5 text-label font-semibold text-up ring-1 ring-inset ring-up/25">
        ▲{Math.abs(delta)}
      </span>
    </div>
  );
}
