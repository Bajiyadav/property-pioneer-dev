import { BRAND } from "@/config/platform";
import logoImg from "@/assets/logo.png";

/**
 * Official logo mark for Seedha Properties.
 */
export function SeedhaLogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div
      className={`relative flex-none flex items-center justify-center rounded-xl bg-white p-0.5 shadow-sm border border-slate-200/80 overflow-hidden ${className}`}
    >
      <img src={logoImg} alt="SEEDHA Properties Logo" className="h-full w-full object-contain" />
    </div>
  );
}

/**
 * Single source of truth for the Seedha Properties identity in the UI.
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
  const logoSizeClass = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const textClass =
    size === "sm"
      ? "text-base font-semibold"
      : size === "lg"
        ? "text-2xl font-bold"
        : "text-xl font-bold";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <SeedhaLogoIcon className={logoSizeClass} />

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
