"use client";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { TeamCrest } from "./TeamCrest";
import { Avatar } from "./Avatar";
import { MARKETS, LEADERS } from "../../lib/fixtures";
import { routes, NAV } from "../../lib/routes";
import { useMatchLive } from "../../features/live/matchLiveStore";
import type { MarketRow } from "../../lib/types";

/** ⌘K match result — identity from the seed row, live minute from the ONE store. */
function MatchCommandItem({ market, onSelect }: { market: MarketRow; onSelect: () => void }) {
  const live = useMatchLive(market.matchId);
  const minute = live?.minute ?? market.minute;
  const halted = live?.status === "HALTED";
  return (
    <Command.Item
      value={`${market.home} ${market.away} ${market.homeCode} ${market.awayCode}`}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-body text-hi data-[selected=true]:bg-hairline/60"
    >
      <TeamCrest code={market.homeCode} size={18} />
      <TeamCrest code={market.awayCode} size={18} />
      <span className="truncate">{market.home} <span className="text-lo">v</span> {market.away}</span>
      {minute != null && <span className={`num ml-auto text-label font-semibold ${halted ? "text-halt" : "text-up"}`}>{minute}&#39;</span>}
    </Command.Item>
  );
}

/** ⌘K command palette — cmdk re-skinned to Ninety tokens. Searches matches, traders, and pages; navigates on
 *  select. cmdk owns the fuzzy filter + keyboard nav; we own the skin (surface card, hairlines, no glass/blur). */
export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const go = (href: string) => { onOpenChange(false); router.push(href); };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Search matches, traders, and pages"
      shouldFilter
      overlayClassName="fixed inset-0 z-50 bg-bg/80"
      contentClassName="fixed left-1/2 top-[18%] z-50 w-[92vw] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-card border border-hairline bg-surface elev-hi"
      className="text-hi"
    >
      <div className="flex items-center gap-2 border-b border-hairline px-4">
        <Search size={16} strokeWidth={2} className="shrink-0 text-lo" aria-hidden />
        <Command.Input placeholder="Search matches, traders, pages…" className="h-12 w-full bg-transparent text-body text-hi placeholder:text-lo outline-none" />
        <kbd className="num rounded bg-bg px-1 py-0.5 text-label text-lo ring-1 ring-inset ring-hairline">esc</kbd>
      </div>

      <Command.List className="max-h-[54vh] overflow-y-auto p-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-label [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-tag [&_[cmdk-group-heading]]:text-lo">
        <Command.Empty className="px-3 py-8 text-center text-body text-lo">No results.</Command.Empty>

        <Command.Group heading="Matches">
          {MARKETS.map((m) => (
            <MatchCommandItem key={m.matchId} market={m} onSelect={() => go(routes.match(m.matchId))} />
          ))}
        </Command.Group>

        <Command.Group heading="Traders">
          {LEADERS.slice(0, 8).map((l) => (
            <Command.Item
              key={l.handle}
              value={l.handle}
              onSelect={() => go(routes.profile(l.handle))}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-body text-hi data-[selected=true]:bg-hairline/60"
            >
              <Avatar handle={l.handle} size={20} />
              <span className="truncate">{l.handle}</span>
              <span className={`num ml-auto text-caption tabular-nums ${l.pnl >= 0 ? "text-up" : "text-down"}`}>{l.pnl >= 0 ? "+" : "−"}{Math.abs(l.pnl).toLocaleString("en-US")}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Pages">
          {NAV.map((n) => (
            <Command.Item key={n.href} value={n.label} onSelect={() => go(n.href)} className="cursor-pointer rounded-md px-3 py-2 text-body text-hi data-[selected=true]:bg-hairline/60">
              {n.label}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
