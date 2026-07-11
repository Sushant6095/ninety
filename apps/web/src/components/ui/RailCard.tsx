import type { ReactNode } from "react";

interface RailCardProps {
  label?: string;
  action?: ReactNode; // small right-aligned link/control in the header
  children: ReactNode;
  className?: string;
}

/** Surface card with a hairline border + optional label header — the quiet secondary container (left/right rails). */
export function RailCard({ label, action, children, className = "" }: RailCardProps) {
  return (
    <section className={`elev rounded-card border border-hairline/70 bg-surface ${className}`}>
      {label && (
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h2 className="text-label font-semibold uppercase tracking-[0.12em] text-lo">{label}</h2>
          {action}
        </div>
      )}
      <div className={label ? "px-2 pb-2" : "p-2"}>{children}</div>
    </section>
  );
}
