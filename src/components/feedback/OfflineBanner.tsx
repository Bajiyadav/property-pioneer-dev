/**
 * Seedha Properties — Non-Intrusive Offline Banner
 */

import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <aside
      role="alert"
      aria-live="polite"
      className="sticky top-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between gap-3 animate-in slide-in-from-top-2 transition-all duration-300"
    >
      <div className="flex items-center gap-2 max-w-5xl mx-auto flex-1">
        <WifiOff className="h-4 w-4 shrink-0 text-amber-950 animate-pulse" />
        <span className="font-extrabold">No internet connection.</span>
        <span className="hidden sm:inline text-amber-900">
          Please check your internet connection and try again.
        </span>
      </div>
      <button
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950 text-white text-[11px] font-bold shadow-xs hover:bg-black transition active:scale-95 shrink-0"
      >
        <RefreshCw className="h-3 w-3" />
        <span>Retry</span>
      </button>
    </aside>
  );
}
