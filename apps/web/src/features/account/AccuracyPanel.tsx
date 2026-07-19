"use client";
// Forecast accuracy · the track-record panel. Hit-rate / trades / best call from the profile aggregates;
// the Next-Goal streak is LIVE from the games round log (useSyncExternalStore, read-only · ADR-060).
import Link from "next/link";
import { useRoundLog } from "../games/roundLog";
import { resolveProfile } from "../../lib/profile";
import { routes } from "../../lib/routes";
import { fmtCR, signedCR } from "../../lib/format";

function Row({ label, value, tone = "hi" }: { label: string; value: string; tone?: "hi" | "up" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-3">
      <span className="text-caption text-lo">{label}</span>
      <span className={`num text-strong font-semibold tabular-nums ${tone === "up" ? "text-up" : "text-hi"}`}>{value}</span>
    </div>
  );
}

// active = the session has real trading activity. A fresh trader has none, so the profile-derived hit rate /
// best call / streak stay honestly empty (never fabricated) — but the Next-Goal streak below is real play, kept.
export function AccuracyBody({ handle, active }: { handle: string; active: boolean }) {
  const profile = resolveProfile(handle);
  const rounds = useRoundLog();
  // Current Next-Goal streak: consecutive correct calls from the newest round back.
  let streak = 0;
  for (const r of rounds) {
    if (r.outcome !== "correct") break;
    streak += 1;
  }
  const hitPct = Math.round(profile.winRate * 100);

  return (
    <div className="divide-y divide-hairline/60">
      {active ? (
        <>
          <div className="px-4 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-label font-medium uppercase tracking-tag text-lo">Hit rate</span>
              <span className="num text-caption tabular-nums text-lo">{profile.trades} trades</span>
            </div>
            <div className="num mt-1 font-display text-display font-bold tabular-nums text-hi">{hitPct}%</div>
            {/* the read-at-a-glance bar · width is data, not decoration */}
            <div className="mt-2 h-1.5 overflow-hidden rounded-chip bg-bg ring-1 ring-inset ring-hairline" role="img" aria-label={`${hitPct} percent of calls correct`}>
              <div className="h-full rounded-chip bg-up" style={{ width: `${hitPct}%` }} />
            </div>
          </div>
          <Row label="Best call" value={signedCR(profile.bestSwing)} tone="up" />
          <Row label="Trade streak" value={profile.streak >= 0 ? `${profile.streak} wins` : `${Math.abs(profile.streak)} losses`} />
        </>
      ) : (
        <div className="px-4 py-4">
          <span className="text-label font-medium uppercase tracking-tag text-lo">Hit rate</span>
          <p className="mt-1 text-body text-lo">No settled trades yet · your forecast accuracy builds as you trade.</p>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
        <span className="text-caption text-lo">Next-Goal streak</span>
        {rounds.length === 0 ? (
          <Link
            href={routes.play}
            className="rounded-chip px-2 py-1 text-caption font-medium text-up outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:ring-1 focus-visible:ring-up/40 active:scale-[0.97]"
          >
            Play Next Goal →
          </Link>
        ) : (
          <span className="num text-strong font-semibold tabular-nums text-hi">
            {fmtCR(streak)} <span className="text-caption font-normal text-lo">correct</span>
          </span>
        )}
      </div>
    </div>
  );
}
