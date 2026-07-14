"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Flag } from "./Flag";
import { Avatar } from "./Avatar";
import { routes } from "../../lib/routes";
import { fmtPrice, signedCR } from "../../lib/format";
import { rarityOf, swingOf, RARITY_STYLE, type Moment } from "../../lib/moments";

const W = 640;
const H = 220;
const PAD = 14;

/** Moment of the Day — the day's biggest swing, large, with a River that draws itself on mount
 *  (the one delight beat on /moments). Inline SVG + Framer Motion path-draw; reduced-motion → static.
 *  Tokens only; the green/pink stroke is the swing's price direction (semantic-colour law). */
export function MomentHero({ m }: { m: Moment }) {
  const reduce = useReducedMotion();
  const rarity = rarityOf(m);
  const swing = swingOf(m);
  const up = swing >= 0;

  const vals = m.segment;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const x = (i: number) => (i / (vals.length - 1)) * W;
  const y = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2);
  const line = vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const stroke = up ? "var(--up)" : "var(--down)";

  return (
    <Link
      href={routes.moment(m.id)}
      aria-label={`Moment of the day — ${m.title}, ${rarity}, ${m.pick} ${fmtPrice(m.fromPrice)} to ${fmtPrice(m.toPrice)}`}
      className="group elev block overflow-hidden rounded-card border border-hairline bg-surface outline-none transition-colors duration-200 hover:border-hairline/80 focus-visible:ring-2 focus-visible:ring-up/40"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_1.4fr]">
        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-chip bg-bg px-2 py-0.5 text-label font-semibold uppercase tracking-label text-lo ring-1 ring-inset ring-hairline">
                Moment of the day
              </span>
              <span className={`rounded-chip px-2 py-0.5 text-label font-semibold uppercase tracking-micro ring-1 ring-inset ${RARITY_STYLE[rarity]}`}>
                {rarity}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Flag code={m.homeCode} size={30} />
              <Flag code={m.awayCode} size={30} />
              <span className="num text-caption tabular-nums text-lo">
                {m.homeCode} v {m.awayCode} · {m.minute}&#39;
              </span>
            </div>
            <h2 className="mt-2 font-display text-display font-bold leading-tight tracking-tight text-hi">{m.title}</h2>
            <p className="num mt-2 text-body tabular-nums text-lo">
              {m.pick} {fmtPrice(m.fromPrice)} → <span className="text-hi">{fmtPrice(m.toPrice)}</span>
              <span className={`ml-2 font-semibold ${up ? "text-up" : "text-down"}`}>{signedCR(swing)}</span>
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex min-w-0 items-center gap-2">
              <Avatar handle={m.owner} size={22} />
              <span className="truncate text-caption text-lo">{m.owner}</span>
            </span>
            {m.mintSig ? (
              <span className="inline-flex items-center gap-1.5 text-label font-medium text-chain" title="Minted on Solana devnet">
                <span className="h-1.5 w-1.5 rounded-full bg-chain" />
                Minted on Solana
              </span>
            ) : (
              <span className="text-label font-medium uppercase tracking-wide text-lo">mintless</span>
            )}
          </div>
        </div>

        <div className="relative min-h-[200px] border-t border-hairline lg:border-l lg:border-t-0">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full" aria-hidden>
            <path d={area} fill={stroke} fillOpacity="0.08" />
            <motion.path
              d={line}
              fill="none"
              stroke={stroke}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={reduce ? undefined : { pathLength: 1 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
