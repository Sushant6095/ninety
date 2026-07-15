"use client";
// skiper-ui "skiper52" HoverExpand_001 (skiper-ui.com/registry/skiper52), re-skinned to Ninety:
// - the swiper CSS imports are gone (swiper isn't installed — they were dead registry baggage
//   that broke the build) along with the illustration-gallery demo and its cream stage
// - image panels → content panels on tokens: surface cards, hairline borders, type steps
// - expansion fires on hover AND focus-within (each panel is focusable — keyboard parity);
//   states: hover border lift, focus-visible ring, active press
// - framer width animation → a CSS flex-grow transition. LAW TENSION, flagged: flex-grow is a
//   layout property, but width expansion IS this component's essence; it's contained to one
//   3-panel row at 250ms, far from any live-price surface
// - prefers-reduced-motion → all panels equal width, no transition, copy always at full strength
import { cn } from "@/lib/utils";

export interface HoverExpandItem {
  title: string;
  copy: string;
}

interface HoverExpandProps {
  items: HoverExpandItem[];
  className?: string;
}

export function HoverExpand({ items, className }: HoverExpandProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row", className)}>
      {items.map((item, i) => (
        <article
          key={item.title}
          tabIndex={0}
          className="group min-w-0 basis-0 grow overflow-hidden rounded-card border border-hairline bg-surface p-6 outline-none transition-[flex-grow] duration-slow hover:grow-[2.2] hover:border-up/30 focus-within:grow-[2.2] focus-visible:ring-2 focus-visible:ring-up/60 active:border-up/40 motion-reduce:transition-none motion-reduce:hover:grow motion-reduce:focus-within:grow sm:h-[200px]"
        >
          <p className="num text-label font-semibold tracking-caps text-lo">{String(i + 1).padStart(2, "0")}</p>
          <h3 className="mt-3 whitespace-nowrap font-display text-heading font-semibold text-hi">{item.title}</h3>
          <p className="mt-2 max-w-[44ch] text-body leading-relaxed text-lo opacity-70 transition-opacity duration-slow group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:opacity-100 motion-reduce:transition-none">
            {item.copy}
          </p>
        </article>
      ))}
    </div>
  );
}

/**
 * Skiper 52 HoverExpand_001 — React + Framer Motion (rebuilt on CSS here)
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 *
 * Author: @gurvinder-singh02 · https://gxuri.me
 */
