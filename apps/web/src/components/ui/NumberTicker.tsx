"use client";
import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { motion as m } from "../../design/motion";

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number;
  decimalPlaces?: number;
}

/** Count-up number (Magic UI number-ticker, re-skinned to Ninety: mono/tabular via `num`, token colors from
 *  the caller, token timing). Counts 0→value once on first view over `motion.count` on the token ease — the
 *  500ms ceiling, so the number never argues with its caption. SSR/no-JS/reduced-motion show the final value. */
export function NumberTicker({ value, decimalPlaces = 0, className = "", ...props }: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const fmt = (n: number) =>
    Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(Number(n.toFixed(decimalPlaces)));

  useEffect(() => {
    const el = ref.current;
    if (!isInView || !el) return;
    if (reduce) {
      el.textContent = fmt(value);
      return;
    }
    const controls = animate(0, value, {
      duration: m.count / 1000,
      ease: m.easeOut,
      onUpdate: (latest) => {
        el.textContent = fmt(latest);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView, reduce, value, decimalPlaces]);

  return (
    <span ref={ref} className={`num inline-block tabular-nums ${className}`} {...props}>
      {fmt(value)}
    </span>
  );
}
