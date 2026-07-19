import Link from "next/link";
import { Logomark } from "./Logomark";

interface WordmarkProps {
  tag?: string; // e.g. "WC26"
}

/** The Ninety horizontal lockup (brand, ADR-064): the River-9 mark + Archivo wordmark. Links home. */
export function Wordmark({ tag }: WordmarkProps) {
  return (
    <Link href="/" aria-label="Ninety, home" className="group inline-flex items-center gap-2 text-hi">
      <Logomark size={26} className="shrink-0 transition-transform duration-200 group-hover:-translate-y-px" />
      <span className="font-display text-heading font-extrabold leading-none tracking-tighter transition-opacity duration-200 group-hover:opacity-80">
        Ninety
      </span>
      {tag && (
        <span className="num rounded-[5px] bg-surface px-1 py-[3px] text-label font-medium leading-none text-lo ring-1 ring-hairline ring-inset">
          {tag}
        </span>
      )}
    </Link>
  );
}
