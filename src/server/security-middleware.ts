/**
 * Seedha Properties - Server Security & Response Middleware
 * Enforces production security headers, CORS origin verification,
 * request correlation IDs, and sanitized error responses.
 */

import { logger } from "@/server/logger";

const ALLOWED_ORIGINS = [
  "https://seedhaproperties.com",
  "https://www.seedhaproperties.com",
  "https://staging.seedhaproperties.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:8085",
];

export function applySecurityHeaders(headers: Headers = new Headers()): Headers {
  // Prevent MIME type sniffing
  headers.set("X-Content-Type-Options", "nosniff");
  // Frame protection (Anti-Clickjacking)
  headers.set("X-Frame-Options", "DENY");
  // Referrer policy
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions Policy
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  // Strict Transport Security (HSTS) in production
  if (process.env.NODE_ENV === "production") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  // Content Security Policy
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-src https://challenges.cloudflare.com https://www.google.com;",
  );

  return headers;
}

export function handleCors(request: Request, headers: Headers = new Headers()): Headers {
  const origin = request.headers.get("origin");

  if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".seedhaproperties.com"))) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, X-Correlation-ID",
    );
  }

  return headers;
}

export function createSanitizedResponse(
  body: any,
  status: number = 200,
  request?: Request,
): Response {
  const headers = new Headers();
  applySecurityHeaders(headers);

  if (request) {
    handleCors(request, headers);
  }

  headers.set("Content-Type", "application/json; charset=utf-8");

  // Ensure internal error traces never leak to client in production
  if (status >= 500) {
    logger.error("Internal Server Error Sanitized", {
      status,
      originalError: body?.error || body?.message,
    });
    const safeBody = {
      ok: false,
      error: "An unexpected error occurred. Please try again later.",
      status,
    };
    return new Response(JSON.stringify(safeBody), { status, headers });
  }

  return new Response(JSON.stringify(body), { status, headers });
}
