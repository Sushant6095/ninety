import { type TeamProfile } from "./data";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-2.5 last:border-0">
      <span className="text-label uppercase tracking-micro text-lo">{label}</span>
      <span className="min-w-0 truncate text-right text-caption text-hi">{children}</span>
    </div>
  );
}

/** Team facts — only fields the source actually returned. Nothing (followers, market value, media) is invented;
 *  an absent field is simply not shown. Website is a real outbound link, not a runtime asset. */
export function DetailsTab({ t }: { t: TeamProfile }) {
  const website = t.website?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const rows: { label: string; value: React.ReactNode }[] = [];
  if (t.country) rows.push({ label: t.kind === "nation" ? "Confederation entry" : "Country", value: t.country });
  if (t.group) rows.push({ label: "Group", value: `Group ${t.group}` });
  if (t.venue) rows.push({ label: "Home venue", value: t.venue });
  if (t.founded) rows.push({ label: "Founded", value: <span className="num tabular-nums">{t.founded}</span> });
  if (t.clubColors) rows.push({ label: "Colours", value: t.clubColors });
  if (t.coach) rows.push({ label: "Coach", value: t.coach.name });
  if (t.tla) rows.push({ label: "Code", value: <span className="num tabular-nums">{t.tla}</span> });
  if (website)
    rows.push({
      label: "Website",
      value: (
        <a href={t.website!} target="_blank" rel="noopener noreferrer" className="rounded-sm text-up underline decoration-hairline underline-offset-2 outline-none transition-colors hover:decoration-up focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up/50">
          {website}
        </a>
      ),
    });

  if (rows.length === 0) {
    return <div className="rounded-card border border-dashed border-hairline p-6 text-center text-caption text-lo">No profile details available for {t.name} on our data tier.</div>;
  }
  return (
    <div className="rounded-card border border-hairline bg-surface px-4 py-1">
      {rows.map((r) => (
        <Row key={r.label} label={r.label}>
          {r.value}
        </Row>
      ))}
    </div>
  );
}
