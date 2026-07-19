import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DocsShell } from "../../features/docs/DocsShell";

export const metadata: Metadata = {
  title: "Docs — Ninety",
  description: "How Ninety works, how it's built, and where it's going. A live, play-money football exchange for the FIFA World Cup 2026.",
};

// The /docs section shell (ADR: docs move in-house). Server layout; DocsShell owns the interactive chrome.
export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
