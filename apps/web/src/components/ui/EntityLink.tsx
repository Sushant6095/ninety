import Link from "next/link";
import { cn } from "../../lib/format";

interface EntityLinkProps {
  href: string | null; // resolved via lib/entityLinks; null ⇒ plain text (honesty gate — never a broken link)
  children: React.ReactNode;
  className?: string;
  /** Primary target (score header, screener row) — guarantee a 44px hit area (a11y). */
  primary?: boolean;
  ariaLabel?: string;
}

// Subtle, consistent link affordance (STEP 3): a resolvable entity name/crest looks clickable — a hover colour
// shift toward --text-hi + underline-on-hover, a visible focus ring, tokens only. NOT a sea of blue. When href is
// null the same children render as plain, non-interactive text, so the terminal never grows a broken link.
const AFFORDANCE =
  "group/entity cursor-pointer rounded-sm underline decoration-transparent decoration-1 underline-offset-2 outline-none transition-colors duration-150 hover:text-hi hover:decoration-hairline focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up/50";

export function EntityLink({ href, children, className = "", primary = false, ariaLabel }: EntityLinkProps) {
  if (!href) return <span className={className}>{children}</span>;
  return (
    <Link href={href} aria-label={ariaLabel} className={cn(AFFORDANCE, primary && "hit inline-flex items-center", className)}>
      {children}
    </Link>
  );
}
