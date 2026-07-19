"use client";
// The ONE per-user identity. Offline-first: no API, no shared global user — a real id lives in this browser's
// localStorage, so two browsers are two people. A brand-new visitor is HONEST: 1000 credits, no rank, no
// positions, no activity. Nothing is fabricated; every empty state below reads from this, not from a fixture.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Position } from "../../lib/types";

const STORAGE_KEY = "ninety.session.v1";
const START_CREDITS = 1000;

export interface Session {
  id: string; // crypto.randomUUID(), persisted to localStorage (STORAGE_KEY)
  handle: string; // human-readable, derived deterministically from id (see handleFromId)
  credits: number; // brand-new user = 1000
  rank: number | null; // brand-new user = null (no rank yet — never a fabricated number)
  positions: Position[]; // brand-new user = []
  hasActivity: boolean; // false for a fresh user — drives the honest empty states
}

// ONE @-convention: the handle STRING always carries a leading "@", exactly like every seeded handle
// (@pitchwizard, …) and what lib/routes expects (routes.profile strips the "@" for the URL). Render
// {session.handle} anywhere and NEVER prefix a second "@". First 4 hex of the id keep it short + stable.
function handleFromId(id: string): string {
  const hex = id.replace(/[^0-9a-f]/gi, "").slice(0, 4) || "0000";
  return `@trader-${hex}`;
}

function freshSession(id: string): Session {
  return { id, handle: handleFromId(id), credits: START_CREDITS, rank: null, positions: [], hasActivity: false };
}

// Stable placeholder for SSR + the FIRST client render (localStorage doesn't exist on the server). Same shape,
// a neutral handle → server HTML === first client paint (no hydration mismatch); the real id/handle load in the
// mount effect below. id "" marks "not yet read".
const PLACEHOLDER: Session = {
  id: "",
  handle: "@trader",
  credits: START_CREDITS,
  rank: null,
  positions: [],
  hasActivity: false,
};

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // ponytail: fallback only for ancient/no-crypto runtimes; a random string is fine — this id is a local handle seed, not a secret.
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Read the persisted id, or mint + persist a new one. Only the id is stored (handle derives from it; credits /
// rank / positions are the fresh constants) — so a re-visit is the SAME person, and sign-out is a new person.
function readOrCreate(): Session {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    if (id) return freshSession(id);
    const fresh = newId();
    localStorage.setItem(STORAGE_KEY, fresh);
    return freshSession(fresh);
  } catch {
    // storage blocked (private mode / disabled) — an in-memory identity still works for the session.
    return freshSession(newId());
  }
}

const SessionCtx = createContext<Session>(PLACEHOLDER);
const SignOutCtx = createContext<() => void>(() => {});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(PLACEHOLDER);

  useEffect(() => {
    setSession(readOrCreate());
  }, []);

  // Clear the stored identity and immediately issue a fresh one (new id → new handle → clean 1000-credit slate).
  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage blocked — the fresh session below is still issued in memory */
    }
    setSession(readOrCreate());
  }, []);

  return (
    <SignOutCtx.Provider value={signOut}>
      <SessionCtx.Provider value={session}>{children}</SessionCtx.Provider>
    </SignOutCtx.Provider>
  );
}

/** The current per-user session. SSR-safe: a stable placeholder until the mount effect reads localStorage. */
export function useSession(): Session {
  return useContext(SessionCtx);
}

/** Clears the session and issues a fresh identity. */
export function useSignOut(): () => void {
  return useContext(SignOutCtx);
}
