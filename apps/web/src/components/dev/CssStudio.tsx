"use client";
import { useEffect } from "react";

/**
 * CSS Studio — a DEV-ONLY in-browser CSS editor. Double-gated so it is NEVER shipped to end users:
 *  1) the parent renders this component only when NODE_ENV === "development" (statically stripped in prod), and
 *  2) the `cssstudio` package is dynamically imported inside a dev-guarded effect, so its code is never
 *     in the production bundle and never fetched outside dev.
 */
export function CssStudio() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    let cancelled = false;
    import("cssstudio")
      .then((m) => {
        if (!cancelled) m.startStudio?.();
      })
      .catch(() => {
        /* dev-only tool — never block the app if it fails to load */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
