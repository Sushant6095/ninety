"use client";
import { useState } from "react";
import { RadioGroup } from "radix-ui";
import { MATCH } from "../../../lib/terminal";

// 21st.dev pull: ruixen.ui "Review Filter Bars" (row = option | proportional bar | count, radix
// RadioGroup semantics), re-skinned to tokens as Sofascore's who-wins vote
// (docs/sofascore-research/components/vote-and-poll.md): stars → outcome codes, accent bar → hi ink.
// Your call is local state; the counts are seed noise on purpose — the poll is sentiment, the price
// is the market, and the footer line says exactly that.
const SEED = [
  { value: "H", label: MATCH.homeCode, votes: 5214 },
  { value: "D", label: "DRAW", votes: 1698 },
  { value: "A", label: MATCH.awayCode, votes: 5935 },
] as const;

export function CrowdCall() {
  const [pick, setPick] = useState<string>("");
  const total = SEED.reduce((s, o) => s + o.votes, 0) + (pick ? 1 : 0);
  return (
    <div className="mt-4 rounded-card border border-hairline bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-label font-semibold uppercase tracking-label text-lo">Crowd call — who wins?</h3>
        <span className="num text-label tabular-nums text-lo">{total.toLocaleString("en-US")} calls</span>
      </div>
      <RadioGroup.Root value={pick} onValueChange={setPick} aria-label="Who wins?" className="mt-3 flex flex-col gap-2">
        {SEED.map((o) => {
          const votes = o.votes + (pick === o.value ? 1 : 0);
          const pct = Math.round((votes / total) * 100);
          const active = pick === o.value;
          return (
            <RadioGroup.Item
              key={o.value}
              value={o.value}
              className={`flex min-h-11 items-center gap-3 rounded-md p-2 ring-1 ring-inset outline-none transition-colors duration-200 hover:bg-hairline/25 focus-visible:ring-up active:bg-hairline/40 ${
                active ? "bg-hairline/30 ring-up/50" : "ring-hairline"
              }`}
            >
              <span className={`num w-12 shrink-0 text-left text-label font-semibold ${active ? "text-hi" : "text-lo"}`}>{o.label}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-hairline/40">
                <span className="block h-full rounded-full bg-hi/50" style={{ width: `${pct}%` }} />
              </span>
              <span className="num w-10 shrink-0 text-right text-label tabular-nums text-lo">{pct}%</span>
            </RadioGroup.Item>
          );
        })}
      </RadioGroup.Root>
      <p className="mt-2 text-label text-lo">The crowd is a poll. The price is the market.</p>
    </div>
  );
}
