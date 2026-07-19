// The single route map — every click resolves through here, so nothing is a dead end (stub pages exist for all).
export const routes = {
  home: "/", // the landing — where a visitor arrives
  matches: "/board", // the board — where a trader goes
  board: "/board",
  competition: "/competition",
  bracket: "/bracket",
  portfolio: "/portfolio", // legacy — redirects to /account (the upgraded portfolio)
  account: "/account",
  play: "/play",
  leaders: "/leaderboard",
  moments: "/moments",
  history: "/history",
  howItWorks: "/how-it-works",
  docs: "/docs", // the in-app written reference (ADR: docs move in-house; GitBook demoted to a footer link)
  onboarding: "/onboarding",
  settings: "/settings",
  terminal: "/terminal",
  proofs: "/proofs",
  match: (id: string): string => `/match/${id}`,
  profile: (handle: string): string => `/profile/${handle.replace(/^@/, "")}`,
  moment: (id: string): string => `/moments/${id}`,
  player: (id: string): string => `/player/${id}`, // ADR-082 — only the baked top-20 exist; resolve via lib/entityLinks
  team: (code: string): string => `/team/${code.toUpperCase()}`, // ADR-083 — 48 nations + 10 clubs; resolve via lib/entityLinks
} as const;

// The written reference, hosted on GitBook (external). /how-it-works is the in-app visual explainer;
// docs is the deep read. They complement — not duplicate.
export const DOCS_URL = "https://sushi-2.gitbook.io/ninety-docs/";

export interface NavItem {
  label: string;
  href: string;
}

export const NAV: readonly NavItem[] = [
  { label: "Matches", href: routes.matches },
  { label: "Competition", href: routes.competition },
  { label: "Bracket", href: routes.bracket },
  { label: "Account", href: routes.account },
  { label: "Leaders", href: routes.leaders },
  { label: "Moments", href: routes.moments },
  { label: "History", href: routes.history },
];
