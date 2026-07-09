// The single route map — every click resolves through here, so nothing is a dead end (stub pages exist for all).
export const routes = {
  home: "/",
  matches: "/",
  competition: "/bracket",
  portfolio: "/portfolio",
  leaders: "/leaderboard",
  moments: "/moments",
  history: "/history",
  howItWorks: "/how-it-works",
  onboarding: "/onboarding",
  settings: "/settings",
  match: (id: string): string => `/match/${id}`,
  profile: (handle: string): string => `/profile/${handle.replace(/^@/, "")}`,
  moment: (id: string): string => `/moments/${id}`,
} as const;

export interface NavItem {
  label: string;
  href: string;
}

export const NAV: readonly NavItem[] = [
  { label: "Matches", href: routes.matches },
  { label: "Competition", href: routes.competition },
  { label: "Portfolio", href: routes.portfolio },
  { label: "Leaders", href: routes.leaders },
  { label: "Moments", href: routes.moments },
  { label: "History", href: routes.history },
];
