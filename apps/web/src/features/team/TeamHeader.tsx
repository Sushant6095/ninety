import Image from "next/image";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { ClubCrest } from "./Crest";
import { initials, type TeamProfile } from "./data";

function HeaderCrest({ t }: { t: TeamProfile }) {
  if (t.kind === "club" && t.crest) return <ClubCrest src={t.crest} name={t.name} size={96} priority />;
  if (t.fifaCode) return <TeamCrest code={t.fifaCode} size={96} priority />;
  return <span className="num grid h-24 w-24 place-items-center rounded-card bg-hairline/40 text-strong font-semibold text-lo">{initials(t.name)}</span>;
}

function CoachChip({ t }: { t: TeamProfile }) {
  if (!t.coach) return null;
  const c = t.coach;
  return (
    <div className="mt-3 inline-flex items-center gap-2.5">
      {c.photo ? (
        <Image src={c.photo} alt={c.name} width={32} height={32} className="h-8 w-8 rounded-full object-cover ring-1 ring-inset ring-hairline" />
      ) : (
        <span className="num grid h-8 w-8 place-items-center rounded-full bg-hairline/40 text-label font-semibold text-lo ring-1 ring-inset ring-hairline" aria-hidden>
          {initials(c.name)}
        </span>
      )}
      <span className="flex flex-col">
        <span className="text-caption font-medium text-hi">{c.name}</span>
        <span className="text-label uppercase tracking-micro text-lo">Coach{c.nat ? ` · ${c.nat}` : ""}</span>
      </span>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-label uppercase tracking-micro text-lo">{label}</span>
      <span className="truncate text-caption font-medium text-hi">{children}</span>
    </div>
  );
}

/** The identity card — 96px crest, name (system font, large, semibold), flag+country, coach chip, then a meta strip
 *  (venue · competition · founded). Only fields the source returned are shown. Mirrors the player header's rhythm. */
export function TeamHeader({ t }: { t: TeamProfile }) {
  const competition = t.standings[0]?.competition ?? (t.kind === "nation" ? "FIFA World Cup 2026" : t.country ?? "—");
  return (
    <header className="elev flex flex-col gap-5 rounded-card border border-hairline bg-surface p-5 lg:p-6">
      <div className="flex items-center gap-4 sm:gap-5">
        <HeaderCrest t={t} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-caption text-lo">
            {t.fifaCode ? <TeamCrest code={t.fifaCode} size={18} /> : null}
            <span className="truncate">{t.country ?? t.name}</span>
            <span aria-hidden>·</span>
            <span className="truncate">{t.kind === "nation" ? "National team" : "Club"}</span>
          </div>
          <h1 className="mt-1 truncate text-3xl font-semibold leading-tight tracking-tight text-hi sm:text-4xl">{t.name}</h1>
          <CoachChip t={t} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-hairline pt-4 sm:grid-cols-4">
        <Meta label="Competition">{competition}</Meta>
        {t.venue && <Meta label="Venue">{t.venue}</Meta>}
        {t.founded && (
          <Meta label="Founded">
            <span className="num tabular-nums">{t.founded}</span>
          </Meta>
        )}
        {t.group && <Meta label="Group">Group {t.group}</Meta>}
      </div>
    </header>
  );
}
