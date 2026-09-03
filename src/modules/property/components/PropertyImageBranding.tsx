import React, { useState } from "react";
import {
  PropertyWatermark,
  type PropertyWatermarkProps,
} from "@/modules/property/components/PropertyWatermark";

export const DEFAULT_PROPERTY_COVER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='800' height='600' fill='%231e293b'/><circle cx='400' cy='250' r='80' fill='%23334155'/><path d='M400 195 L345 250 H370 V305 H430 V250 H455 Z' fill='%2310b981'/><text x='400' y='375' font-family='sans-serif' font-size='22' font-weight='800' fill='%23f8fafc' text-anchor='middle'>SEEDHA PROPERTIES</text><text x='400' y='410' font-family='sans-serif' font-size='14' font-weight='600' fill='%2394a3b8' text-anchor='middle'>100% Direct Owner • Zero Brokerage</text></svg>";

export interface PropertyImageBrandingProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  watermarkSize?: PropertyWatermarkProps["size"];
  watermarkPosition?: PropertyWatermarkProps["position"];
  showWatermark?: boolean;
  watermarkClassName?: string;
  aspectRatio?: string;
  containerClassName?: string;
  imageClassName?: string;
}

/**
 * Universal Property Image Branding Component for Seedha Properties.
 * Renders property photography with automatic error fallbacks, responsive containers,
 * and the official Seedha Properties branding watermark overlay.
 *
 * Designed to be non-intrusive, responsive, and pointer-events safe so it never interferes
 * with clicks or touch gestures.
 */
export function PropertyImageBranding({
  src,
  alt,
  fallbackSrc = DEFAULT_PROPERTY_COVER,
  watermarkSize = "md",
  watermarkPosition = "bottom-right",
  showWatermark = true,
  watermarkClassName = "",
  aspectRatio,
  containerClassName = "",
  imageClassName = "",
  loading = "lazy",
  ...imgProps
}: PropertyImageBrandingProps) {
  const [imgError, setImgError] = useState(false);

  const displaySrc = !src || imgError ? fallbackSrc : src;

  return (
    <div
      className={`relative overflow-hidden bg-muted ${aspectRatio ? aspectRatio : ""} ${containerClassName}`}
    >
      <img
        src={displaySrc}
        alt={alt || "Seedha Properties Listing"}
        loading={loading}
        decoding="async"
        onError={() => setImgError(true)}
        className={`h-full w-full object-cover ${imageClassName}`}
        {...imgProps}
      />
      {showWatermark && (
        <PropertyWatermark
          size={watermarkSize}
          position={watermarkPosition}
          className={watermarkClassName}
        />
      )}
    </div>
  );
}

// Re-export as PropertyImage for backwards compatibility
export { PropertyImageBranding as PropertyImage };
