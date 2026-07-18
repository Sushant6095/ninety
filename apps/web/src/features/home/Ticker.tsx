"use client";
// The top ticker — a BROADCAST STRAP on real football-data.org fixtures (ADR-080), not a mono terminal dump.
// Grouped day segments: yesterday's results · anything live now · tomorrow's fixtures. Each match is a chip with
// kickoff/minute, both team names (UI sans, semibold — NOT mono), both baked flags, and score when relevant.
// Two-source law (ADR-051): the LIVE segment's minute/score/price come ONLY from the replay/fixture store
// (useMatchLive, TxLINE-owned) — never football-data. Schedule + FINAL results are football-data's (still).
// Only NUMBERS are mono+tabular (kickoff, minute, score, price). Marquee only when the row overflows; otherwise
// centered. prefers-reduced-motion → static scrollable strip. Loading → skeleton chips; empty → honest, never faked.
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { routes } from "../../lib/routes";
import { Flag } from "../../components/ui/Flag";
import { hasFlag } from "../../lib/flags";
import { marketByMatchId } from "../../lib/fixtures";
import { LivePrice } from "../../components/ui/LivePrice";
import { Marquee } from "../../components/vendor/magicui/marquee";
import { useMatchLive } from "../live/matchLiveStore";
import { USE_FIXTURES } from "../../lib/api";
import { broadcastGroups, broadcastGroupsLive } from "../../lib/broadcastData";
import type { BroadcastChip, BroadcastGroup, ChipKind } from "../../lib/broadcastFixtures";

const OUTCOMES = ["H", "D", "A"] as const;

function FlagOrCode({ code }: { code: string }) {
  if (hasFlag(code)) return <Flag code={code} size={18} />;
  return (
    <span className="num inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-hairline/60 text-label font-semibold text-lo">
      {code.slice(0, 2)}
    </span>
  );
}

function Chip({ chip }: { chip: BroadcastChip }) {
  const live = useMatchLive(chip.matchId);
  const isLive = chip.kind === "live";
  // Live numbers are TxLINE/replay-owned (ADR-051) — read ONLY from the store, never from football-data.
  const minute = isLive ? live?.minute ?? null : null;
  const halted = isLive && live?.status === "HALTED";
  const liveScore = isLive ? live?.score ?? null : null;
  const prices = isLive ? live?.prices ?? null : null;
  const lead = prices ? OUTCOMES.reduce((a, b) => (prices[b] > prices[a] ? b : a)) : null;

  const badge =
    chip.kind === "result" ? (
      <span className="num text-label font-semibold text-lo">FT</span>
    ) : isLive ? (
      minute != null ? (
        <span className={`num text-label font-semibold ${halted ? "text-halt" : "text-up"}`}>{minute}&#39;</span>
      ) : (
        <span className="text-label font-semibold uppercase tracking-caps text-up">Live</span>
      )
    ) : (
      <span className="num text-label text-lo">{chip.kickoff}</span>
    );

  const scoreText =
    chip.kind === "result" && chip.homeScore != null
      ? `${chip.homeScore}–${chip.awayScore}`
      : liveScore
        ? `${liveScore.home}–${liveScore.away}`
        : null;

  const mid = scoreText ? (
    <span className="num text-strong font-semibold text-hi">{scoreText}</span>
  ) : (
    <span className="text-label text-lo">v</span>
  );

  const inner = (
    <>
      {badge}
      <span className="flex items-center gap-1.5">
        <FlagOrCode code={chip.homeCode} />
        <span className="text-strong font-semibold text-hi">{chip.homeName}</span>
      </span>
      {mid}
      <span className="flex items-center gap-1.5">
        <span className="text-strong font-semibold text-hi">{chip.awayName}</span>
        <FlagOrCode code={chip.awayCode} />
      </span>
      {chip.stage && <span className="text-label uppercase tracking-caps text-lo">{chip.stage}</span>}
      {isLive && prices && lead && (
        <span className="flex items-center gap-1">
          <span className="num text-label text-lo">{lead}</span>
          <LivePrice value={prices[lead] * 100} className="num text-label font-semibold text-hi" />
        </span>
      )}
    </>
  );

  const aria = `${chip.homeName} ${scoreText ? scoreText.replace("–", " ") : "versus"} ${chip.awayName}${chip.stage ? `, ${chip.stage}` : ""}${isLive && minute != null ? `, live ${minute} minutes` : chip.kind === "upcoming" ? `, kick-off ${chip.kickoff}` : ""}`;
  // Thin strap by design; coarse pointers get a 44px touch target (min-h-11) without thickening the desktop bar.
  const base =
    "flex shrink-0 items-center gap-2.5 rounded-chip border border-hairline bg-surface px-3.5 py-1.5 transition-colors duration-200 pointer-coarse:min-h-11";

  // Link only when a real board market exists — never a dead /match link (Verification law).
  if (marketByMatchId(chip.matchId)) {
    return (
      <Link
        href={routes.match(chip.matchId)}
        aria-label={aria}
        className={`${base} hover:border-up/30 hover:bg-surface/70 active:bg-surface/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up/50`}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div aria-label={aria} className={base}>
      {inner}
    </div>
  );
}

function GroupLabel({ label, kind }: { label: string; kind: ChipKind }) {
  const live = kind === "live";
  return (
    <span className="flex shrink-0 items-center gap-1.5 pl-1.5 text-label font-semibold uppercase tracking-caps">
      {live && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_5px_var(--up)]" />}
      <span className={live ? "text-up" : "text-lo"}>{label}</span>
    </span>
  );
}

function Skeleton() {
  return (
    <div className="flex items-center justify-center gap-2.5 px-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-7 w-44 shrink-0 animate-pulse rounded-chip border border-hairline bg-surface motion-reduce:animate-none" />
      ))}
    </div>
  );
}

