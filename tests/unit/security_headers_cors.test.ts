import { describe, it, expect } from "vitest";
import {
  applySecurityHeaders,
  handleCors,
  createSanitizedResponse,
} from "@/server/security-middleware";

describe("Security Headers, CORS & Error Sanitization Suite", () => {
  it("1. Applies defense-in-depth HTTP security headers", () => {
    const headers = applySecurityHeaders();
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
    expect(headers.get("Content-Security-Policy")).toContain("default-src 'self'");
  });

  it("2. Validates and permits allowed CORS origins", () => {
    const req = new Request("https://seedhaproperties.com/api/v2/properties", {
      headers: { origin: "https://seedhaproperties.com" },
    });
    const headers = handleCors(req);
    expect(headers.get("Access-Control-Allow-Origin")).toBe("https://seedhaproperties.com");
    expect(headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("3. Ignores untrusted third-party origins in CORS", () => {
    const req = new Request("https://seedhaproperties.com/api/v2/properties", {
      headers: { origin: "https://malicious-attacker-site.com" },
    });
    const headers = handleCors(req);
    expect(headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("4. Sanitizes internal 500 server errors from leaking raw details to clients", async () => {
    const rawErrorBody = {
      error: "PostgresConnectionError: password authentication failed for user 'postgres'",
      stack: "Error: at Connection.query (/app/node_modules/postgres.js:123:45)",
    };

    const res = createSanitizedResponse(rawErrorBody, 500);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("An unexpected error occurred. Please try again later.");
    expect(body.stack).toBeUndefined();
  });
});
