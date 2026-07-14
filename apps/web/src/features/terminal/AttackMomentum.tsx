"use client";
import { useMatchLive, TERMINAL_MATCH_ID } from "../live/matchLiveStore";
import { ATTACK } from "../../lib/terminal";

// Signed attack pressure over the last ~30 windows: positive = away/Egypt (bright ink), negative = home (muted ink).
// Green/pink are reserved for price direction only (semantic-color law); the two teams read by ink brightness + sign.
// Inline SVG — NOT a chart lib. The hero Momentum River (lightweight-charts) is the only real chart (ADR-045).
const BARS = ATTACK.bars;
const VW = 300;
const VH = 90;
const GAP = 2;
const MAX = Math.max(1, ...BARS.map((v) => Math.abs(v)));

export function AttackMomentum() {
  // The status word reads from the ONE store — a panel that says LIVE over a halted market is a lie.
  const live = useMatchLive(TERMINAL_MATCH_ID);
  const status = live?.status ?? "LIVE";
  const halted = status === "HALTED";
  const n = BARS.length;
  const barW = (VW - GAP * (n - 1)) / n;
  const mid = VH / 2;
  return (
    <section className="elev rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h2 className="text-label font-semibold uppercase tracking-label text-lo">Attack momentum</h2>
        <span className="num flex items-center gap-1 text-label tabular-nums text-lo">
          AUS <span aria-hidden className="text-lo">■</span> EGY <span aria-hidden className="text-hi">■</span>
          <span className="text-hairline">·</span>
          <span className={halted ? "text-halt" : "text-up"}>{status}</span>
        </span>
      </div>

      <div className="px-4">
        <div className="h-[90px] w-full">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${VW} ${VH}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            {BARS.map((v, i) => {
              const h = Math.max(0.5, (Math.abs(v) / MAX) * (mid - 2));
              const x = i * (barW + GAP);
              const y = v >= 0 ? mid - h : mid;
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={1}
                  fill={v >= 0 ? "var(--text-hi)" : "var(--text-lo)"}
                />
              );
            })}
          </svg>
        </div>

        <div className="flex items-center justify-between pb-3 pt-1">
          <span className="text-label font-semibold uppercase tracking-tag text-hi">
            <span aria-hidden>▶</span> {ATTACK.attacking} attacking
          </span>
          <span className="num text-label uppercase tracking-tag text-lo">Ball in play {live?.minute ?? 0}&#39;</span>
        </div>
      </div>
    </section>
  );
}
