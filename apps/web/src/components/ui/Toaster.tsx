"use client";
import { Toaster as Sonner } from "sonner";

/** Global toast surface — Sonner re-skinned to Ninety tokens via its own theming vars (no default look).
 *  Success borders --up, errors --down; surface + hairline everywhere else. Numbers/text in Inter. */
export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-center"
      gap={8}
      toastOptions={{ style: { fontFamily: "var(--font-ui)" } }}
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--text-hi)",
          "--normal-border": "var(--hairline)",
          "--success-bg": "var(--surface)",
          "--success-text": "var(--text-hi)",
          "--success-border": "var(--up)",
          "--error-bg": "var(--surface)",
          "--error-text": "var(--text-hi)",
          "--error-border": "var(--down)",
          "--border-radius": "16px",
        } as React.CSSProperties
      }
    />
  );
}
