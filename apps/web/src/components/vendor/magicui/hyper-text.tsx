"use client";
// magicui "hyper-text" (magicui.design/r/hyper-text), re-skinned to Ninety:
// - framer wrappers stripped — the pull's motion.span/AnimatePresence carried NO animation props
//   (the scramble is rAF + state), so they were pure bundle weight; this is now vanilla React
// - forced .toUpperCase() removed (copy law: sentence case) and the scramble set is lowercase
// - stock "py-2 text-4xl font-bold" base dropped — the callsite owns the type tokens
// - the final text renders as an invisible sizer (also the SR text) with the scramble overlaid
//   absolutely, so the surrounding layout never reflows while characters spin
// - prefers-reduced-motion → the final text, instantly; the scramble never runs
// - fires ONCE (in view by default), then is inert — no hover re-trigger on the landing
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_CHARACTER_SET = Object.freeze("abcdefghijklmnopqrstuvwxyz".split("")) as readonly string[];

interface HyperTextProps {
  /** The final text. Punctuation and spaces never scramble — the sentence rhythm holds. */
  children: string;
  className?: string;
  /** Total scramble duration in ms. */
  duration?: number;
  /** Delay before the scramble starts, in ms. */
  delay?: number;
  /** Start when scrolled into view (default) instead of on mount. */
  startOnView?: boolean;
  characterSet?: readonly string[];
}

const isScrambleChar = (ch: string): boolean => /[a-zA-Z0-9]/.test(ch);

export function HyperText({
  children,
  className,
  duration = 800,
  delay = 0,
  startOnView = true,
  characterSet = DEFAULT_CHARACTER_SET,
}: HyperTextProps) {
  const [display, setDisplay] = useState(children);
  const [running, setRunning] = useState(false);
  const doneRef = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Trigger once — reduced motion means the final text is already there, nothing fires.
  useEffect(() => {
    if (doneRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doneRef.current = true;
      return;
    }
    if (!startOnView) {
      const t = setTimeout(() => setRunning(true), delay);
      return () => clearTimeout(t);
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setRunning(true), delay);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay, startOnView]);

  // The scramble — one rAF pass, then static forever.
  useEffect(() => {
    if (!running || doneRef.current) return;
    let raf = 0;
    const startTime = performance.now();
    const max = children.length;
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const revealed = progress * max;
      setDisplay(
        children
          .split("")
          .map((ch, i) =>
            !isScrambleChar(ch) || i <= revealed
              ? ch
              : (characterSet[Math.floor(Math.random() * characterSet.length)] as string),
          )
          .join(""),
      );
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        doneRef.current = true;
        setRunning(false);
        setDisplay(children);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, children, duration, characterSet]);

  return (
    <span ref={ref} className={cn("relative inline-block", className)}>
      {/* the real text: sizes the box and is what screen readers hear */}
      <span className="opacity-0">{children}</span>
      <span aria-hidden className="absolute inset-0">
        {display}
      </span>
    </span>
  );
}
