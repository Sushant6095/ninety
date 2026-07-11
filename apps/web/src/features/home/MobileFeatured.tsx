"use client";
import { useSyncExternalStore } from "react";
import { FeaturedPanel } from "./FeaturedPanel";
import type { MarketRow } from "../../lib/types";

// The right rail (which holds the Featured River) is `hidden xl:block`, so below 1280px the signature
// element vanished — on the exact phone/tablet a fan second-screens on. This gates the Featured panel to
// render ONLY below xl, so exactly one MomentumRiver ever mounts (no display:none chart initialising at 0×0).
const QUERY = "(max-width: 1279px)";

function subscribe(cb: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}
function getServerSnapshot(): boolean {
  return false; // SSR is desktop-first (the rail carries the River there); mount on the client only when below xl
}

/** Featured live match + River, shown only below xl where the right rail is hidden. */
export function MobileFeatured({ market }: { market: MarketRow }) {
  const belowXl = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!belowXl) return null;
  return (
    <div className="mb-4">
      <FeaturedPanel market={market} />
    </div>
  );
}
