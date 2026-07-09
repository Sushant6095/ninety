import path from "node:path";

/** @type {import('next').NextConfig} */
// devIndicators:false hides the dev-only floating build badge so local screenshots match production chrome.
export default {
  reactStrictMode: true,
  devIndicators: false,
  // Pin the monorepo root — Next otherwise mis-detects a stray ~/package-lock.json and traces the wrong tree.
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" }, // real country flags (cross-platform, replaces emoji)
      { protocol: "https", hostname: "i.pravatar.cc" }, // real avatar photos (deterministic per handle seed)
      { protocol: "https", hostname: "api.dicebear.com" }, // avatar fallback
    ],
  },
};
