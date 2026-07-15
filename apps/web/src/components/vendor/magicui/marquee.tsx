import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Optional CSS class name to apply custom styles
   */
  className?: string;
  /**
   * Whether to reverse the animation direction
   * @default false
   */
  reverse?: boolean;
  /**
   * Whether to pause the animation on hover
   * @default false
   */
  pauseOnHover?: boolean;
  /**
   * Content to be displayed in the marquee
   */
  children: React.ReactNode;
  /**
   * Whether to animate vertically instead of horizontally
   * @default false
   */
  vertical?: boolean;
  /**
   * Number of times to repeat the content
   * @default 4
   */
  repeat?: number;
}

/** magicui marquee, re-skinned to Ninety. The loop vars are RENAMED --marquee-duration/--marquee-gap
 *  (tailwind.config.ts keys animate-marquee off them): the global --duration is the 200ms motion token,
 *  and an infinite loop bound to it would strobe. Repeat clones are aria-hidden + inert so screen readers
 *  and the tab order see the content exactly once; motion-reduce freezes the loop as a belt-and-braces
 *  guard (callers should render a static row instead — see features/home/Ticker). */
export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        "group flex gap-[var(--marquee-gap)] overflow-hidden [--marquee-duration:40s] [--marquee-gap:1rem]",
        {
          "flex-row": !vertical,
          "flex-col": vertical,
        },
        className,
      )}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            aria-hidden={i > 0 || undefined}
            inert={i > 0}
            className={cn(
              "flex shrink-0 justify-around gap-[var(--marquee-gap)] motion-reduce:animate-none",
              {
                "animate-marquee flex-row": !vertical,
                "animate-marquee-vertical flex-col": vertical,
                "group-hover:[animation-play-state:paused]": pauseOnHover,
                "[animation-direction:reverse]": reverse,
              },
            )}
          >
            {children}
          </div>
        ))}
    </div>
  );
}
