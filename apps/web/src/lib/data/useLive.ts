"use client";
// CONNECT (Phase 2) — the client-side live/fixture switch. A client component calls useLive(fetcher, fallback):
// - NEXT_PUBLIC_USE_FIXTURES=1 → returns `fallback` (the baked fixture) immediately, no network. Offline demo.
// - otherwise → renders `fallback` first (no blank flash / SSR-safe), fetches live, swaps in on success. On a
//   live error it KEEPS the fallback and exposes `error` — the surface degrades to the fixture, never to blank.
// This is the client mirror of the server path (server components just `await` the lib/data function).
import { useEffect, useState } from "react";
import { USE_FIXTURES } from "../api";

export interface LiveState<T> {
  data: T;
  loading: boolean;
  error: unknown;
}

export function useLive<T>(fetcher: () => Promise<T>, fallback: T, deps: readonly unknown[] = []): LiveState<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState<boolean>(!USE_FIXTURES);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (USE_FIXTURES) return; // fixture already seeded into state; no fetch
    let alive = true;
    setLoading(true);
    fetcher()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e); // keep the fixture fallback; surface the error
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
