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
export const GLOBAL_TITLE = "Seedha Properties";
export const APP_DESCRIPTION =
  "Explore properties and connect with property owners through a simple, direct platform.";
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

export function generatePropertySlug(property: {
  id: string;
  title?: string | null;
  bedrooms?: number | null;
  property_type?: string | null;
  listing_type?: string | null;
  locality?: string | null;
  city?: string | null;
}): string {
  const clean = (v: string) =>
    v
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const parts: string[] = [];

  if (property.bedrooms) {
    parts.push(`${property.bedrooms}-bhk`);
  }

  if (property.property_type) {
    parts.push(clean(property.property_type));
  } else {
    parts.push("property");
  }

  parts.push(property.listing_type === "sale" ? "for-sale" : "for-rent");

  if (property.locality) {
    parts.push(clean(property.locality));
  }

  if (property.city) {
    parts.push(clean(property.city));
  } else {
    parts.push("hyderabad");
  }

  const baseSlug = parts.join("-").replace(/-+/g, "-");
  return `${baseSlug}-${property.id}`;
}

export function extractIdFromSlug(paramId: string): string {
  if (!paramId) return "";

  // A UUID ends with a hyphen followed by 36 characters matching the UUID regex
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const uuidMatch = paramId.match(uuidRegex);
  if (uuidMatch) {
    return uuidMatch[0];
  }

  // A fallback ID ends with a hyphen followed by 3 letters and 3 digits: e.g. -hyd-001 or -blr-002
  const fallbackRegex = /[a-z]{3}-[0-9]{3}$/i;
  const fallbackMatch = paramId.match(fallbackRegex);
  if (fallbackMatch) {
    return fallbackMatch[0];
  }

  // If there's no slug prefix, paramId is just the ID itself (e.g. "hyd-000" or a raw UUID)
  return paramId;
}
