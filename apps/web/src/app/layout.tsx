import "../styles/globals.css";
import type { Metadata } from "next";
import { Archivo, Inter, IBM_Plex_Mono } from "next/font/google";

// Self-hosted via next/font — reliable render (no FOUT / no system-font fallback that reads as "AI default").
const archivo = Archivo({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-ui", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Ninety — live football exchange",
  description: "Trade live World Cup markets with play-money credits. Prices move with the match; Solana settles the result.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
