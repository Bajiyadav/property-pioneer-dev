/**
 * Single source of truth for platform metadata, URLs, and SEO configuration.
 */

function getAppUrl(): string {
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "https://urbanproperties.in";
}

export const APP_URL = getAppUrl();
export const APP_NAME = "Urban Properties";
export const APP_SHORT_NAME = "UP";
export const APP_DESCRIPTION =
  "India's next-generation real estate platform for Rent, Buy, Commercial, Villas, Apartments & Plots in Tier-2, Tier-3 & Metro cities.";
export const APP_LOGO = `${APP_URL}/favicon.ico`;
/** Single source of truth for the footer copyright line shown on every page. */
export const APP_COPYRIGHT = `© 2022 ${APP_NAME}. All Rights Reserved.`;
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
