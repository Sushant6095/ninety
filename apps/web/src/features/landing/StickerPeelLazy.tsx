"use client";
import dynamic from "next/dynamic";

// ADR-053 discipline: the sticker's three.js rig stays OUT of the initial chunk (shares the three
// vendor chunk with WorldGlobe); slot held by a quiet disc skeleton.
const StickerPeel = dynamic(() => import("./StickerPeel").then((m) => m.StickerPeel), {
  ssr: false,
  loading: () => <div aria-hidden className="h-full w-full animate-pulse rounded-full bg-surface/60 motion-reduce:animate-none" />,
});

export function StickerPeelLazy({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <StickerPeel imageWidth={190} imageHeight={190} hoverPeel={45} pressPeel={64} curlRotation={240} />
    </div>
  );
}
