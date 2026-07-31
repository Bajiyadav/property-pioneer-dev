import { BRAND } from "@/config/platform";
import urfLogo from "@/assets/urf-logo.png.asset.json";

/**
 * Single source of truth for the Urban Rental Flats identity in the UI.
 * Every surface (header, footer, empty/error states) renders through this
 * so the name and logo stay consistent as new modules are added.
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
  const logoClass = size === "sm" ? "h-7 w-auto" : size === "lg" ? "h-12 w-auto" : "h-9 w-auto";
  const textClass =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={urfLogo.url}
        alt={`${BRAND.name} logo`}
        className={logoClass}
        loading="lazy"
        decoding="async"
      />
      {showName &&
        (responsiveName ? (
          <>
            <span
              className={`hidden font-[family-name:var(--font-display)] font-semibold tracking-tight text-foreground sm:inline ${textClass}`}
            >
              {BRAND.name}
            </span>
            <span
              className={`font-[family-name:var(--font-display)] font-semibold tracking-tight text-foreground sm:hidden ${textClass}`}
            >
              {BRAND.shortName}
            </span>
          </>
        ) : (
          <span
            className={`font-[family-name:var(--font-display)] font-semibold tracking-tight text-foreground ${textClass}`}
          >
            {BRAND.name}
          </span>
        ))}
    </span>
  );
}
