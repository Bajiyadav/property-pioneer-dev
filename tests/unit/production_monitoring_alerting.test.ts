import { describe, it, expect, beforeEach } from "vitest";
import {
  evaluateProductionHealth,
  trackRequest,
  trackDatabaseFailure,
  trackOtpRequest,
  trackStripeFailure,
  trackAIFailure,
  trackSecurityAbuse,
  resetMonitoringForTesting,
  scrubSensitiveData,
  getMonitoringDashboardSummary,
} from "@/lib/monitoring/alerts.server";

describe("Seedha Production Monitoring, Metrics & Alerting Suite", () => {
  beforeEach(() => {
    resetMonitoringForTesting();
  });

  describe("1. API Error Rate Alerts (5xx)", () => {
    it("triggers no alert during normal, healthy traffic", () => {
      for (let i = 0; i < 50; i++) {
        trackRequest(200, 150);
      }
      const alerts = evaluateProductionHealth();
      expect(alerts.length).toBe(0);
    });

    it("triggers a P2 Warning alert when 5xx error rate is between 2% and 5%", () => {
      // 97 successful requests (200), 3 server errors (500) = 3% error rate out of 100
      for (let i = 0; i < 97; i++) {
        trackRequest(200, 100);
      }
      for (let i = 0; i < 3; i++) {
        trackRequest(500, 100);
      }

      const alerts = evaluateProductionHealth();
      const err5xxAlert = alerts.find((a) => a.ruleKey === "api:5xx_error_rate_warning");

      expect(err5xxAlert).toBeDefined();
      expect(err5xxAlert?.severity).toBe("P2");
      expect(err5xxAlert?.title).toContain("Elevated API 5xx Error Rate");
    });

    it("triggers a P0 Critical alert when 5xx error rate exceeds 5%", () => {
      // 90 successful requests, 10 server errors = 10% error rate
      for (let i = 0; i < 90; i++) {
        trackRequest(200, 100);
      }
      for (let i = 0; i < 10; i++) {
        trackRequest(500, 100);
      }

      const alerts = evaluateProductionHealth();
      const err5xxAlert = alerts.find((a) => a.ruleKey === "api:5xx_error_rate_critical");

      expect(err5xxAlert).toBeDefined();
      expect(err5xxAlert?.severity).toBe("P0");
      expect(err5xxAlert?.title).toContain("Critical API 5xx Error Rate");
    });
  });

  describe("2. Latency Monitoring (p95 / p99)", () => {
    it("triggers a P2 Warning alert when p95 latency is between 2s and 5s", () => {
      for (let i = 0; i < 90; i++) {
        trackRequest(200, 200); // 200ms
      }
      for (let i = 0; i < 10; i++) {
        trackRequest(200, 2500); // 2.5s spike
      }

      const alerts = evaluateProductionHealth();
      const latencyAlert = alerts.find((a) => a.ruleKey === "api:latency_p95_warning");

      expect(latencyAlert).toBeDefined();
      expect(latencyAlert?.severity).toBe("P2");
    });

    it("triggers a P0 Critical alert when p95 latency exceeds 5s", () => {
      for (let i = 0; i < 90; i++) {
        trackRequest(200, 200);
      }
      for (let i = 0; i < 10; i++) {
        trackRequest(200, 6000); // 6s spike
      }

      const alerts = evaluateProductionHealth();
      const latencyAlert = alerts.find((a) => a.ruleKey === "api:latency_p95_critical");

      expect(latencyAlert).toBeDefined();
      expect(latencyAlert?.severity).toBe("P0");
    });
  });

  describe("3. Database Health Monitoring", () => {
    it("triggers a P2 Warning alert when database errors exceed 5 in 5 minutes", () => {
      for (let i = 0; i < 6; i++) {
        trackDatabaseFailure({ query: "SELECT * FROM properties" });
      }

      const alerts = evaluateProductionHealth();
      const dbAlert = alerts.find((a) => a.ruleKey === "db:connectivity_failures_warning");

      expect(dbAlert).toBeDefined();
      expect(dbAlert?.severity).toBe("P2");
    });

    it("triggers a P0 Critical alert when database errors exceed 20 in 5 minutes", () => {
      for (let i = 0; i < 22; i++) {
        trackDatabaseFailure({ query: "SELECT * FROM properties" });
      }

      const alerts = evaluateProductionHealth();
      const dbAlert = alerts.find((a) => a.ruleKey === "db:connectivity_failures_critical");

      expect(dbAlert).toBeDefined();
      expect(dbAlert?.severity).toBe("P0");
    });
  });

  describe("4. Stripe Webhook & Payment Entitlement Alerts", () => {
    it("triggers a P0 Critical alert when a verified checkout session fails to activate entitlement", () => {
      trackStripeFailure(true, { eventId: "evt_12345", userId: "u1" });

      const alerts = evaluateProductionHealth();
      const unactivatedAlert = alerts.find((a) => a.ruleKey === "stripe:unactivated_paid_session");

      expect(unactivatedAlert).toBeDefined();
      expect(unactivatedAlert?.severity).toBe("P0");
      expect(unactivatedAlert?.title).toContain("Paid Stripe Session Not Activated");
    });

    it("triggers a P1 High alert when general Stripe webhook processing failures accumulate", () => {
      for (let i = 0; i < 6; i++) {
        trackStripeFailure(false, { reason: "signature_verification_failed" });
      }

      const alerts = evaluateProductionHealth();
      const webhookAlert = alerts.find((a) => a.ruleKey === "stripe:webhook_processing_failure");

      expect(webhookAlert).toBeDefined();
      expect(webhookAlert?.severity).toBe("P1");
    });
  });

  describe("5. AI Service & Provider Health", () => {
    it("triggers a P1 High alert when AI provider failures spike", () => {
      for (let i = 0; i < 6; i++) {
        trackAIFailure({ reason: "Gemini 503 Overloaded" });
      }

      const alerts = evaluateProductionHealth();
      const aiAlert = alerts.find((a) => a.ruleKey === "ai:provider_failure_critical");

      expect(aiAlert).toBeDefined();
      expect(aiAlert?.severity).toBe("P1");
    });

    it("does not treat zero-result property searches as errors or alerts", () => {
      // 0-result searches are honest business responses, not system failures
      const dashboard = getMonitoringDashboardSummary();
      expect(dashboard.aiFailures5m).toBe(0);
      expect(evaluateProductionHealth().length).toBe(0);
    });
  });

  describe("6. Security Abuse, OTP Spikes & Rate Limiting", () => {
    it("triggers a P1 High alert when OTP request volume surges abnormal baseline", () => {
      for (let i = 0; i < 35; i++) {
        trackOtpRequest();
      }

      const alerts = evaluateProductionHealth();
      const otpAlert = alerts.find((a) => a.ruleKey === "security:otp_request_surge");

      expect(otpAlert).toBeDefined();
      expect(otpAlert?.severity).toBe("P1");
    });

    it("triggers a P2 Warning alert when 429 rate limit responses spike", () => {
      for (let i = 0; i < 55; i++) {
        trackRequest(429, 20);
      }

      const alerts = evaluateProductionHealth();
      const rateLimitAlert = alerts.find((a) => a.ruleKey === "security:rate_limit_spike");

      expect(rateLimitAlert).toBeDefined();
      expect(rateLimitAlert?.severity).toBe("P2");
    });
  });

  describe("7. Secret & PII Scrubbing in Alerts", () => {
    it("redacts JWTs, Stripe keys, passwords, and OTP numbers from alert payloads", () => {
      const rawPayload = {
        authHeader:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        stripeKey: "sk_test_51MockStripeSecretKey123456789",
        webhookSecret: "whsec_mockWebhookSecret123456789",
        userPassword: "SuperSecretPassword123!",
        otpCode: "123456",
        safePropertyId: "prop-guid-1234",
      };

      const scrubbed = scrubSensitiveData(rawPayload);

      expect(scrubbed.authHeader).toBe("Bearer [REDACTED]");
      expect(scrubbed.stripeKey).toBe("[REDACTED_STRIPE_KEY]");
      expect(scrubbed.webhookSecret).toBe("[REDACTED_STRIPE_KEY]");
      expect(scrubbed.userPassword).toBe("[REDACTED]");
      expect(scrubbed.otpCode).toBe("[REDACTED_OTP]");
      expect(scrubbed.safePropertyId).toBe("prop-guid-1234");
    });
  });
});
