import { HoverExpandGallery, type GalleryItem } from "../../components/vendor/skiper/skiper52";

// The icons interlude — skiper52 HoverExpand re-skinned to Ninety tokens (see the component header).
// Descriptive, name-free alt (accessibility without asserting a likeness); the visible caption is
// factual nation + squad number. ⚠ These are third-party broadcast / wallpaper stills of named
// players carrying club, sponsor and federation marks — a MECHANISM PLACEHOLDER, same class as the
// scroll-scrub clip. Fine for local; swap for owned / licensed / anonymous art before any public ship.
const ICONS: GalleryItem[] = [
  { src: "/icons/01-bellingham.jpg", alt: "Footballer celebrating with arms wide open in a packed stadium", label: "England · 10" },
  { src: "/icons/02-zlatan.jpg", alt: "Striker's raised-arm celebration under stadium floodlights", label: "Milan" },
  { src: "/icons/03-haaland-poster.jpg", alt: "Stylised warrior-kit striker holding the tournament match ball", label: "Norway · 9" },
  { src: "/icons/04-haaland.jpg", alt: "Striker sprinting at full pace in a red national shirt", label: "Norway · 9" },
  { src: "/icons/05-zidane.jpg", alt: "Midfielder driving forward with the ball in a white national kit", label: "France · 10" },
  { src: "/icons/06-messi.jpg", alt: "Young forward in a dark national shirt, number nineteen", label: "Argentina · 19" },
  { src: "/icons/07-pele.jpg", alt: "Forward leaping in celebration in a yellow national shirt", label: "Brazil · 10" },
];

export function IconsGallery() {
  return (
    <section aria-labelledby="icons-h" className="border-b border-hairline">
      <div data-arrive className="mx-auto w-full max-w-[1180px] px-4 pt-16 sm:px-6 lg:pt-24">
        <p data-arrive-item className="text-label font-semibold uppercase tracking-caps text-lo">
          The icons
        </p>
        <h2 data-arrive-item id="icons-h" className="mt-4 max-w-[20ch] font-display text-section font-bold text-hi">
          The shirts that move a nation.
        </h2>
        <p data-arrive-item className="mt-5 max-w-[52ch] text-strong leading-relaxed text-lo">
          From Pelé to today, the players who defined the shirt. This summer, forty-eight of those
          shirts are live markets — hover a shirt to bring it forward.
        </p>
      </div>
      <div data-arrive-item className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-10 sm:px-6 lg:pb-24">
        <HoverExpandGallery items={ICONS} />
      </div>
    </section>
  );
}