export function Ticker() {
  const reduce = useReducedMotion();
  const [groups, setGroups] = useState<BroadcastGroup[] | null>(null);
  const [overflow, setOverflow] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // Client-only load (avoids a Date.now() hydration mismatch on the day labels; SSR shows the skeleton).
  useEffect(() => {
    let alive = true;
    const now = Date.now();
    (async () => {
      if (USE_FIXTURES) {
        if (alive) setGroups(broadcastGroups(now));
        return;
      }
      try {
        const g = await broadcastGroupsLive(now);
        if (alive) setGroups(g.length ? g : broadcastGroups(now));
      } catch {
        if (alive) setGroups(broadcastGroups(now)); // honest fallback: the baked real snapshot, never fabricated
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Marquee ONLY when the content overflows its track — otherwise the strip is centered (looks intentional at 2
  // chips). A hidden measuring row keeps the natural width known in both static and marquee modes.
  useLayoutEffect(() => {
    if (!groups) return;
    const measure = () => {
      const m = measureRef.current;
      const w = wrapRef.current;
      if (m && w) setOverflow(m.scrollWidth > w.clientWidth + 4);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [groups]);

  const content = groups?.flatMap((g, gi) => [
    <GroupLabel key={`grp-${gi}`} label={g.label} kind={g.kind} />,
    ...g.chips.map((c) => <Chip key={c.id} chip={c} />),
  ]);
  const hasLive = !!groups?.some((g) => g.kind === "live");

  return (
    <aside aria-label="World Cup fixtures, results and live matches" className="border-b border-hairline bg-bg">
      <div className="flex items-stretch">
        <div className="flex shrink-0 items-center gap-1.5 border-r border-hairline px-3.5 py-2.5 text-label font-semibold uppercase tracking-caps text-lo">
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${hasLive ? "bg-up shadow-[0_0_5px_var(--up)]" : "bg-hairline"}`} />
          WC26
        </div>

        <div ref={wrapRef} className="relative min-w-0 flex-1 overflow-hidden">
          {/* hidden measuring row — natural width, present in every mode */}
          <div ref={measureRef} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 flex items-center gap-2.5 px-3 py-2">
            {content}
          </div>

          {groups === null ? (
            <Skeleton />
          ) : groups.length === 0 ? (
            <div className="flex items-center px-4 py-2.5 text-label text-lo">No fixtures in this window.</div>
          ) : reduce || !overflow ? (
            <div
              className={`flex items-center gap-2.5 py-2 ${overflow ? "overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "justify-center px-3"}`}
            >
              {content}
            </div>
          ) : (
            <Marquee pauseOnHover className="py-2 [--marquee-duration:42s] [--marquee-gap:0.625rem]">
              {content}
            </Marquee>
          )}
        </div>
      </div>
    </aside>
  );
}
