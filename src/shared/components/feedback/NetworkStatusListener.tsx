import { useState, useEffect } from "react";
import { WifiOff, CheckCircle2, RefreshCw } from "lucide-react";

/**
 * NetworkStatusListener monitors browser online/offline status.
 *
 *  - When connection is lost: Displays an accessible, non-intrusive banner preserving current inputs.
 *  - When connection is restored: Displays "Back online — Refreshing..." and auto-dismisses after 3 seconds.
 */
export function NetworkStatusListener() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Auto-dismiss the recovered banner after 3.5 seconds
        const timer = setTimeout(() => setWasOffline(false), 3500);
        return () => clearTimeout(timer);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !wasOffline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] transition-all duration-300"
    >
      {!isOnline ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs sm:text-sm text-foreground backdrop-blur-md shadow-lg ring-1 ring-amber-500/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <WifiOff className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
            <span className="font-medium truncate">You are offline. Showing cached results.</span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 hover:underline flex-shrink-0"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs sm:text-sm text-foreground backdrop-blur-md shadow-lg ring-1 ring-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">Back online. Connection restored.</span>
        </div>
      )}
    </div>
  );
}
