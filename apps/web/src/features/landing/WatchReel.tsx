import { VideoReel } from "../../components/vendor/skiper/skiper67";

// "The film" — skiper67 click-to-play video player re-skinned to Ninety tokens (see the component header).
// ⚠ Source is the same Video-495 anime-Messi reel used by the scroll-scrub — a MECHANISM PLACEHOLDER
// (named-player likeness + federation/sponsor marks). Fine for local; swap for an owned / licensed /
// anonymous film before any public ship. The player is asset-agnostic (src + poster are props).
export function WatchReel() {
  return (
    <section aria-labelledby="film-h" className="border-b border-hairline">
      <div
        data-arrive
        className="mx-auto grid w-full max-w-[1180px] items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16 lg:py-24"
      >
        <div>
          <p data-arrive-item className="text-label font-semibold uppercase tracking-caps text-lo">
            The film
          </p>
          <h2 data-arrive-item id="film-h" className="mt-4 max-w-[16ch] font-display text-section font-bold text-hi">
            The whole idea, in one film.
          </h2>
          <p data-arrive-item className="mt-5 max-w-[46ch] text-strong leading-relaxed text-lo">
            The game moving, the price moving with it, the result proven on-chain. Press play. It
            opens full screen.
          </p>
        </div>
        <div data-arrive-item>
          <VideoReel src="/video/ninety-reel.mp4" poster="/video/ninety-reel-poster.jpg" label="Play" />
        </div>
      </div>
    </section>
  );
}
