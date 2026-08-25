import { BRAND } from "@/config/platform";
import logoImg from "@/assets/logo.png";

export interface PropertyWatermarkProps {
  /** Size variant tailored for thumbnails, standard cards, or high-res galleries */
  size?: "xs" | "sm" | "md" | "lg";
  /** Placement corner */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Additional custom classNames */
  className?: string;
}

/**
 * Authentic, premium watermark badge for Seedha Properties real-estate photos.
 * Ensures consistent, non-intrusive brand attribution across all device viewports.
 * Pointer-events are disabled so it never blocks clicks, gestures, or overlays.
 */
export function PropertyWatermark({
  size = "md",
  position = "bottom-right",
  className = "",
}: PropertyWatermarkProps) {
  // Position utilities
  const positionClasses = {
    "bottom-right": "bottom-2.5 right-2.5 sm:bottom-3 sm:right-3",
    "bottom-left": "bottom-2.5 left-2.5 sm:bottom-3 sm:left-3",
    "top-right": "top-2.5 right-2.5 sm:top-3 sm:right-3",
    "top-left": "top-2.5 left-2.5 sm:top-3 sm:left-3",
  }[position];

  // Size styling tokens
  const sizeConfig = {
    xs: {
      padding: "px-1.5 py-0.5 gap-1",
      iconSize: "h-2.5 w-2.5",
      textSize: "text-[8px] font-bold tracking-wider",
      rounded: "rounded",
    },
    sm: {
      padding: "px-2 py-0.5 gap-1.5",
      iconSize: "h-3 w-3",
      textSize: "text-[9px] sm:text-[10px] font-bold tracking-wider",
      rounded: "rounded-md",
    },
    md: {
      padding: "px-2.5 py-1 gap-1.5",
      iconSize: "h-3.5 w-3.5",
      textSize: "text-[10px] sm:text-[11px] font-bold tracking-wider",
      rounded: "rounded-lg",
    },
    lg: {
      padding: "px-3.5 py-1.5 gap-2",
      iconSize: "h-4 w-4",
      textSize: "text-xs sm:text-sm font-extrabold tracking-wider",
      rounded: "rounded-xl",
    },
  }[size];

  return (
    <div
      aria-hidden="true"
      className={`absolute z-10 pointer-events-none select-none inline-flex items-center ${sizeConfig.padding} ${sizeConfig.rounded} ${positionClasses} bg-black/60 text-white shadow-md backdrop-blur-md border border-white/20 ring-1 ring-black/20 transition-opacity duration-300 ${className}`}
    >
      {/* Brand logo image */}
      <div
        className={`flex-none flex items-center justify-center rounded-sm bg-white p-0.5 shadow-sm overflow-hidden ${sizeConfig.iconSize}`}
      >
        <img src={logoImg} alt="SEEDHA Properties" className="h-full w-full object-contain" />
      </div>

      {/* Brand Label */}
      <span
        className={`font-[family-name:var(--font-display)] uppercase text-white/95 drop-shadow-sm whitespace-nowrap ${sizeConfig.textSize}`}
      >
        {BRAND.name}
      </span>
    </div>
  );
}
