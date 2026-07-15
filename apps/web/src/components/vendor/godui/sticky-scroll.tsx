"use client";
// godui sticky-scroll — re-skinned to Ninety tokens (surface/hairline/up, Archivo headings,
// motion tokens). Self-contained scroll container: sticky panel + active-item detection work
// inside any ancestor. Reduced motion → instant states, no travel.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as React from "react";
import m from "@/design/motion";

export type StickyScrollItem = {
  title: string;
  description: React.ReactNode;
  /** The visual shown in the pinned panel while this item is active. */
  content: React.ReactNode;
};

export type StickyScrollProps = React.HTMLAttributes<HTMLDivElement> & {
  items: StickyScrollItem[];
};

const StickyScroll = React.forwardRef<HTMLDivElement, StickyScrollProps>(
  ({ items, className, ...props }, ref) => {
    const reduce = useReducedMotion();
    // The component is its own scroll container. That keeps `position: sticky`
    // and the active-item detection self-contained — they work regardless of
    // where it's mounted (including inside `overflow: hidden` ancestors, which
    // would break window-scroll-based sticky).
    const containerRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(
      ref,
      () => containerRef.current as HTMLDivElement,
    );
    const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    const [active, setActive] = React.useState(0);

    // Active item = whichever section crosses the scroller's middle (a center
    // line drawn by the -50%/-50% root margin against the scroll container).
    React.useEffect(() => {
      const root = containerRef.current;
      if (!root) return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const index = itemRefs.current.indexOf(
                entry.target as HTMLDivElement,
              );
              if (index !== -1) setActive(index);
            }
          }
        },
        { root, rootMargin: "-50% 0px -50% 0px", threshold: 0 },
      );
      for (const el of itemRefs.current) {
        if (el) observer.observe(el);
      }
      return () => observer.disconnect();
    }, []);

    const t = reduce ? { duration: 0 } : m.spring;

    return (
      <div
        ref={containerRef}
        data-slot="sticky-scroll"
        // tabIndex + region: the panel scrolls its own overflow, so keyboard users need focus to
        // drive it (axe scrollable-region-focusable, serious).
        tabIndex={0}
        role="region"
        aria-label="The loop, beat by beat"
        className={`elev relative mx-auto h-[30rem] w-full max-w-5xl overflow-y-auto rounded-card border border-hairline bg-surface px-6 outline-none [scrollbar-width:thin] focus-visible:ring-2 focus-visible:ring-up md:px-10 ${className ?? ""}`}
        {...props}
      >
        <div className="grid gap-x-10 md:grid-cols-2">
          <div>
            {items.map((item, i) => {
              const isActive = i === active;
              return (
                <div
                  key={item.title}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  data-active={isActive}
                  className="flex min-h-[22rem] flex-col justify-center py-10 md:h-[30rem] md:min-h-0 md:py-0"
                >
                  <div className="flex items-center gap-3">
                    <motion.span
                      animate={{
                        scaleY: isActive ? 1 : 0.4,
                        opacity: isActive ? 1 : 0.3,
                      }}
                      transition={t}
                      className="h-7 w-1 origin-center rounded-chip bg-up"
                    />
                    <motion.h3
                      animate={{ opacity: isActive ? 1 : 0.4 }}
                      transition={t}
                      className="font-display text-heading font-bold text-hi"
                    >
                      {item.title}
                    </motion.h3>
                  </div>
                  <motion.div
                    animate={{ opacity: isActive ? 1 : 0.4 }}
                    transition={t}
                    className="mt-3 max-w-md pl-4 text-body leading-relaxed text-lo"
                  >
                    {item.description}
                  </motion.div>

                  {/* No pinned panel on narrow screens — show each item's visual
                      inline beneath its copy instead. */}
                  <div className="mt-6 h-52 overflow-hidden rounded-card border border-hairline bg-bg md:hidden">
                    <div className="flex size-full items-center justify-center">
                      {item.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block">
            <div className="sticky top-0 flex h-[30rem] items-center py-6">
              <div className="elev relative size-full overflow-hidden rounded-card border border-hairline bg-bg">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: 8 }}
                    transition={t}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {items[active]?.content}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
StickyScroll.displayName = "StickyScroll";

export { StickyScroll };
