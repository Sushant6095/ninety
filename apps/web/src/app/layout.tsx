import "../styles/globals.css";
import type { Metadata } from "next";
import { Archivo, Inter, IBM_Plex_Mono } from "next/font/google";
import { OfflineBanner } from "../components/ui/OfflineBanner";
import { PrototypeRibbon } from "../components/ui/PrototypeRibbon";
import { Toaster } from "../components/ui/Toaster";
import { CssStudio } from "../components/dev/CssStudio";
import { MatchLiveProvider } from "../features/live/MatchLiveProvider";
import { TooltipProvider } from "../components/ui/Tooltip";

// Self-hosted via next/font — reliable render (no FOUT / no system-font fallback that reads as "AI default").
const archivo = Archivo({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-ui", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

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
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable} ${plexMono.variable}`}>
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
