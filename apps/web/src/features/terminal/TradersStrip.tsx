"use client";
import { useEffect, useState } from "react";
import { AvatarCircles } from "../../components/vendor/magicui/avatar-circles";
import { LEADERS } from "../../lib/fixtures";
import { routes } from "../../lib/routes";
import { MARKET_STATUS } from "../../lib/terminal";

interface Avatar {
  imageUrl: string;
  profileUrl: string;
}

const SHOWN = LEADERS.slice(0, 5);
const initials = (handle: string): string => handle.replace(/^@/, "").slice(0, 2).toUpperCase();

// Local SVG initials disc as a data URI — no remote avatar URLs, ever. Colors are read from the live
// CSS custom properties at mount so no raw hex enters the component (design law).
function disc(text: string, bg: string, ring: string, fg: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">` +
    `<rect width="39" height="39" x="0.5" y="0.5" rx="19.5" fill="${bg}" stroke="${ring}"/>` +
    `<text x="20" y="24.5" text-anchor="middle" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="12" font-weight="600" fill="${fg}">${text}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** "Traders in this market" — the top traders as initials discs (magicui AvatarCircles, imported as-is)
 *  plus the live head-count. Static market metric, same source as the old TRADERS IN tile. */
export function TradersStrip() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);

  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const v = (name: string): string => css.getPropertyValue(name).trim();
    setAvatars(
      SHOWN.map((l) => ({
        imageUrl: disc(initials(l.handle), v("--bg"), v("--hairline"), v("--text-hi")),
        profileUrl: routes.profile(l.handle),
      }))
    );
  }, []);

  return (
    <div className="flex min-h-11 items-center gap-3 border-t border-hairline/60 px-4 py-2.5">
      {avatars.length > 0 && <AvatarCircles avatarUrls={avatars} className="-space-x-3" />}
      <p className="text-caption text-lo">
        <span className="num font-semibold tabular-nums text-hi">{MARKET_STATUS.tradersIn.toLocaleString("en-US")}</span>{" "}
        traders in this market
      </p>
    </div>
  );
}
