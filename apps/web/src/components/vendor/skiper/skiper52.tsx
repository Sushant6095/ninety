"use client";
// skiper-ui "skiper52" HoverExpand_001 (skiper-ui.com/registry/skiper52), re-skinned to Ninety.
// A horizontal strip where the hovered / focused panel expands and the rest yield space. Two shapes:
//   • HoverExpand         — text panels (the tagline-as-panels use on the legacy landing)
//   • HoverExpandGallery  — image panels (the icons strip; this is the registry's real form)
// Re-skin notes (source → Ninety):
// - dead `swiper/css` imports dropped (swiper isn't installed — registry baggage that broke the build)
//   along with the illustration demo, its cream hex stage and the translucent-white caption
// - raw hex → tokens throughout (surface, hairline, up, text-hi, bg via color-mix scrim)
// - the registry's framer `animate={{ width }}` → a CSS flex-grow transition. LAW TENSION, flagged:
//   flex-grow is a layout property, but the width expansion IS this component's essence; it is
//   contained to one row at 260ms and lives landing-only — never on a live-price surface (tick path).
// - expansion fires on hover AND focus-within (each panel focusable → keyboard + touch parity);
//   focus-visible ring; prefers-reduced-motion → equal widths, no transition, copy at full strength.
import { cn } from "@/lib/utils";

// shared expansion behaviour for one panel (hover/focus grow, tokens, reduced-motion)
const PANEL =
  "group relative min-w-0 shrink-0 basis-0 grow overflow-hidden rounded-card border border-hairline bg-surface outline-none transition-[flex-grow] duration-slow ease-out hover:border-up/30 focus-within:grow-[6] focus-visible:ring-2 focus-visible:ring-up/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:border-up/40 motion-reduce:transition-none motion-reduce:hover:grow motion-reduce:focus-within:grow";

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
          className={cn(PANEL, "p-6 hover:grow-[2.2] focus-within:grow-[2.2] motion-reduce:min-w-0 sm:h-[200px]")}
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

export interface GalleryItem {
  src: string;
  alt: string;
  /** short overlay caption shown on the active panel, e.g. "England · 10" */
  label?: string;
}

interface HoverExpandGalleryProps {
  items: GalleryItem[];
  className?: string;
}

export function HoverExpandGallery({ items, className }: HoverExpandGalleryProps) {
  return (
    <div className={cn("flex gap-1.5 overflow-x-auto", className)}>
      {items.map((item) => (
        <article
          key={item.src}
          tabIndex={0}
          aria-label={item.alt}
          className={cn(PANEL, "h-[320px] min-w-[3.25rem] hover:grow-[6] sm:h-[440px]")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- object-cover strip panel, dims vary per image */}
          <img src={item.src} alt={item.alt} loading="lazy" className="absolute inset-0 size-full object-cover object-top" />
          {/* bottom scrim so the caption reads over any frame, both themes (token-tinted, not raw) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 opacity-0 transition-opacity duration-slow group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:opacity-100"
            style={{ background: "linear-gradient(to top, color-mix(in srgb, var(--bg) 90%, transparent), transparent)" }}
          />
          {item.label && (
            <p className="num absolute bottom-3 left-4 whitespace-nowrap text-label uppercase tracking-caps text-hi opacity-0 transition-opacity duration-slow group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:opacity-100">
              {item.label}
            </p>
          )}
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
