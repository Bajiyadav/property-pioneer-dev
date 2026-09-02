/**
 * Seedha Properties - Security Sanitization & XSS Defense Primitives
 * Strips script tags, invalid URI schemes, and encodes dangerous characters in user input.
 */

const DANGEROUS_URI_PROTOCOLS = [
  "javascript:",
  "vbscript:",
  "data:text/html",
  "data:application/javascript",
];

/**
 * Strips any HTML tags completely from user text.
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

/**
 * Escapes HTML characters for safe text insertion into markup.
 */
export function escapeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validates external or user-submitted URLs to block `javascript:` or malicious URI protocol schemes.
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim().toLowerCase();
  for (const protocol of DANGEROUS_URI_PROTOCOLS) {
    if (trimmed.startsWith(protocol)) {
      return "about:blank";
    }
  }
  return url.trim();
}

/**
 * Deeply sanitizes an object's string properties recursively.
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === "string" ? stripHtml(item) : sanitizeObject(item),
    ) as any;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = stripHtml(value);
    } else if (value !== null && typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}
