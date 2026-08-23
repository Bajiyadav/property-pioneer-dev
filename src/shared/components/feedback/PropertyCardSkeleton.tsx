import React from "react";

export interface PropertyCardSkeletonProps {
  count?: number;
  viewMode?: "grid" | "list";
}

export function PropertyCardSkeleton({ count = 3, viewMode = "grid" }: PropertyCardSkeletonProps) {
  return (
    <div
      role="progressbar"
      aria-busy="true"
      aria-label="Loading property listings"
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          : "flex flex-col gap-4"
      }
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm animate-pulse"
        >
          {/* Media Header Skeleton */}
          <div className="relative aspect-[16/10] w-full bg-muted" />

          {/* Body Content Skeleton */}
          <div className="flex flex-1 flex-col p-4 sm:p-5 space-y-3">
            {/* Price & Tag */}
            <div className="flex items-center justify-between">
              <div className="h-6 w-28 rounded-md bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
            </div>

            {/* Title */}
            <div className="h-5 w-3/4 rounded-md bg-muted" />

            {/* Address / Location */}
            <div className="h-4 w-1/2 rounded-md bg-muted/70" />

            {/* Feature Pills */}
            <div className="flex items-center gap-2 pt-1">
              <div className="h-6 w-16 rounded-md bg-muted/60" />
              <div className="h-6 w-20 rounded-md bg-muted/60" />
              <div className="h-6 w-16 rounded-md bg-muted/60" />
            </div>

            {/* Bottom Footer Actions */}
            <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-3">
              <div className="h-4 w-24 rounded bg-muted/50" />
              <div className="h-8 w-24 rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
