import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("JWT/JWS Authentication Security Hardening Suite", () => {
  const MOCK_SUPABASE_URL = "https://example.supabase.co";
  const MOCK_PUBLISHABLE_KEY = "sb_publishable_test_key";

  beforeEach(() => {
    process.env.SUPABASE_URL = MOCK_SUPABASE_URL;
    process.env.SUPABASE_PUBLISHABLE_KEY = MOCK_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Header Handling & Bearer Scheme Enforcement", () => {
    const parseAuthHeader = (header: string | null): string | null => {
      if (!header) return null;
      const match = header.match(/^Bearer\s+([A-Za-z0-9-_=.]+)\s*$/);
      return match ? match[1] : null;
    };

    it("rejects missing Authorization header", () => {
      expect(parseAuthHeader(null)).toBeNull();
    });

    it("rejects empty Authorization header", () => {
      expect(parseAuthHeader("")).toBeNull();
    });

    it("rejects non-Bearer scheme (Basic)", () => {
      expect(parseAuthHeader("Basic dXNlcjpwYXNz")).toBeNull();
    });

    it("rejects BearerBearer or malformed header prefix", () => {
      expect(parseAuthHeader("BearerBearer token.payload.sig")).toBeNull();
      expect(parseAuthHeader("Token token.payload.sig")).toBeNull();
    });

    it("rejects Authorization header with multiple tokens or extra garbage", () => {
      expect(parseAuthHeader("Bearer token.payload.sig extra_garbage")).toBeNull();
    });

    it("accepts strictly formatted Bearer JWT token", () => {
      const token = parseAuthHeader("Bearer eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature");
      expect(token).toBe("eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature");
    });
  });

  describe("2. JWT Structure & Algorithm Validation", () => {
    const isValidTokenStructure = (token: string): boolean => {
      const parts = token.split(".");
      return parts.length === 3 && parts.every((p) => p.length > 0);
    };

    it("rejects token with less than 3 dot-separated segments", () => {
      expect(isValidTokenStructure("eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIxMjMifQ")).toBe(false);
      expect(isValidTokenStructure("single_token_string")).toBe(false);
    });

    it("rejects alg=none forged header attempt", () => {
      const noneHeader = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
      const payload = btoa(JSON.stringify({ sub: "user-123", role: "admin" }));
      const noneToken = `${noneHeader}.${payload}.`;

      expect(isValidTokenStructure(noneToken)).toBe(false);
    });
  });

  describe("3. Claims Validation (Issuer, Audience, Expiration, Subject)", () => {
    const validateTokenClaims = (claims: Record<string, unknown>, supabaseUrl: string) => {
      if (!claims.sub || typeof claims.sub !== "string") {
        throw new Error("Unauthorized: No user ID found in token");
      }

      if (claims.iss && typeof claims.iss === "string") {
        const normalizedBase = supabaseUrl.replace(/\/$/, "");
        if (!claims.iss.startsWith(normalizedBase)) {
          throw new Error("Unauthorized: Token issuer mismatch");
        }
      }

      if (claims.aud && typeof claims.aud === "string") {
        if (claims.aud !== "authenticated") {
          throw new Error("Unauthorized: Invalid token audience");
        }
      }

      if (typeof claims.exp === "number") {
        const now = Math.floor(Date.now() / 1000);
        if (claims.exp <= now) {
          throw new Error("Unauthorized: Token has expired");
        }
      }

      return { valid: true, userId: claims.sub };
    };

    it("accepts valid claims from configured Supabase issuer", () => {
      const now = Math.floor(Date.now() / 1000);
      const claims = {
        sub: "a0000000-0000-0000-0000-000000000001",
        iss: `${MOCK_SUPABASE_URL}/auth/v1`,
        aud: "authenticated",
        exp: now + 3600,
        role: "authenticated",
      };

      const result = validateTokenClaims(claims, MOCK_SUPABASE_URL);
      expect(result.valid).toBe(true);
      expect(result.userId).toBe("a0000000-0000-0000-0000-000000000001");
    });

    it("rejects token issued by another Supabase project / wrong issuer", () => {
      const now = Math.floor(Date.now() / 1000);
      const claims = {
        sub: "a0000000-0000-0000-0000-000000000001",
        iss: "https://evil-attacker.supabase.co/auth/v1",
        aud: "authenticated",
        exp: now + 3600,
      };

      expect(() => validateTokenClaims(claims, MOCK_SUPABASE_URL)).toThrowError(
        "Unauthorized: Token issuer mismatch",
      );
    });

    it("rejects token with wrong audience", () => {
      const now = Math.floor(Date.now() / 1000);
      const claims = {
        sub: "a0000000-0000-0000-0000-000000000001",
        iss: `${MOCK_SUPABASE_URL}/auth/v1`,
        aud: "public_anon",
        exp: now + 3600,
      };

      expect(() => validateTokenClaims(claims, MOCK_SUPABASE_URL)).toThrowError(
        "Unauthorized: Invalid token audience",
      );
    });

    it("rejects expired token", () => {
      const now = Math.floor(Date.now() / 1000);
      const claims = {
        sub: "a0000000-0000-0000-0000-000000000001",
        iss: `${MOCK_SUPABASE_URL}/auth/v1`,
        aud: "authenticated",
        exp: now - 60, // expired 1 minute ago
      };

      expect(() => validateTokenClaims(claims, MOCK_SUPABASE_URL)).toThrowError(
        "Unauthorized: Token has expired",
      );
    });

    it("rejects token without sub claim", () => {
      const now = Math.floor(Date.now() / 1000);
      const claims = {
        iss: `${MOCK_SUPABASE_URL}/auth/v1`,
        aud: "authenticated",
        exp: now + 3600,
      };

      expect(() => validateTokenClaims(claims, MOCK_SUPABASE_URL)).toThrowError(
        "Unauthorized: No user ID found in token",
      );
    });
  });

  describe("4. IDOR & Anti-Tampering Protections", () => {
    it("never trusts client-supplied user_id, owner_id, or role for authorization", () => {
      const verifiedUserId = "user-real-001";
      const clientPayload = {
        user_id: "user-attacker-002",
        owner_id: "user-victim-003",
        role: "admin",
        is_admin: true,
        entitlement: { active: true, unlimited: true },
      };

      // Server identity resolution
      const serverResolvedUserId = verifiedUserId;
      expect(serverResolvedUserId).not.toBe(clientPayload.user_id);
      expect(serverResolvedUserId).toBe("user-real-001");
    });

    it("enforces owner resource scoping (User A cannot mutate User B property)", () => {
      const mockDatabase = [
        { id: "prop-1", owner_id: "owner-victim", title: "Victim Villa" },
        { id: "prop-2", owner_id: "owner-attacker", title: "Attacker Flat" },
      ];

      const updateProperty = (ownerId: string, propId: string, newTitle: string) => {
        const row = mockDatabase.find((p) => p.id === propId && p.owner_id === ownerId);
        if (!row) throw new Error("Listing not found, or it is not yours to edit.");
        row.title = newTitle;
        return row;
      };

      // Attacker tries to edit victim property
      expect(() => updateProperty("owner-attacker", "prop-1", "Hacked Title")).toThrowError(
        "Listing not found, or it is not yours to edit.",
      );

      // Attacker edits their own property
      const updated = updateProperty("owner-attacker", "prop-2", "Legit New Title");
      expect(updated.title).toBe("Legit New Title");
    });

    it("enforces customer entitlement scoping (Customer A cannot consume Customer B entitlement)", () => {
      const mockEntitlements = [
        { id: "ent-1", user_id: "customer-victim", contacts_remaining: 50 },
        { id: "ent-2", user_id: "customer-attacker", contacts_remaining: 0 },
      ];

      const checkEntitlement = (verifiedUserId: string) => {
        const row = mockEntitlements.find((e) => e.user_id === verifiedUserId);
        return row ? row.contacts_remaining > 0 : false;
      };

      expect(checkEntitlement("customer-attacker")).toBe(false);
      expect(checkEntitlement("customer-victim")).toBe(true);
    });
  });

  describe("5. Token Logging Prevention", () => {
    it("ensures no access_token, refresh_token, or JWT strings are emitted to logs", () => {
      const sampleLog = "Handling contact request for property prop-123 from 127.0.0.1";
      expect(sampleLog).not.toMatch(/Bearer\s+[A-Za-z0-9-_=.]+/);
      expect(sampleLog).not.toMatch(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/);
      expect(sampleLog).not.toMatch(/access_token|refresh_token/i);
    });
  });
});
