import React, { useState } from "react";
import {
  PropertyWatermark,
  type PropertyWatermarkProps,
} from "@/modules/property/components/PropertyWatermark";

export const DEFAULT_PROPERTY_COVER =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200";

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
