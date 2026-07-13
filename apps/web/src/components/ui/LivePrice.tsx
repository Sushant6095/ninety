"use client";
import { useEffect, useRef, useState } from "react";

// A mono number that flashes up/down for one 180ms tick when its value changes (design law).
export function LivePrice({ value, decimals = 1, className = "" }: { value: number; decimals?: number; className?: string }) {
  const prev = useRef(value);
  const [flash, setFlash] = useState<"" | "up" | "down">("");

  useEffect(() => {
    const p = prev.current;
    prev.current = value;
    if (value > p + 1e-6) setFlash("up");
    else if (value < p - 1e-6) setFlash("down");
    else return;
    const t = window.setTimeout(() => setFlash(""), 300);
    return () => window.clearTimeout(t);
  }, [value]);

  return (
    <span className={`num tabular-nums ${flash === "up" ? "flash-up" : flash === "down" ? "flash-down" : ""} ${className}`}>
      {value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}
