"use client";
import { useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { gsap, useGSAP } from "../../lib/gsap";
import { motion as m } from "../../design/motion";
import { quote } from "../../lib/lmsr";
import { fmtCR } from "../../lib/format";
import type { Outcome } from "../../lib/types";

const IDX: Record<Outcome, number> = { H: 0, D: 1, A: 2 };
const NAME: Record<Outcome, string> = { H: "Home", D: "Draw", A: "Away" };
const MIN = 10, MAX = 500, STEP = 10;
const PRESETS = [10, 20, 50] as const;

export interface PlaceResult {
  ok: boolean;
  error?: string;
  avgPx?: number;
}

interface TradePanelProps {
  amm: { q: number[]; b: number; spreadMult: number };
  selected: Outcome;
  code: string; // outcome's team code, e.g. "EGY"
  markPx: number; // live spot price of the selected outcome (0..100)
  free: number; // uncommitted credits · buying power
  heldShares: number; // shares held of the selected outcome · sell ceiling
  onPlace: (side: "buy" | "sell", size: number) => PlaceResult; // server-verified analog; applies optimistically
  disabled?: boolean; // market halted / pre-match · controls lock, greyed + inert (the felt-freeze during the halt)
  disabledReason?: string; // the CTA copy while disabled · "Trading paused" (halt) or "Trading opens at kickoff" (pre)
}

/** Buy/Sell + size (slider + quick amounts) → live LMSR quote → confirm. On confirm the parent applies the fill
 *  optimistically (or rejects · insufficient credits / oversell · via toast). Client previews; the store verifies.
 *  `disabled` (halt) makes the whole panel inert + greyed so the user FEELS trading was taken away, then restored. */
export function TradePanel({ amm, selected, code, markPx, free, heldShares, onPlace, disabled = false, disabledReason = "Trading paused" }: TradePanelProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [size, setSize] = useState(20);
  // A confirmed fill (or null). Carries what the choreography needs so the inline line + toast agree.
  const [fill, setFill] = useState<{ size: number; code: string; avgPx: number } | null>(null);
  const reduce = useReducedMotion();

  const q = quote(amm.q, amm.b, IDX[selected], size, side, amm.spreadMult);
  const label = selected === "D" ? "Draw" : `${NAME[selected]} · ${code}`;

  // Largest step-aligned buy the free balance can afford (the "Max" quick amount for a buy).
  const maxBuy = useMemo(() => {
    for (let s = MAX; s >= STEP; s -= STEP) if (quote(amm.q, amm.b, IDX[selected], s, "buy", amm.spreadMult).cost <= free) return s;
    return 0;
  }, [amm, selected, free]);
  const maxSize = side === "buy" ? maxBuy : heldShares;

  const setSz = (n: number) => { setSize(Math.max(0, Math.min(MAX, n))); setFill(null); };
  const flip = (s: "buy" | "sell") => { setSide(s); setFill(null); };
  const submit = () => {
    const r = onPlace(side, size); // parent applies the fill (or toasts a reject · those stay in placeOrder)
    setFill(r.ok ? { size, code, avgPx: r.avgPx ?? markPx } : null);
  };

  // submit → fill confirmation → credits count to the new balance → toast, as ONE one-shot GSAP timeline
  // (ADR-061). Off the price tape and only on a confirmed fill, so it is wall-safe; transform/opacity + a
  // textContent roll only; reduced motion drops the travel, sets the balance instantly and fires the toast
  // immediately. The press dip itself stays CSS active:scale (ADR-058 · untouched).
  const scope = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLParagraphElement>(null);
  const balanceRef = useRef<HTMLSpanElement>(null); // the free-credits number that counts on a fill
  const lastFreeRef = useRef(free); // the last committed balance · the count-up's start value
  useGSAP(
    () => {
      const el = fillRef.current;
      if (!fill || !el) return;
      const rm = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const reveal = rm ? 0.001 : m.fast / 1000;
      const tl = gsap
        .timeline()
        .fromTo(el, { autoAlpha: 0, y: rm ? 0 : 6 }, { autoAlpha: 1, y: 0, duration: reveal }, 0)
        .call(() => toast.success(`Filled ${fill.size} ${fill.code} @ ${fill.avgPx.toFixed(1)}`), undefined, reveal);

      // Credits roll old → new balance (down on a buy, up on a sell). React keeps the span at the committed
      // value between fills; GSAP only animates the transient roll on the fill frame.
      const bal = balanceRef.current;
      const from = lastFreeRef.current;
      lastFreeRef.current = free;
      if (bal && from !== free) {
        if (rm) bal.textContent = fmtCR(free);
        else {
          const proxy = { v: from };
          tl.to(proxy, { v: free, duration: m.slow / 1000, onUpdate: () => { bal.textContent = fmtCR(proxy.v); } }, 0);
        }
      }
    },
    { scope, dependencies: [fill], revertOnUpdate: true },
  );

  return (
    <div ref={scope} aria-disabled={disabled} className={`border-b border-hairline px-4 py-3 ${disabled ? "pointer-events-none select-none opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg bg-bg p-0.5 ring-1 ring-inset ring-hairline">
          {(["buy", "sell"] as const).map((s) => {
            const on = side === s;
            return (
              <button
                key={s}
                onClick={() => flip(s)}
                aria-pressed={on}
                className={`num relative rounded-md px-4 py-2 text-body font-semibold capitalize outline-none transition-[color,transform] duration-200 ease-out active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-bg ${
                  on ? `text-bg ${s === "buy" ? "focus-visible:ring-up" : "focus-visible:ring-down"}` : "text-lo hover:text-hi focus-visible:ring-hairline"
                }`}
              >
                {on && <motion.span layoutId="tradeSideActive" className={`absolute inset-0 rounded-md ${s === "buy" ? "bg-up" : "bg-down"}`} transition={reduce ? { duration: 0 } : m.spring} />}
                <span className="relative z-10">{s}</span>
              </button>
            );
          })}
        </div>

        <div className="flex min-w-[180px] flex-1 items-center gap-3">
          <input
            type="range" min={MIN} max={MAX} step={STEP} value={size} disabled={disabled}
            onChange={(e) => setSz(Number(e.target.value))}
            aria-label="Order size in shares"
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-hairline accent-up"
          />
          <div className="shrink-0 text-right">
            <div className="num text-strong font-bold text-hi">{size}</div>
            <div className="text-label uppercase tracking-wide text-lo">size</div>
          </div>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setSz(p)}
            className={`hit num cursor-pointer rounded-chip px-3 py-1 text-caption font-medium ring-1 ring-inset outline-none transition-[color,background-color,transform] duration-200 focus-visible:ring-up active:scale-[0.97] ${size === p ? "bg-hairline/60 text-hi ring-hairline" : "bg-bg/50 text-lo ring-hairline/60 hover:text-hi"}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => setSz(maxSize)}
          disabled={maxSize < MIN}
          className="hit num cursor-pointer rounded-chip bg-bg/50 px-3 py-1 text-caption font-medium text-lo ring-1 ring-inset ring-hairline/60 outline-none transition-[color,background-color,transform] duration-200 hover:text-hi focus-visible:ring-up active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Max
        </button>
        <span className="num ml-auto text-label tabular-nums text-lo">
          {side === "buy" ? (
            <>
              <span ref={balanceRef}>{fmtCR(free)}</span> cr free
            </>
          ) : (
            `${heldShares} ${code} held`
          )}
        </span>
      </div>

      {/* Metrics ABOVE, action button full-width BELOW (Hyperliquid/Polymarket pattern). They used to share
          one `flex items-end` row with a shrink-0 button; at lg's narrow trade column the long button label
          ("Buy Away · EGY @ 55.9") ate the row and the flex-1 metrics dl collapsed to 0px · Cost/Avg/Max
          overlapped into an unreadable cramp. Stacking gives the three columns real width at every breakpoint
          and reads as a stronger, clearer CTA. */}
      <dl className="mt-3 grid grid-cols-3 gap-2">
        <div><dt className="text-label uppercase tracking-wide text-lo">Cost</dt><dd className="num text-strong font-semibold text-hi">{fmtCR(q.cost)} <span className="text-label text-lo">cr</span></dd></div>
        <div><dt className="text-label uppercase tracking-wide text-lo">Avg px</dt><dd className="num text-strong font-semibold text-hi">{q.avgPx.toFixed(1)}</dd></div>
        <div><dt className="text-label uppercase tracking-wide text-lo">Max payout</dt><dd className="num text-strong font-semibold text-hi">{fmtCR(q.maxPayout)} <span className="text-label text-lo">cr</span></dd></div>
      </dl>

      <button
        onClick={submit}
        disabled={disabled}
        className={`mt-3 min-h-11 w-full rounded-lg px-5 text-strong font-semibold text-bg transition-[filter,transform] duration-200 ease-out hover:brightness-110 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed ${side === "buy" ? "bg-up focus-visible:ring-up" : "bg-down focus-visible:ring-down"}`}
      >
        {disabled ? disabledReason : `${side === "buy" ? "Buy" : "Sell"} ${label} @ ${markPx.toFixed(1)}`}
      </button>

      {fill && (
        <p ref={fillRef} className="num mt-2 flex items-center gap-1 text-label text-up" role="status">
          <span aria-hidden>✓</span>
          Filled {fill.size} {fill.code} @ {fill.avgPx.toFixed(1)} · position updated (optimistic; reconciles on the fill frame).
        </p>
      )}
    </div>
  );
}
