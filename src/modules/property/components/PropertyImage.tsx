import React, { useState } from "react";
import { PropertyWatermark, type PropertyWatermarkProps } from "./PropertyWatermark";

export const DEFAULT_PROPERTY_COVER =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200";

export interface PropertyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
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
 * Universal Property Image Component for Seedha Properties.
 * Renders property photographs with automatic fallback handling,
 * responsive aspect ratio containers, and the official Seedha Properties branding watermark.
 */
export function PropertyImage({
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
}: PropertyImageProps) {
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
