"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, ChevronRight, Trophy, MapPin, X, Clock } from "lucide-react";
import { TeamCrest } from "./TeamCrest";
import { MARKETS } from "../../lib/fixtures";
import type { MarketRow } from "../../lib/types";
import { routes, NAV } from "../../lib/routes";
import { useMatchLive } from "../../features/live/matchLiveStore";
import { USE_FIXTURES } from "../../lib/api";
import { searchLive, type SearchResults } from "../../lib/data/search";
import type { Entity, EntityKind } from "../../lib/data/entitySearch";

// The category tabs. Order mirrors the spec: Team · Player · Match · Competition · Manager · Venue.
// `kinds` selects which baked entity kinds a tab shows; "match" is special (API/fixtures, not the entity index).
type TabKey = "all" | "team" | "player" | "match" | "competition" | "manager" | "venue";
const TABS: { key: TabKey; label: string; kinds: EntityKind[] | null }[] = [
  { key: "all", label: "All", kinds: null },
  { key: "team", label: "Teams", kinds: ["team"] },
  { key: "player", label: "Players", kinds: ["player"] },
  { key: "match", label: "Matches", kinds: [] },
  { key: "competition", label: "Competition", kinds: ["competition"] },
  { key: "manager", label: "Managers", kinds: ["manager"] },
  { key: "venue", label: "Venues", kinds: ["venue"] },
];
// Order the entity groups render in under the "All" tab.
const ALL_ORDER: EntityKind[] = ["team", "player", "competition", "manager", "venue"];
const GROUP_LABEL: Record<EntityKind, string> = { team: "Teams", player: "Players", competition: "Competition", manager: "Managers", venue: "Venues" };
const PER_GROUP = 5; // cap per entity group in the All tab
const RECENTS_KEY = "ninety.search.recents.v1";

/** A ⌘K match row — the fields we render; live minute/status come from the store, kickoff/stage from the source. */
interface CommandMatch {
  matchId: string;
  home: string;
  away: string;
  homeCode: string;
  awayCode: string;
  minute?: number | null;
  stage?: string;
  competition?: string;
  kickoffAt?: string;
}
interface RecentRow { key: string; kind: string; label: string; meta: string; href: string; teamCode?: string; awayCode?: string; photo?: string | null }

function clock(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function marketToMatch(m: MarketRow): CommandMatch {
  return { matchId: m.matchId, home: m.home, away: m.away, homeCode: m.homeCode, awayCode: m.awayCode, minute: m.minute, stage: m.stage, competition: m.competition, kickoffAt: m.kickoffAt };
}
function matchMeta(m: CommandMatch): string {
  return [m.stage, m.competition].filter((s) => s && !/^favourite/i.test(s)).join(" · ") || "World Cup 2026";
}

/** Recent history in localStorage (display-only, navigable rows only). Ref-mirrored so handlers never go stale. */
function useRecents() {
  const [recents, setRecents] = useState<RecentRow[]>([]);
  const ref = useRef<RecentRow[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (raw) { const p = JSON.parse(raw) as RecentRow[]; ref.current = p; setRecents(p); }
    } catch { /* ignore a corrupt/absent store */ }
  }, []);
  const commit = (next: RecentRow[]) => {
    ref.current = next; setRecents(next);
    try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch { /* private mode / quota — non-fatal */ }
  };
  return {
    recents,
    add: (r: RecentRow) => commit([r, ...ref.current.filter((x) => x.key !== r.key)].slice(0, 8)),
    remove: (key: string) => commit(ref.current.filter((x) => x.key !== key)),
    clear: () => commit([]),
  };
}

/** 40px circular avatar — baked player face, team crest, or a kind glyph. Never a wrong face (photo only when baked). */
function EntityAvatar({ e }: { e: Pick<Entity, "kind" | "teamCode" | "photo"> }) {
  const disc = "grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-hairline/40 ring-1 ring-inset ring-hairline";
  if (e.photo) return <span className={disc}><Image src={e.photo} alt="" width={40} height={40} className="h-full w-full object-cover" /></span>;
  if (e.kind === "competition") return <span className={disc}><Trophy size={18} className="text-lo" aria-hidden /></span>;
  if (e.kind === "venue") return <span className={disc}><MapPin size={18} className="text-lo" aria-hidden /></span>;
  if (e.teamCode) return <span className={disc}><TeamCrest code={e.teamCode} size={26} /></span>;
  return <span className={disc}><Search size={16} className="text-lo" aria-hidden /></span>;
}

