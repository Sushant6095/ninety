"use client";
import { useId, useState } from "react";

export interface TabDef {
  id: string;
  label: string;
  panel: React.ReactNode;
}

/** Minimal accessible tabs — only tabs WITH data are ever passed in (no empty Media tab a judge can click). Panels
 *  are server-rendered and handed in as props, so switching is a pure client toggle, no refetch. Mirrors the player
 *  page's tabs; kept local (owned path) with a team-correct aria-label rather than importing across features. */
export function TeamTabs({ tabs }: { tabs: TabDef[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const base = useId();
  return (
    <div>
      <div role="tablist" aria-label="Team views" className="flex gap-1 overflow-x-auto border-b border-hairline">
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              id={`${base}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${t.id}`}
              onClick={() => setActive(t.id)}
              className={`-mb-px shrink-0 cursor-pointer border-b-2 px-4 py-2.5 text-caption font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up/50 ${
                selected ? "border-up text-hi" : "border-transparent text-lo hover:text-hi"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`${base}-panel-${t.id}`} aria-labelledby={`${base}-tab-${t.id}`} hidden={t.id !== active} className="pt-4">
          {t.panel}
        </div>
      ))}
    </div>
  );
}
