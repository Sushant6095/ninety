"use client";

import { cn } from "@/lib/utils";

interface LegacyAvatar {
  imageUrl: string;
  profileUrl: string;
}

interface AvatarCirclesProps {
  className?: string;
  /** Trader handles — each renders as the repo Avatar idiom's initials disc (hairline bg + ring,
   *  mono initials). Deliberately NO image fetch: the facepile never hits a runtime avatar CDN. */
  handles?: string[];
  /** Legacy stock-API shape kept for the terminal TradersStrip, which feeds LOCAL data-URI SVG
   *  discs (never remote CDN URLs). Rendered as plain non-interactive discs. */
  avatarUrls?: LegacyAvatar[];
  /** How many more traders beyond the visible discs — the "+N" overflow numeral (mono). */
  numPeople?: number;
  /** Disc size in px (handles API). */
  size?: number;
}

/** magicui avatar-circles, re-skinned to Ninety: repo Avatar discs instead of raw <img> URLs,
 *  separation rings in the surface token (was border-white/gray-800), the +N numeral in mono on
 *  a surface disc with a hairline ring. Presentational only — the stock per-avatar target=_blank
 *  anchors are removed (sub-44px hit targets); the consumer wraps the pile in one real link. */
export const AvatarCircles = ({ className, handles, avatarUrls, numPeople, size = 28 }: AvatarCirclesProps) => {
  return (
    // Decorative at-a-glance pile — the consumer's link/label carries the meaning for readers.
    <div aria-hidden className={cn("flex -space-x-2", className)}>
      {handles?.map((handle) => (
        <span key={handle} className="rounded-full ring-2 ring-surface">
          <span
            className="num grid place-items-center rounded-full bg-hairline/60 font-semibold text-lo ring-1 ring-inset ring-hairline"
            style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
          >
            {handle.replace(/^@/, "").slice(0, 2).toUpperCase()}
          </span>
        </span>
      ))}
      {avatarUrls?.map((a, index) => (
        // eslint-disable-next-line @next/next/no-img-element -- local data-URI disc, no network fetch
        <img
          key={a.profileUrl || index}
          className="h-10 w-10 rounded-full ring-2 ring-surface"
          src={a.imageUrl}
          width={40}
          height={40}
          alt=""
        />
      ))}
      {(numPeople ?? 0) > 0 && (
        <span
          className="num grid place-items-center rounded-full bg-surface text-label font-medium text-lo ring-1 ring-inset ring-hairline"
          style={{ width: size, height: size }}
        >
          +{numPeople}
        </span>
      )}
    </div>
  );
};
