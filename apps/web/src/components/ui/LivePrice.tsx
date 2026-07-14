"use client";
import { useEffect, useRef, useState } from "react";

// A mono number that flashes up/down for one 180ms tick when its value changes (design law).
// The flash is keyed by a tick COUNTER, not direction state: a keyed remount restarts the one-shot
// CSS keyframe, so rapid same-direction ticks each pulse (direction-state alone was a React no-op —
// the tape went silent exactly when the market was busiest). The keyframe ends on its own; no timeout.
export function LivePrice({ value, decimals = 1, className = "" }: { value: number; decimals?: number; className?: string }) {
  const prev = useRef(value);
  const [tick, setTick] = useState<{ n: number; dir: "" | "up" | "down" }>({ n: 0, dir: "" });

  useEffect(() => {
    const p = prev.current;
    prev.current = value;
    if (value > p + 1e-6) setTick((t) => ({ n: t.n + 1, dir: "up" }));
    else if (value < p - 1e-6) setTick((t) => ({ n: t.n + 1, dir: "down" }));
  }, [value]);

  return (
    <span
      key={tick.n}
      className={`num tabular-nums ${tick.dir === "up" ? "flash-up" : tick.dir === "down" ? "flash-down" : ""} ${className}`}
    >
      {value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}
