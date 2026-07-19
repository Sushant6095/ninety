import path from "node:path";

/** @type {import('next').NextConfig} */
// devIndicators:false hides the dev-only floating build badge so local screenshots match production chrome.
export default {
  reactStrictMode: true,
  devIndicators: false,
  // Local monorepo dev pins the workspace root (Next otherwise mis-detects a stray ~/package-lock.json);
  // a standalone Vercel deploy uploads only apps/web, so root at the app itself there.
  outputFileTracingRoot: process.env.VERCEL ? import.meta.dirname : path.join(import.meta.dirname, "../.."),
  images: {
    // Avatars are now local deterministic identicons (components/ui/Avatar.tsx) — no third-party avatar CDN,
    // no photos of people who do not exist. Nothing else fetches a remote image, so the allowlist is empty.
    remotePatterns: [],
  },
  // CONNECT (Phase 2): same-origin proxy so BROWSER (client-component) fetches to the API avoid CORS — the API
  // has no CORS headers, so a direct :3000→:4000 fetch is blocked and would silently fall back to fixtures.
  // Client calls "/api/*" (same origin) → rewritten to the API. Server components fetch the API directly (no CORS).
  // Target is env-driven so a Vercel deploy points at the deployed API.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET ?? "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${target}/:path*` }];
  },
};