const ROW = "group flex min-h-[3.5rem] items-center gap-3 rounded-lg px-3 py-2 data-[selected=true]:bg-hairline/50";

/** Entity result row (two-line). Navigable rows (href present) carry a chevron + pointer; informational rows
 *  (player/manager/venue — no page yet) show every fact we hold and never route to a 404 (the honesty gate). */
function EntityRow({ e, onOpen }: { e: Entity; onOpen: (e: Entity) => void }) {
  const nav = !!e.href;
  return (
    <Command.Item
      value={`${e.kind}-${e.id}-${e.name}`}
      onSelect={() => nav && onOpen(e)}
      className={`${ROW} ${nav ? "cursor-pointer" : "cursor-default"}`}
    >
      <EntityAvatar e={e} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body font-semibold text-hi">{e.name}</span>
        <span className="truncate text-caption text-lo">{e.meta}</span>
      </span>
      {nav && <ChevronRight size={16} className="shrink-0 text-lo opacity-40 transition-opacity group-data-[selected=true]:opacity-100" aria-hidden />}
    </Command.Item>
  );
}

/** Match row — two overlapped crests, teams, and the live minute (mono) or kickoff time. Always navigable. */
function MatchRow({ m, onOpen }: { m: CommandMatch; onOpen: (m: CommandMatch) => void }) {
  const live = useMatchLive(m.matchId);
  const minute = live?.minute ?? m.minute;
  const halted = live?.status === "HALTED";
  const ko = minute == null ? clock(m.kickoffAt) : null;
  return (
    <Command.Item value={`match-${m.matchId}-${m.home}-${m.away}`} onSelect={() => onOpen(m)} className={`${ROW} cursor-pointer`}>
      <span className="relative h-10 w-10 shrink-0">
        <span className="absolute left-0 top-1/2 -translate-y-1/2"><TeamCrest code={m.homeCode} size={26} /></span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2"><TeamCrest code={m.awayCode} size={26} /></span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body font-semibold text-hi">{m.home} <span className="font-normal text-lo">v</span> {m.away}</span>
        <span className="truncate text-caption text-lo">{matchMeta(m)}</span>
      </span>
      {minute != null && <span className={`num shrink-0 text-label font-semibold tabular-nums ${halted ? "text-halt" : "text-up"}`}>{minute}&#39;</span>}
      {minute == null && ko && <span className="num shrink-0 text-label tabular-nums text-lo">{ko}</span>}
    </Command.Item>
  );
}

/** Recent row — reuses the two-line anatomy, with a × to remove. Navigates on select. */
function RecentRowItem({ r, onOpen, onRemove }: { r: RecentRow; onOpen: (r: RecentRow) => void; onRemove: (key: string) => void }) {
  return (
    <Command.Item value={`recent-${r.key}`} onSelect={() => onOpen(r)} className={`${ROW} cursor-pointer`}>
      {r.awayCode ? (
        <span className="relative h-10 w-10 shrink-0">
          <span className="absolute left-0 top-1/2 -translate-y-1/2"><TeamCrest code={r.teamCode ?? ""} size={26} /></span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2"><TeamCrest code={r.awayCode} size={26} /></span>
        </span>
      ) : (
        <EntityAvatar e={{ kind: r.kind as EntityKind, teamCode: r.teamCode, photo: r.photo }} />
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body font-semibold text-hi">{r.label}</span>
        <span className="truncate text-caption text-lo">{r.meta}</span>
      </span>
      <button
        type="button"
        aria-label={`Remove ${r.label} from recent`}
        onMouseDown={(ev) => { ev.preventDefault(); ev.stopPropagation(); onRemove(r.key); }}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-lo transition-colors hover:bg-hairline/60 hover:text-hi"
      >
        <X size={15} aria-hidden />
      </button>
    </Command.Item>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-1 p-1" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex min-h-[3.5rem] items-center gap-3 px-3 py-2">
          <span className="h-10 w-10 shrink-0 rounded-full bg-hairline/50 motion-safe:animate-pulse" />
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="h-3 w-2/5 rounded bg-hairline/50 motion-safe:animate-pulse" />
            <span className="h-2.5 w-3/5 rounded bg-hairline/40 motion-safe:animate-pulse" />
          </span>
        </div>
      ))}
    </div>
  );
}

function SectionHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 pb-1.5 pt-3">
      <span className="text-label font-semibold uppercase tracking-tag text-lo">{children}</span>
      {action}
    </div>
  );
}

/** ⌘K command palette — a Sofascore-class entity search (ADR-081). cmdk owns keyboard nav + combobox/listbox
 *  a11y; we own the ranking (client-side over the baked index) and the skin. No network per keystroke. */
export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const recents = useRecents();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabKey>("all");

  // Lazily pull the heavy entity index (285 KB) on first open — keeps it out of the initial bundle.
  const [idx, setIdx] = useState<typeof import("../../lib/data/entitySearch") | null>(null);
  useEffect(() => {
    if (!open || idx) return;
    let alive = true;
    import("../../lib/data/entitySearch").then((m) => { if (alive) setIdx(m); }).catch(() => { /* stays null → skeleton, never blank */ });
    return () => { alive = false; };
  }, [open, idx]);

  // Reset the query/tab each time the palette closes, so it opens fresh.
  useEffect(() => { if (!open) { setQuery(""); setTab("all"); } }, [open]);

  // Live match search (existing /search, debounced). Under fixtures or on error we fall back to MARKETS below.
  const [live, setLive] = useState<SearchResults | null>(null);
  useEffect(() => {
    if (USE_FIXTURES) { setLive(null); return; }
    const q = query.trim();
    if (q.length < 2) { setLive(null); return; }
    let alive = true;
    const t = setTimeout(() => {
      searchLive(q).then((r) => { if (alive) setLive(r); }).catch(() => { if (alive) setLive(null); });
    }, 120);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);

  const q = query.trim();
  const querying = q.length >= 2;
  const showLive = live != null && live.matches.length > 0;

  // Entity results for the active tab (empty in the Match tab — matches come from the API/fixtures path).
  const entityResults = useMemo<Entity[]>(() => {
    if (!idx || !querying || tab === "match") return [];
    const kinds = TABS.find((t) => t.key === tab)!.kinds;
    return idx.rankEntities(q, kinds, tab === "all" ? 60 : 40);
  }, [idx, querying, tab, q]);

  const matches = useMemo<CommandMatch[]>(() => {
    if (!querying) return [];
    if (showLive) return live!.matches.map((m) => ({ matchId: m.matchId, home: m.home, away: m.away, homeCode: m.homeCode, awayCode: m.awayCode }));
    const ql = q.toLowerCase();
    return MARKETS.filter((m) => `${m.home} ${m.away}`.toLowerCase().includes(ql)).slice(0, 12).map(marketToMatch);
  }, [querying, showLive, live, q]);

  const go = (href: string) => { onOpenChange(false); router.push(href); };
  const openEntity = (e: Entity) => {
    if (!e.href) return;
    recents.add({ key: `${e.kind}-${e.id}`, kind: e.kind, label: e.name, meta: e.meta, href: e.href, teamCode: e.teamCode, photo: e.photo });
    go(e.href);
  };
  const openMatch = (m: CommandMatch) => {
    recents.add({ key: `match-${m.matchId}`, kind: "match", label: `${m.home} v ${m.away}`, meta: matchMeta(m), href: routes.match(m.matchId), teamCode: m.homeCode, awayCode: m.awayCode });
    go(routes.match(m.matchId));
  };

  // Suggested (empty state): the tournament + marquee teams, then a few live/next matches.
  const suggested = idx ? idx.suggestedEntities() : [];
  const suggestedMatches = MARKETS.filter((m) => m.minute != null).slice(0, 3).map(marketToMatch);
  const pages = querying && tab === "all" ? NAV.filter((n) => n.label.toLowerCase().includes(q.toLowerCase())) : [];

  const grouped = ALL_ORDER.map((k) => ({ kind: k, rows: entityResults.filter((e) => e.kind === k).slice(0, PER_GROUP) })).filter((g) => g.rows.length);
  const showMatches = querying && (tab === "all" || tab === "match");
  const totalHits = entityResults.length + (showMatches ? matches.length : 0) + pages.length;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Search teams, players, matches, competitions, managers and venues"
      shouldFilter={false}
      overlayClassName="fixed inset-0 z-50 bg-bg/80"
      contentClassName="fixed left-1/2 top-[12%] z-50 w-[92vw] max-w-[600px] -translate-x-1/2 overflow-hidden rounded-card border border-hairline bg-surface elev-hi"
      className="text-hi"
      onKeyDown={(ev) => {
        if ((ev.metaKey || ev.ctrlKey) && /^[1-9]$/.test(ev.key)) {
          const t = TABS[Number(ev.key) - 1];
          if (t) { ev.preventDefault(); setTab(t.key); }
        }
      }}
    >
      {/* Input */}
      <div className="flex items-center gap-3 border-b border-hairline px-4">
        <Search size={20} strokeWidth={2} className="shrink-0 text-lo" aria-hidden />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search matches, competitions, teams, players, and more"
          className="h-14 w-full bg-transparent text-body text-hi placeholder:text-lo outline-none"
        />
        <kbd className="num rounded bg-bg px-1.5 py-0.5 text-label text-lo ring-1 ring-inset ring-hairline">esc</kbd>
      </div>

      {/* Category pills */}
      <div role="tablist" aria-label="Result categories" className="flex gap-2 overflow-x-auto border-b border-hairline px-3 py-2.5 [scrollbar-width:thin]">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-label font-medium transition-colors ${active ? "bg-up text-bg" : "bg-bg text-hi hover:bg-hairline/60"}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <Command.List className="max-h-[56vh] overflow-y-auto p-1">
        {/* Empty query → Recent + Suggested */}
        {!querying && (
          <>
            {recents.recents.length > 0 && (
              <>
                <SectionHeading action={<button type="button" onClick={recents.clear} className="text-caption font-semibold uppercase tracking-tag text-chain transition-colors hover:text-up">Clear history</button>}>Recent</SectionHeading>
                {recents.recents.map((r) => <RecentRowItem key={r.key} r={r} onOpen={(rr) => go(rr.href)} onRemove={recents.remove} />)}
              </>
            )}
            <SectionHeading>Suggested</SectionHeading>
            {!idx ? <SkeletonRows /> : (
              <>
                {suggested.map((e) => <EntityRow key={`${e.kind}-${e.id}`} e={e} onOpen={openEntity} />)}
                {suggestedMatches.map((m) => <MatchRow key={m.matchId} m={m} onOpen={openMatch} />)}
              </>
            )}
          </>
        )}

        {/* Query, index still loading → skeleton */}
        {querying && !idx && <SkeletonRows />}

        {/* Query with the index ready */}
        {querying && idx && (
          <>
            {totalHits === 0 && (
              <div className="flex flex-col items-center gap-1 px-3 py-10 text-center">
                <Search size={22} className="text-lo" aria-hidden />
                <p className="text-body text-hi">No results for “{q}”</p>
                <p className="text-caption text-lo">Try a team, player, competition, manager or venue.</p>
              </div>
            )}

            {/* All tab → grouped; specific entity tab → flat list */}
            {tab === "all" ? (
              <>
                {showMatches && matches.length > 0 && (
                  <><SectionHeading>Matches</SectionHeading>{matches.slice(0, PER_GROUP).map((m) => <MatchRow key={m.matchId} m={m} onOpen={openMatch} />)}</>
                )}
                {grouped.map((g) => (
                  <div key={g.kind}><SectionHeading>{GROUP_LABEL[g.kind]}</SectionHeading>{g.rows.map((e) => <EntityRow key={`${e.kind}-${e.id}`} e={e} onOpen={openEntity} />)}</div>
                ))}
                {pages.length > 0 && (
                  <><SectionHeading>Pages</SectionHeading>{pages.map((n) => (
                    <Command.Item key={n.href} value={`page-${n.href}`} onSelect={() => go(n.href)} className={`${ROW} cursor-pointer`}>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-hairline/40 ring-1 ring-inset ring-hairline"><Clock size={16} className="text-lo" aria-hidden /></span>
                      <span className="flex-1 truncate text-body font-semibold text-hi">{n.label}</span>
                      <ChevronRight size={16} className="shrink-0 text-lo opacity-40 transition-opacity group-data-[selected=true]:opacity-100" aria-hidden />
                    </Command.Item>
                  ))}</>
                )}
              </>
            ) : tab === "match" ? (
              matches.map((m) => <MatchRow key={m.matchId} m={m} onOpen={openMatch} />)
            ) : (
              entityResults.map((e) => <EntityRow key={`${e.kind}-${e.id}`} e={e} onOpen={openEntity} />)
            )}
          </>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
