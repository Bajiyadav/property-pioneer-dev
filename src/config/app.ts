/**
 * Single source of truth for platform metadata, URLs, and SEO configuration.
 */

function getAppUrl(): string {
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "https://urbanrentalflats.in";
}

export const APP_URL = getAppUrl();
export const APP_NAME = "Urban Rental Flats";
export const APP_SHORT_NAME = "URF";
export const APP_DESCRIPTION =
  "Curated rentals and homes for sale across India. Search by city, price, and bedrooms.";
export const APP_LOGO = `${APP_URL}/favicon.ico`;
export const APP_OG_IMAGE = `${APP_URL}/hero.jpg`;

export function getCanonicalUrl(path: string = ""): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${APP_URL}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export function getOgImageUrl(imagePath?: string): string {
  if (!imagePath) return APP_OG_IMAGE;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const normalizedPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${APP_URL}${normalizedPath}`;
}
