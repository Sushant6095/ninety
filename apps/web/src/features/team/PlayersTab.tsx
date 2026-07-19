import Image from "next/image";
import Link from "next/link";
import { posGroupLabel, posRank, ageApprox, initials, type TeamProfile, type SquadPlayer } from "./data";

function Avatar({ p }: { p: SquadPlayer }) {
  if (p.photo) {
    return <Image src={p.photo} alt={p.name} width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-inset ring-hairline" />;
  }
  return (
    <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-full bg-hairline/40 text-label font-semibold text-lo ring-1 ring-inset ring-hairline" aria-hidden>
      {initials(p.name)}
    </span>
  );
}

function PlayerRow({ p }: { p: SquadPlayer }) {
  const age = ageApprox(p.dob);
  const inner = (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar p={p} />
      <span className="min-w-0">
        <span className="block truncate text-caption font-medium text-hi">{p.name}</span>
        <span className="num block text-label tabular-nums text-lo">{age != null ? `${age} yrs` : "—"}</span>
      </span>
    </span>
  );
  const base = "flex items-center justify-between gap-3 rounded-card border border-hairline bg-surface px-3 py-2";
  if (p.navigable) {
    return (
      <li>
        <Link href={`/player/${p.id}`} className={`${base} group transition-colors duration-150 hover:border-up/40 hover:bg-hairline/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up/50`}>
          {inner}
          <span className="text-label uppercase tracking-micro text-up opacity-0 transition-opacity duration-150 group-hover:opacity-100">Profile →</span>
        </Link>
      </li>
    );
  }
  return (
    <li className={base}>
      {inner}
    </li>
  );
}

/** The squad, grouped by position (GK → DEF → MID → FWD). Only players with a full Ninety profile link through to
 *  /player/[id]; the rest are shown but non-navigable — no dead ends, ever. Empty tab is never rendered (TeamPage
 *  omits it when the squad is empty), but the guard stays for safety. */
export function PlayersTab({ t }: { t: TeamProfile }) {
  if (t.squad.length === 0) {
    return <div className="rounded-card border border-dashed border-hairline p-6 text-center text-caption text-lo">Squad not available for {t.name} on our data tier.</div>;
  }
  const groups = new Map<string, SquadPlayer[]>();
  for (const p of t.squad) {
    const k = p.pos ?? "Other";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(p);
  }
  const ordered = [...groups.entries()].sort((a, b) => posRank(a[0]) - posRank(b[0]));
  return (
    <div className="flex flex-col gap-5">
      {ordered.map(([pos, players]) => (
        <section key={pos}>
          <h3 className="flex items-baseline gap-2 text-label uppercase tracking-micro text-lo">
            {posGroupLabel(pos)} <span className="num tabular-nums">({players.length})</span>
          </h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {players.map((p) => (
              <PlayerRow key={p.id} p={p} />
            ))}
          </ul>
        </section>
      ))}
      <p className="text-label text-lo">Squad from football-data.org (STILL data). Only players with a full Ninety profile link through — the rest are shown, not linked.</p>
    </div>
  );
}
