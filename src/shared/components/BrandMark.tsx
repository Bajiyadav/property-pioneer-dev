import { useState } from "react";
import { BRAND } from "@/config/platform";
import urfLogo from "@/assets/urf-logo.png.asset.json";

/**
 * High-definition SVG Logo Mark for Urban Properties
 * Guaranteed to render instantly without network latency or missing asset errors.
 */
export function UrbanLogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div
      className={`relative flex-none flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-1.5 shadow-md ring-1 ring-white/20 text-white ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-full w-full drop-shadow-sm"
      >
        <path d="M3 21H21" />
        <path d="M6 21V9L12 4L18 9V21" />
        <path d="M9 14H15V21H9V14Z" fill="currentColor" fillOpacity="0.3" />
        <path d="M9 10H10" />
        <path d="M14 10H15" />
      </svg>
    </div>
  );
}

/**
 * Single source of truth for the Urban Properties identity in the UI.
 * Every surface (header, footer, empty/error states) renders through this
 * so the name and logo stay consistent and visible across all environments.
 */
export function BrandMark({
  size = "md",
  showName = true,
  responsiveName = false,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  responsiveName?: boolean;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  const logoSizeClass = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const imgLogoClass = size === "sm" ? "h-7 w-auto" : size === "lg" ? "h-11 w-auto" : "h-9 w-auto";
  const textClass =
    size === "sm"
      ? "text-base font-semibold"
      : size === "lg"
        ? "text-2xl font-bold"
        : "text-xl font-bold";

  const isLocalHostAsset = urfLogo?.url && urfLogo.url.startsWith("/__l5e/");

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {imgError || isLocalHostAsset ? (
        <UrbanLogoIcon className={logoSizeClass} />
      ) : (
        <img
          src={urfLogo.url}
          alt={`${BRAND.name} logo`}
          className={`${imgLogoClass} rounded-lg shadow-sm`}
          loading="eager"
          decoding="async"
          onError={() => setImgError(true)}
        />
      )}

      {showName &&
        (responsiveName ? (
          <>
            <span
              className={`hidden font-[family-name:var(--font-display)] tracking-tight text-foreground sm:inline ${textClass}`}
            >
              {BRAND.name}
            </span>
            <span
              className={`font-[family-name:var(--font-display)] tracking-tight text-foreground sm:hidden ${textClass}`}
            >
              {BRAND.shortName}
            </span>
          </>
        ) : (
          <span
            className={`font-[family-name:var(--font-display)] tracking-tight text-foreground ${textClass}`}
          >
            {BRAND.name}
          </span>
        ))}
    </span>
  );
}
