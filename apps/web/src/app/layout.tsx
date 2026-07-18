import "../styles/globals.css";
import type { Metadata } from "next";
import { OfflineBanner } from "../components/ui/OfflineBanner";
import { PrototypeRibbon } from "../components/ui/PrototypeRibbon";
import { Toaster } from "../components/ui/Toaster";
import { CssStudio } from "../components/dev/CssStudio";
import { MatchLiveProvider } from "../features/live/MatchLiveProvider";
import { TooltipProvider } from "../components/ui/Tooltip";

// Fonts are the Apple system stack (globals.css --font-*): no webfont fetch, genuine San Francisco on Apple.
// THEME (ADR-077): a no-flash inline script sets <html data-theme> + the `dark` class BEFORE first paint, from
// localStorage("ninety-theme") then prefers-color-scheme, defaulting to dark. Keeping the `dark` class in sync
// with data-theme is what makes notio's `dark:` variants (darkMode:"class") resolve for the active theme.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('ninety-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}var d=document.documentElement;d.setAttribute('data-theme',t);d.classList.toggle('dark',t!=='light');}catch(e){var d=document.documentElement;d.setAttribute('data-theme','dark');d.classList.add('dark');}})();`;

const TITLE = "Ninety — live football exchange";
const DESCRIPTION =
  "Trade live World Cup markets with play-money credits. Prices move with the match; Solana settles the result.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ninety-nu.vercel.app"),
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Ninety",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "The Ninety board — live World Cup 2026 markets" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  // The no-flash script sets data-theme + the `dark` class before paint; suppressHydrationWarning because it
  // mutates <html> before React hydrates. Default (SSR) markup carries `dark` so a no-JS render stays dark.
  return (
    <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <PrototypeRibbon />
        <OfflineBanner />
        <MatchLiveProvider>
          {/* One radix tooltip provider app-wide: sibling tooltips skip the open delay (the toolbar feels fast). */}
          <TooltipProvider>{children}</TooltipProvider>
        </MatchLiveProvider>
        <Toaster />
        {/* Dev-only visual editor — explicitly opt-in so it never renders in the demo, deploy, or screenshots. */}
        {process.env.NEXT_PUBLIC_CSS_STUDIO === "1" && <CssStudio />}
      </body>
    </html>
  );
}
