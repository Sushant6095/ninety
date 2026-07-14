import Link from "next/link";

interface WordmarkProps {
  tag?: string; // e.g. "WC26"
}

/** The Ninety wordmark (brand, ADR-044). Links home. */
export function Wordmark({ tag }: WordmarkProps) {
  return (
    <Link href="/" aria-label="Ninety — home" className="group inline-flex items-center gap-2">
      <span className="font-display text-heading font-extrabold leading-none tracking-tighter text-hi transition-opacity duration-200 group-hover:opacity-80">
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
