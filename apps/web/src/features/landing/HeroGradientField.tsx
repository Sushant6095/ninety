"use client";
// Animated hero gradient field — SANCTIONED on the LANDING HERO ONLY (ADR-058). Never a live-price surface
// (/terminal, /board, /match): it must not contend with the 150ms tick path. A flat bg field is why the page
// read dead; this gives it depth without a GPU tax on any price path.
//
// It is deliberately NOT the WebGL shadergradient lib: STEP-2's own constraints (no repeated long tasks on
// scroll, FCP not past ~200ms, "off the main thread where possible") are met by a compositor-only CSS mesh —
// two slow-drifting blurred blobs animated on transform alone, a baked (static) SVG grain, and a centre
// vignette. Tokens only (--up over --bg), reduced-motion is a static field, behind content by -z-10.
export function HeroGradientField({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute inset-0" style={{ background: "var(--bg)" }} />
      <div className="hgf-blob hgf-blob-a" />
      <div className="hgf-blob hgf-blob-b" />
      <div className="hgf-grain absolute inset-0" />
      {/* vignette — darkens the edges so focus falls to centre */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 95% at 50% 40%, transparent 36%, color-mix(in srgb, var(--bg) 72%, transparent) 100%)",
        }}
      />
      <style jsx>{`
        .hgf-blob {
          position: absolute;
          width: 72vw;
          height: 72vw;
          max-width: 900px;
          max-height: 900px;
          border-radius: 9999px;
          filter: blur(90px);
          will-change: transform;
        }
        .hgf-blob-a {
          top: -24%;
          left: -6%;
          background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--up) 24%, transparent), transparent 68%);
          animation: hgf-drift-a 26s ease-in-out infinite alternate;
        }
        .hgf-blob-b {
          bottom: -30%;
          right: -10%;
          background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--up) 14%, transparent), transparent 66%);
          animation: hgf-drift-b 34s ease-in-out infinite alternate;
        }
        .hgf-grain {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 160px 160px;
          opacity: 0.045;
          mix-blend-mode: overlay;
        }
        @keyframes hgf-drift-a {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to { transform: translate3d(6%, 4%, 0) scale(1.12); }
        }
        @keyframes hgf-drift-b {
          from { transform: translate3d(0, 0, 0) scale(1.05); }
          to { transform: translate3d(-5%, -3%, 0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hgf-blob {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
