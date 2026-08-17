/**
 * Single source of truth for platform metadata, URLs, and SEO configuration.
 */

function getAppUrl(): string {
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "https://seedhaproperties.com";
}

export const APP_URL = getAppUrl();
export const APP_NAME = "Seedha Properties";
export const APP_SHORT_NAME = "Seedha";
export const APP_DESCRIPTION =
  "Rent, buy and commercial property in Hyderabad, listed directly by owners and reviewed before publication. No platform commission.";
export const APP_LOGO = `${APP_URL}/favicon.ico`;
/** Single source of truth for the footer copyright line shown on every page. */
/**
 * Derived from the current year rather than hard-coded. It read "© 2022",
 * which is both wrong and a staleness signal to anyone reading the footer.
 */
export const APP_COPYRIGHT = `© ${new Date().getFullYear()} ${APP_NAME}. All Rights Reserved.`;
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
