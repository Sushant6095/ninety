import type { ReactNode } from "react";
import { Reveal } from "../../../components/ui/Reveal";

/** Consistent section rhythm for the how-it-works page — one eyebrow + display heading, generous vertical air
 *  (BRAND register: this page breathes more than the terminal). Reveal handles the scroll-in per section. */
export function Section({ id, eyebrow, title, lede, children, className = "" }: { id?: string; eyebrow?: string; title?: string; lede?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`mx-auto w-full max-w-[1040px] px-4 py-14 sm:px-6 sm:py-20 ${className}`}>
      <Reveal>
        {eyebrow && <div className="text-label font-semibold uppercase tracking-caps text-lo">{eyebrow}</div>}
        {title && <h2 className="mt-2 max-w-[22ch] font-display text-display font-bold leading-tight tracking-tight text-hi">{title}</h2>}
        {lede && <p className="mt-3 max-w-[62ch] text-body leading-relaxed text-lo">{lede}</p>}
        <div className={eyebrow || title || lede ? "mt-8" : ""}>{children}</div>
      </Reveal>
    </section>
  );
}
