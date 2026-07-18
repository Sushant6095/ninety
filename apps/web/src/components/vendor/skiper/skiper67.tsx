"use client";
// skiper-ui "skiper67" click-to-play video player (skiper-ui.com/registry/skiper67), re-skinned to Ninety.
// A poster tile with a cursor-following "Play" pill; click expands (clip-path) into a fullscreen
// media-chrome player. Re-skin notes (source → Ninety):
// - the raw cream-hex demo stage dropped; the demo's own showreel src → prop-driven (Ninety reel + poster)
// - the preview is IntersectionObserver-gated (loads/plays only in view, pauses out of view) so the
//   ~2MB clip never loads for visitors who don't scroll here; prefers-reduced-motion → poster only,
//   and the popover reveal collapses to a plain fade (no clip-path spring)
// - close is a real <button> (aria-label + Escape key + backdrop click); focus-visible rings throughout;
//   body scroll locked while open
// - colours via tokens; the pill + media-chrome controls keep white via mix-blend-exclusion — correct
//   contrast over arbitrary video frames, which are not a token surface
import { AnimatePresence, motion, useReducedMotion, useSpring } from "framer-motion";
import { Play, X } from "lucide-react";
import {
  MediaController,
  MediaControlBar,
  MediaMuteButton,
  MediaPlayButton,
  MediaTimeDisplay,
  MediaTimeRange,
} from "media-chrome/react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface VideoReelProps {
  src: string;
  poster: string;
  /** label shown in the cursor-following pill on pointer devices */
  label?: string;
  className?: string;
}

export function VideoReel({ src, poster, label = "Play", className }: VideoReelProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();

  // The popover is portaled to <body>: the landing's data-arrive reveal leaves a transform on an
  // ancestor, and a transformed ancestor makes position:fixed relative to it (not the viewport),
  // which would confine the "fullscreen" player to the grid cell. Portaling escapes that.
  useEffect(() => setMounted(true), []);
  const tileRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const x = useSpring(0, { mass: 0.1 });
  const y = useSpring(0, { mass: 0.1 });
  const pillOpacity = useSpring(0, { mass: 0.1 });

  // Play the preview only while it is in view (and never under reduced motion) — the clip is not
  // fetched for visitors who never scroll here, and it pauses off-screen.
  useEffect(() => {
    const tile = tileRef.current;
    const vid = previewRef.current;
    if (!tile || !vid || reduce) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) vid.play().catch(() => {});
        else vid.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(tile);
    return () => io.disconnect();
  }, [reduce]);

  // Dialog behaviour while open: Escape closes, body scroll locks, focus moves into the dialog and
  // is kept there (focusin pull-back — media-chrome's shadow-DOM controls stay contained), and focus
  // returns to the trigger tile on close.
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onFocusIn = (e: FocusEvent) => {
      if (dialog && e.target instanceof Node && !dialog.contains(e.target)) closeBtnRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusIn = window.setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocusIn);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusIn);
      tileRef.current?.focus();
    };
  }, [open]);

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    pillOpacity.set(1);
    const b = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - b.left);
    y.set(e.clientY - b.top);
  };

  const onTileKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const panelMotion = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.18 },
      }
    : {
        initial: { clipPath: "inset(44% 44% 34% 44%)", opacity: 0 },
        animate: { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 },
        exit: {
          clipPath: "inset(44% 44% 34% 44%)",
          opacity: 0,
          transition: { duration: 0.55, type: "spring" as const, stiffness: 100, damping: 20, opacity: { duration: 0.2, delay: 0.35 } },
        },
        transition: { duration: 0.7, type: "spring" as const, stiffness: 100, damping: 20 },
      };

  return (
    <>
      <div
        ref={tileRef}
        role="button"
        tabIndex={0}
        aria-label="Play the film"
        onPointerMove={handleMove}
        onPointerLeave={() => pillOpacity.set(0)}
        onClick={() => setOpen(true)}
        onKeyDown={onTileKey}
        className={cn(
          "group relative aspect-video w-full cursor-pointer overflow-hidden rounded-card border border-hairline bg-surface outline-none focus-visible:ring-2 focus-visible:ring-up/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- <video> poster, not an <img> */}
        <video
          ref={previewRef}
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          className="absolute inset-0 size-full object-cover"
        >
          <source src={src} type="video/mp4" />
        </video>

        {/* cursor-following pill (pointer devices) */}
        <motion.div
          style={{ x, y, opacity: pillOpacity }}
          className="pointer-events-none absolute left-0 top-0 z-20 flex w-fit -translate-x-1/2 -translate-y-1/2 select-none items-center gap-2 p-2 text-sm text-white mix-blend-exclusion motion-reduce:hidden"
        >
          <Play className="size-4 fill-white" /> {label}
        </motion.div>

        {/* static affordance for touch / reduced-motion (no cursor to follow) */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="flex items-center gap-2 rounded-chip border border-white/25 bg-black/30 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition-opacity duration-fast group-hover:opacity-0 motion-reduce:opacity-100">
            <Play className="size-3.5 fill-white" /> Watch the film
          </span>
        </div>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="The film"
                className="fixed inset-0 z-[101] flex items-center justify-center p-4"
              >
            <motion.button
              type="button"
              aria-label="Close video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default bg-bg/90 backdrop-blur-lg"
            />
            <motion.div
              {...panelMotion}
              className="relative aspect-video max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-card"
            >
              <MediaController className="h-full w-full">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption -- placeholder reel, no caption track */}
                <video src={src} autoPlay slot="media" playsInline className="h-full w-full object-cover" />
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close video"
                  className="absolute right-2 top-2 z-10 flex size-11 items-center justify-center rounded-full text-white outline-none transition-colors mix-blend-exclusion hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <X className="size-5" />
                </button>
                {/* scrim behind the controls so play/scrub/mute stay legible over bright frames */}
                <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-1/4 bg-gradient-to-t from-black/50 to-transparent" />
                <MediaControlBar className="absolute bottom-0 left-1/2 z-10 flex w-full max-w-5xl -translate-x-1/2 items-center gap-3 px-5 py-3 mix-blend-exclusion md:px-8">
                  <MediaPlayButton className="bg-transparent" />
                  <MediaTimeRange className="bg-transparent [--media-range-thumb-opacity:0] [--media-range-track-height:2px]" />
                  <MediaTimeDisplay className="bg-transparent" />
                  <MediaMuteButton className="bg-transparent" />
                </MediaControlBar>
              </MediaController>
            </motion.div>
          </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
