import { type ComponentPropsWithoutRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"section"> {
  children: ReactNode;
  className?: string;
}

/** magicui bento-grid, re-skinned to Ninety. The stock shell (Icon slot, hover CTA + Button,
 *  next-themes light/dark box-shadows, fixed 22rem rows) is stripped: Ninety cells carry real
 *  components with their own headers and content-driven heights. Grid: single column on mobile,
 *  a 6-track bento at lg — cells set their own col/row spans. */
const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div className={cn("grid w-full grid-cols-1 gap-3 lg:grid-cols-6", className)} {...props}>
      {children}
    </div>
  );
};

/** One bento cell — the quiet Ninety surface card (hairline border, elev shadow), border
 *  brightening on hover like every other board card. */
const BentoCard = ({ children, className, ...props }: BentoCardProps) => (
  <section
    className={cn(
      // no `group` here on purpose — cells nest MagicCard tiles whose group-hover must not fire card-wide
      "elev relative flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-hairline/70 bg-surface transition-colors duration-200 hover:border-hairline",
      className,
    )}
    {...props}
  >
    {children}
  </section>
);

export { BentoCard, BentoGrid };
