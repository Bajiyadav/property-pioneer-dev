import { describe, it, expect } from "vitest";
import { checkRateLimits, type RateLimitRule } from "@/lib/security.server";
import { RATE_LIMIT_CONFIG, rateLimitExceededResponse } from "@/lib/rateLimitConfig.server";

describe("Production-Grade Rate Limiting Verification Suite", () => {
  describe("1. Sliding Window Rate Limiting Engine", () => {
    it("allows requests below the limit threshold", async () => {
      const testRule: RateLimitRule = { name: "test:burst", windowSeconds: 60, max: 5 };
      const callCount = 3;

      const result = await checkRateLimits([{ rule: testRule, count: async () => callCount }]);

      expect(result.allowed).toBe(true);
      expect(result.rule).toBeUndefined();
    });

    it("blocks requests exceeding the maximum limit with retry-after header time", async () => {
      const testRule: RateLimitRule = { name: "test:hourly", windowSeconds: 3600, max: 10 };
      const callCount = 10;

      const result = await checkRateLimits([{ rule: testRule, count: async () => callCount }]);

      expect(result.allowed).toBe(false);
      expect(result.rule?.name).toBe("test:hourly");
      expect(result.retryAfterSeconds).toBe(3600);
    });

    it("evaluates multi-tiered rules cheapest-first and halts on first trip", async () => {
      const burstRule: RateLimitRule = { name: "test:burst", windowSeconds: 60, max: 2 };
      const hourlyRule: RateLimitRule = { name: "test:hourly", windowSeconds: 3600, max: 10 };

      const counts = [3, 0]; // Burst exceeded
      let hourlyChecked = false;

      const result = await checkRateLimits([
        { rule: burstRule, count: async () => counts[0] },
        {
          rule: hourlyRule,
          count: async () => {
            hourlyChecked = true;
            return counts[1];
          },
        },
      ]);

      expect(result.allowed).toBe(false);
      expect(result.rule?.name).toBe("test:burst");
      expect(hourlyChecked).toBe(false);
    });
  });

  describe("2. Standardized Rate Limit Responses", () => {
    it("generates standardized HTTP 429 response without leaking internal database info", async () => {
      const res = rateLimitExceededResponse("ai:ip:hourly", 3600);
      expect(res.status).toBe(429);
      expect(res.headers.get("retry-after")).toBe("3600");
      expect(res.headers.get("content-type")).toContain("application/json");

      const body = await res.json();
      expect(body.error).toBe("RATE_LIMITED");
      expect(body.message).toContain("Too many requests");
      expect(body.rule).toBe("ai:ip:hourly");
      expect(body.retryAfterSeconds).toBe(3600);
      expect(body.dbQuery).toBeUndefined();
      expect(body.internalStack).toBeUndefined();
    });
  });

  describe("3. Centralized Rate Limit Rules Consistency", () => {
    it("ensures all critical endpoints have configured thresholds", () => {
      expect(RATE_LIMIT_CONFIG.AUTH_LOGIN_IP.max).toBe(10);
      expect(RATE_LIMIT_CONFIG.OTP_IP.max).toBe(8);
      expect(RATE_LIMIT_CONFIG.OTP_EMAIL.max).toBe(5);
      expect(RATE_LIMIT_CONFIG.RESET_IP.max).toBe(6);
      expect(RATE_LIMIT_CONFIG.RESET_EMAIL.max).toBe(4);
      expect(RATE_LIMIT_CONFIG.AI_IP_HOURLY.max).toBe(40);
      expect(RATE_LIMIT_CONFIG.AI_USER_HOURLY.max).toBe(60);
      expect(RATE_LIMIT_CONFIG.AI_MAX_PAYLOAD_BYTES).toBe(16384);
      expect(RATE_LIMIT_CONFIG.AI_MAX_PROMPT_CHARS).toBe(4000);
      expect(RATE_LIMIT_CONFIG.CONTACT_IP_HOURLY.max).toBe(10);
      expect(RATE_LIMIT_CONFIG.VISIT_IP_HOURLY.max).toBe(6);
      expect(RATE_LIMIT_CONFIG.PROPERTY_CREATE_HOURLY.max).toBe(10);
      expect(RATE_LIMIT_CONFIG.CHECKOUT_CREATE_HOURLY.max).toBe(10);
    });
  });

  describe("4. Concurrent Request Handling", () => {
    it("correctly identifies limit breach when multiple concurrent requests arrive", async () => {
      const testRule: RateLimitRule = { name: "concurrent:test", windowSeconds: 60, max: 5 };
      let sharedCount = 4;

      const runCheck = async () => {
        return checkRateLimits([
          {
            rule: testRule,
            count: async () => {
              const current = sharedCount;
              sharedCount++;
              return current;
            },
          },
        ]);
      };

      const [res1, res2] = await Promise.all([runCheck(), runCheck()]);
      // First check (count=4) passes, second check (count=5) fails
      expect(res1.allowed).toBe(true);
      expect(res2.allowed).toBe(false);
    });
  });
});
