"use client";
import { useEffect, useRef } from "react";
import { useInView, animate } from "motion/react";

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    const node = ref.current;
    if (!node) return;

    const controls = animate(0, value, {
      duration: 2.5,
      ease: "easeOut",
      onUpdate(latest) {
        // thousands separator so 1000 reads "1,000" (design law: numbers are human-legible)
        node.textContent = Math.floor(latest).toLocaleString("en-US") + suffix;
      },
    });

    return () => controls.stop();
  }, [isInView, value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

Counter.displayName = "Counter";

export default Counter;
