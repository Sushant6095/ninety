"use client";
import { useEffect, useState } from "react";

/** Global connection banner — shows on every screen when the browser goes offline (prices pause). Quiet, token
 *  styled (not amber — amber is halts only), announced politely for screen readers. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 top-0 z-50 border-b border-hairline bg-surface px-4 py-2 text-center elev">
      <span className="text-caption text-hi">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-down align-middle" aria-hidden />
        You&#39;re offline — prices are paused. Reconnecting…
      </span>
    </div>
  );
}
