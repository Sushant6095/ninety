# 001 — Retrigger the live price flash on every tick

- **Status**: TODO
- **Commit**: 4c0975f
- **Severity**: HIGH
- **Category**: Interruptibility / Purpose & frequency
- **Estimated scope**: 1 file (`apps/web/src/components/ui/LivePrice.tsx`), ~15 lines

## Problem

The 180ms price flash is the app's signature, highest-frequency feedback (fires on every price change across the live tape), and it silently drops feedback on rapid same-direction ticks. `setFlash("up")` when state is already `"up"` is a React no-op, so the className never changes and the CSS keyframe animation never restarts — two up-ticks inside 300ms render ONE pulse, then the tape goes silent during exactly the rallies where feedback matters most.

```tsx
/* apps/web/src/components/ui/LivePrice.tsx:9-17 — current */
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
```

Secondary defect: the clear timeout is 300ms but the animation is 180ms (`styles/globals.css:52-53`, matching `motion.flash: 180`) — a baked-in 120ms dead window per tick.

## Target

Every price change restarts the 180ms pulse deterministically. Key the flashing span by a tick counter so React remounts it per change (a remounted element always restarts its CSS animation), and drop the timeout entirely — the keyframe is one-shot and ends on its own.

```tsx
/* target — full component body */
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
```

Notes for the executor: the `key` bump is the whole mechanism — do not re-add a timeout, and do not clear `dir` (the class is inert once its one-shot animation has completed; a stale class on a keyed-fresh element restarts correctly because the element itself is new).

## Repo conventions to follow

- The flash classes and duration already exist and are correct: `apps/web/src/styles/globals.css:50-53` (`.flash-up { animation: flashUp 180ms ease-out; }`). Do not change them.
- Motion timing tokens live in `apps/web/src/design/motion.ts` (`flash: 180`). This plan removes the only place a mismatched literal (300) shadowed it.

## Steps

1. Edit `apps/web/src/components/ui/LivePrice.tsx`: replace the `flash` state + timeout effect with the tick-counter shape shown in Target. Keep the component name, props, and the outer `num tabular-nums` classes identical.
2. Remove the now-unused `window.setTimeout`/`clearTimeout` logic.

## Boundaries

- Do NOT touch `styles/globals.css`, `design/motion.ts`, or any LivePrice consumer.
- Do NOT introduce framer-motion here — the CSS keyframe is deliberately the cheap tool for the hot tape.
- If `LivePrice.tsx` no longer matches the "current" excerpt, STOP and report.

## Verification

- **Mechanical**: `cd apps/web && npx tsc --noEmit` → exit 0.
- **Feel check**: open `/terminal` (dev server on :3000), watch a live price cell during drift. In DevTools console, fire rapid same-direction updates by watching a rally: every tick must tint the number green for a beat — no silent updates. In the Animations panel at 10% speed, confirm each change starts a fresh 180ms `flashUp` run.
- **Done when**: three value changes in quick succession produce three visible pulses (previously: one).
