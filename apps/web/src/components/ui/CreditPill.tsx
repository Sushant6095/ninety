"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { animate, useReducedMotion } from "framer-motion";
import { motion as m } from "../../design/motion";
import { routes } from "../../lib/routes";

interface CreditPillProps {
  credits: number; // play-money balance
}

const fmt = (n: number): string => Math.round(n).toLocaleString("en-US");

/** Play-money balance chip → portfolio. Green dot + "CR" (credits, never $).
 *  The balance counts up/down between values on change · the magicui number-ticker idiom
 *  (framer `animate` over m.count on the token ease), rolling from the PREVIOUS balance, not 0.
 *  Count-ups are for credits/stats only; a live price keeps its 180ms LivePrice flash instead.
 *  Reduced motion (and SSR/first paint) shows the final value instantly. */
export function CreditPill({ credits }: CreditPillProps) {
  const numRef = useRef<HTMLSpanElement>(null);
  const prev = useRef(credits);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = numRef.current;
    const from = prev.current;
    prev.current = credits;
    if (!el || from === credits) return;
    if (reduce) {
      el.textContent = fmt(credits);
      return;
    }
    const controls = animate(from, credits, {
      duration: m.count / 1000,
      ease: m.easeOut,
      onUpdate: (latest) => {
        el.textContent = fmt(latest);
      },
    });
    return () => controls.stop();
  }, [credits, reduce]);

  return (
    <Link
      href={routes.portfolio}
      aria-label={`${fmt(credits)} credits · open portfolio`}
      className="group inline-flex items-center gap-2 rounded-chip bg-surface px-3 py-1 outline-none ring-1 ring-inset ring-hairline transition-[box-shadow,transform,background-color] duration-200 ease-out hover:ring-up/40 focus-visible:shadow-[0_0_0_2px_var(--up)] active:scale-[0.97] active:bg-hairline/40"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_6px_var(--up)]" />
      <span ref={numRef} className="num text-body font-medium tabular-nums text-hi">{fmt(credits)}</span>
      <span className="text-label font-medium tracking-wide text-lo">CR</span>
    </Link>
  );
}
