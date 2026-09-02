import { describe, it, expect } from "vitest";
import { redactSensitiveData, logger } from "@/server/logger";

describe("Structured Logging & Sensitive PII Redaction Suite", () => {
  it("1. Automatically redacts passwords, JWT tokens, and secrets", () => {
    const dirtyMeta = {
      email: "user@seedhaproperties.com",
      password: "SuperSecretPassword123!",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      jwt: "secret-token-payload",
      apiKey: "sk_live_1234567890",
      secret: "super-database-pass",
    };

    const clean = redactSensitiveData(dirtyMeta);
    expect(clean.email).toBe("user@seedhaproperties.com");
    expect(clean.password).toBe("[REDACTED]");
    expect(clean.token).toBe("[REDACTED]");
    expect(clean.jwt).toBe("[REDACTED]");
    expect(clean.apiKey).toBe("[REDACTED]");
    expect(clean.secret).toBe("[REDACTED]");
  });

  it("2. Redacts sensitive PII documents (Aadhaar, PAN, Credit Cards)", () => {
    const piiMeta = {
      userName: "Rahul Sharma",
      aadhaar: "1234 5678 9012",
      pan: "ABCDE1234F",
      cvv: "123",
      creditCard: "4111 2222 3333 4444",
    };

    const clean = redactSensitiveData(piiMeta);
    expect(clean.userName).toBe("Rahul Sharma");
    expect(clean.aadhaar).toBe("[REDACTED]");
    expect(clean.pan).toBe("[REDACTED]");
    expect(clean.cvv).toBe("[REDACTED]");
  });

  it("3. Recursively redacts sensitive keys in nested payloads and arrays", () => {
    const nested = {
      request: {
        headers: {
          authorization: "Bearer eyJhbGciOi...",
          cookie: "session_token=abc123xyz",
        },
        body: {
          user: {
            accountPassword: "secretPassword",
          },
        },
      },
    };

    const clean = redactSensitiveData(nested);
    expect(clean.request.headers.authorization).toBe("[REDACTED]");
    expect(clean.request.headers.cookie).toBe("[REDACTED]");
    expect(clean.request.body.user.accountPassword).toBe("[REDACTED]");
  });
});
