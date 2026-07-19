"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Real product renders (design/screens/impl → public/docs/slider). Each: shot · one-line caption · the route.
interface Slide {
  src: string;
  caption: string;
  route: string;
  alt: string;
}
const SLIDES: readonly Slide[] = [
  { src: "/docs/slider/01-halt.png", caption: "A goal freezes the market", route: "/terminal", alt: "The terminal at a goal halt, the Booth explaining the swing" },
  { src: "/docs/slider/02-board.png", caption: "Every match, one glance", route: "/board", alt: "The board — the live World Cup slate with prices" },
  { src: "/docs/slider/03-terminal.png", caption: "Trade the match live", route: "/terminal", alt: "The trading terminal with the momentum river and ticket" },
  { src: "/docs/slider/04-moments.png", caption: "Big swings, captured", route: "/moments", alt: "The Moments gallery of captured price swings" },
  { src: "/docs/slider/05-play.png", caption: "Call the next goal", route: "/play", alt: "The Next Goal halftime mini-game" },
  { src: "/docs/slider/06-competition.png", caption: "The group stage", route: "/competition", alt: "The competition group tables" },
  { src: "/docs/slider/07-bracket.png", caption: "Road to the Final", route: "/bracket", alt: "The World Cup knockout bracket" },
  { src: "/docs/slider/08-player.png", caption: "Form, impact, market pull", route: "/player/3218", alt: "A player page with form and market impact" },
];

const IMG_SIZES = "(max-width: 640px) 86vw, (max-width: 1024px) 62vw, 44vw";

function SlideCard({ s, priority = false }: { s: Slide; priority?: boolean }) {
  return (
    <Link
      href={s.route}
      className="group block overflow-hidden rounded-card border border-hairline bg-surface outline-none transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-up/40 focus-visible:ring-2 focus-visible:ring-up/60"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-bg">
        <Image
          src={s.src}
          alt={s.alt}
          fill
          sizes={IMG_SIZES}
          priority={priority}
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <span className="min-w-0 truncate text-caption font-medium text-hi">{s.caption}</span>
        <span className="num shrink-0 rounded-chip bg-bg px-2 py-0.5 text-label tabular-nums text-lo ring-1 ring-inset ring-hairline">{s.route}</span>
      </div>
    </Link>
  );
}

/** prefers-reduced-motion: a plain, honest grid — every tile visible, nothing auto-scrolls. */
function SliderGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SLIDES.map((s) => (
        <SlideCard key={s.src} s={s} />
      ))}
    </div>
  );
}

function SliderCarousel() {
  const autoplay = useRef(Autoplay({ delay: 3400, stopOnMouseEnter: true, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", containScroll: "trimSnaps" },
    [autoplay.current, WheelGesturesPlugin({ forceWheelAxis: "x" })],
  );
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    const onReInit = () => {
      setSnaps(emblaApi.scrollSnapList());
      onSelect();
    };
    onReInit();
    emblaApi.on("select", onSelect).on("reInit", onReInit);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onReInit);
    };
  }, [emblaApi]);

  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); scrollPrev(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); scrollNext(); }
  };

  return (
    <div>
      <div
        ref={emblaRef}
        className="overflow-hidden"
        role="group"
        aria-roledescription="carousel"
        aria-label="Product tour — drag, scroll, or use the arrow keys"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <div className="flex touch-pan-y gap-4">
          {SLIDES.map((s, i) => (
            <div key={s.src} className="min-w-0 shrink-0 grow-0 basis-[86%] sm:basis-[62%] lg:basis-[44%]" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}`}>
              <SlideCard s={s} priority={i < 2} />
            </div>
          ))}
        </div>
      </div>

      {/* Controls: prev · dots · next */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={scrollPrev}
          aria-label="Previous slide"
          className="grid h-9 w-9 place-items-center rounded-full text-lo outline-none ring-1 ring-inset ring-hairline transition-colors duration-200 hover:bg-surface hover:text-hi focus-visible:ring-2 focus-visible:ring-up"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === selected}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={`h-1.5 rounded-full outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-up ${
                i === selected ? "w-6 bg-up" : "w-1.5 bg-hairline hover:bg-lo/60"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next slide"
          className="grid h-9 w-9 place-items-center rounded-full text-lo outline-none ring-1 ring-inset ring-hairline transition-colors duration-200 hover:bg-surface hover:text-hi focus-visible:ring-2 focus-visible:ring-up"
        >
          <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

/** The product tour above the fold on /docs. Autoplay + drag + wheel + arrow keys + snap + dots, pauses on
 *  hover; prefers-reduced-motion collapses to a static grid. Images lazy-load (next/image) so FCP holds. */
export function DocsSlider() {
  const [reduced, setReduced] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  return mounted && reduced ? <SliderGrid /> : <SliderCarousel />;
}
