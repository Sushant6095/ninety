"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

/** Light/dark toggle (ADR-077). The no-flash script in layout.tsx sets the initial theme on <html> before paint;
 *  this reads it back on mount and flips it, keeping `data-theme` (drives the token layer), the `dark` class
 *  (drives notio's `dark:` variants) and localStorage("ninety-theme") in sync. Icon-only, 44px hit target. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");
    setMounted(true);
  }, []);

  const toggle = (): void => {
    const next: Theme = theme === "light" ? "dark" : "light";
    const root = document.documentElement;
    root.setAttribute("data-theme", next);
    root.classList.toggle("dark", next !== "light");
    try {
      localStorage.setItem("ninety-theme", next);
    } catch {
      // private mode / storage blocked — the in-session toggle still works, it just won't persist.
    }
    setTheme(next);
  };

  // Render the moon (dark's icon) as the pre-mount default so SSR + first paint match; swap once mounted.
  const isLight = mounted && theme === "light";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      title={isLight ? "Dark" : "Light"}
      className={`grid h-11 w-11 place-items-center rounded-full text-lo outline-none transition-colors duration-200 hover:bg-surface hover:text-hi focus-visible:ring-2 focus-visible:ring-up active:bg-hairline/40 ${className}`}
    >
      {isLight ? <Moon size={17} strokeWidth={2} aria-hidden /> : <Sun size={17} strokeWidth={2} aria-hidden />}
    </button>
  );
}
