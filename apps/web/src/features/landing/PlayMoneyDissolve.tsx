"use client";
import dynamic from "next/dynamic";

// The play-money line reforming from particles (godui particle-dissolve, re-skinned) — the close
// section's disclosure beat. Canvas discipline: next/dynamic ssr:false, in-view one-shot, rAF
// released once the text settles (re-skinned in the vendor file), dpr ≤ 1.5. The full disclosure
// ("Play money · No deposits · No cash payouts, ever") stays plain text in the hero and footer;
// the canvas carries its aria-label. Reduced motion → the formed line, instantly.
const ParticleDissolve = dynamic(
  () => import("../../components/vendor/godui/particle-dissolve").then((m) => m.ParticleDissolve),
  { ssr: false, loading: () => <div aria-hidden className="h-[44px] w-[440px] max-w-full" /> },
);

export function PlayMoneyDissolve({ className = "" }: { className?: string }) {
  return (
    <ParticleDissolve
      text="Play money, always"
      width={440}
      height={44}
      fontSize={26}
      fontWeight={600}
      density={2}
      particleSize={1.5}
      trigger="in-view"
      mode="assemble"
      className={`font-ui text-lo ${className}`}
    />
  );
}
