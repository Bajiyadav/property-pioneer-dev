import React from "react";
import { Sparkles, CheckCircle2, ChevronDown } from "lucide-react";
import type { MatchBreakdown } from "../types";

interface PropertyMatchingScoreProps {
  score: number;
  breakdown?: MatchBreakdown;
  size?: "sm" | "md" | "lg";
  showBreakdown?: boolean;
}

export function PropertyMatchingScore({
  score,
  breakdown,
  size = "md",
  showBreakdown = false,
}: PropertyMatchingScoreProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Color theme based on score
  const isHigh = score >= 85;
  const isMedium = score >= 70 && score < 85;

  const bgBadge = isHigh
    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
    : isMedium
      ? "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300"
      : "bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300";

  const dotColor = isHigh
    ? "bg-emerald-500 shadow-emerald-500/50"
    : isMedium
      ? "bg-amber-500 shadow-amber-500/50"
      : "bg-blue-500 shadow-blue-500/50";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-bold gap-1 rounded-full",
    md: "px-3 py-1 text-xs sm:text-sm font-extrabold gap-1.5 rounded-xl",
    lg: "px-4 py-2 text-sm sm:text-base font-black gap-2 rounded-2xl",
  }[size];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => breakdown && setIsOpen(!isOpen)}
        className={`inline-flex items-center border transition-all ${bgBadge} ${sizeClasses} shadow-xs ${breakdown ? "hover:scale-[1.03] cursor-pointer" : "cursor-default"}`}
      >
        <span className={`w-2 h-2 rounded-full ${dotColor} shadow-sm animate-pulse`} />
        <span>{score}% Match</span>
        {breakdown && <ChevronDown className="h-3 w-3 opacity-70" />}
      </button>

      {/* Popover Breakdown */}
      {isOpen && breakdown && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-2xl bg-card border border-border/80 p-4 shadow-xl text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Match Breakdown
            </span>
            <span className="text-xs font-black text-primary">{score}% Total</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">📍 Location (30%):</span>
              <span className="font-bold text-foreground">{breakdown.locationMatch}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">💰 Budget (30%):</span>
              <span className="font-bold text-foreground">{breakdown.budgetMatch}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">🛏️ BHK Match (25%):</span>
              <span className="font-bold text-foreground">{breakdown.bhkMatch}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">✨ Amenities (15%):</span>
              <span className="font-bold text-foreground">{breakdown.amenityMatch}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
