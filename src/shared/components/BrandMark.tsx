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
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  responsiveName?: boolean;
  className?: string;
}) {
  const logoSizeClass = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <SeedhaLogoIcon className={logoSizeClass} />

      {showName && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-1.5">
            <span className="font-[family-name:var(--font-display)] font-extrabold tracking-tight text-foreground text-lg sm:text-xl">
              SEEDHA
            </span>
            <span className="font-[family-name:var(--font-display)] font-bold tracking-widest text-[#B8860B] dark:text-[#D4AF37] text-xs sm:text-sm uppercase">
              PROPERTIES
            </span>
          </div>
          <span className="text-[8px] sm:text-[9px] font-bold tracking-wider text-muted-foreground uppercase mt-0.5">
            GA SEEDHA • PROPERTIES AAP KI
          </span>
        </div>
      )}
    </span>
  );
}
