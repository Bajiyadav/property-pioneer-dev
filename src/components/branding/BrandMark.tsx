import { BRAND } from "@/config/platform";
import logoImg from "@/assets/logo.png";

/**
 * Official logo mark for Seedha Properties.
 */
export function SeedhaLogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded-xl bg-[#0a1220] p-0.5 shadow-xs border border-amber-500/30 overflow-hidden animate-float-forward transition-transform duration-300 hover:scale-110 ${className}`}
    >
      <img
        src={logoImg}
        alt="SEEDHA Properties Logo"
        className="h-full w-full object-cover rounded-lg"
      />
    </div>
  );
}

/**
 * Single source of truth for the Seedha Properties identity in the UI.
 * Every surface (header, footer, empty/error states) renders through this
 * so the name and logo stay consistent, horizontal, and visible across all environments.
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
  const logoSizeClass =
    size === "sm"
      ? "h-7 w-7 sm:h-8 sm:w-8"
      : size === "lg"
        ? "h-11 w-11 sm:h-12 sm:w-12"
        : "h-8 w-8 sm:h-9 sm:w-9";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 sm:gap-2.5 whitespace-nowrap select-none ${className}`}
    >
      <SeedhaLogoIcon className={logoSizeClass} />

      {showName && (
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 leading-none whitespace-nowrap">
          <span className="font-[family-name:var(--font-display)] font-extrabold tracking-tight text-foreground text-sm sm:text-base lg:text-lg whitespace-nowrap">
            SEEDHA
          </span>
          <span
            className={`font-[family-name:var(--font-display)] font-bold tracking-widest text-[#B8860B] dark:text-[#D4AF37] text-[11px] sm:text-xs uppercase whitespace-nowrap ${
              responsiveName ? "hidden xs:inline-block sm:inline-block" : ""
            }`}
          >
            PROPERTIES
          </span>
        </div>
      )}
    </span>
  );
}
