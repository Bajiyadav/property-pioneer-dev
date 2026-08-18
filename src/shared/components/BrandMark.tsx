import { BRAND } from "@/config/platform";
import logoImg from "@/assets/logo.png";

/**
 * Official logo mark for Seedha Properties.
 */
export function SeedhaLogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded-xl bg-white p-0.5 shadow-sm border border-slate-200/80 overflow-hidden ${className}`}
    >
      <img src={logoImg} alt="SEEDHA Properties Logo" className="h-full w-full object-contain" />
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
        ? "h-12 w-12"
        : "h-8 w-8 sm:h-10 sm:w-10";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 sm:gap-2.5 whitespace-nowrap ${className}`}
    >
      <SeedhaLogoIcon className={logoSizeClass} />

      {showName && (
        <div className="flex shrink-0 flex-col leading-none whitespace-nowrap">
          <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
            <span className="font-[family-name:var(--font-display)] font-extrabold tracking-tight text-foreground text-sm sm:text-lg lg:text-xl whitespace-nowrap">
              SEEDHA
            </span>
            <span className="font-[family-name:var(--font-display)] font-bold tracking-widest text-[#B8860B] dark:text-[#D4AF37] text-[11px] sm:text-xs sm:text-sm uppercase whitespace-nowrap">
              PROPERTIES
            </span>
          </div>
          <span className="hidden sm:block text-[8px] sm:text-[9px] font-bold tracking-wider text-muted-foreground uppercase mt-0.5 whitespace-nowrap">
            GA SEEDHA • PROPERTIES AAP KI
          </span>
        </div>
      )}
    </span>
  );
}
