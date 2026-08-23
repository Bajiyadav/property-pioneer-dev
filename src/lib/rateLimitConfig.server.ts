/**
 * Centralized Server-Side Rate Limiting Configurations.
 * Single source of truth for all rate limiting windows, thresholds, and limits.
 */
import type { RateLimitRule } from "./security.server";

export const RATE_LIMIT_CONFIG = {
  // Authentication & Verification
  AUTH_LOGIN_IP: { name: "auth:login:ip", windowSeconds: 900, max: 10 } as RateLimitRule,
  OTP_IP: { name: "otp:ip:hourly", windowSeconds: 3600, max: 8 } as RateLimitRule,
  OTP_EMAIL: { name: "otp:email:hourly", windowSeconds: 3600, max: 5 } as RateLimitRule,
  RESET_IP: { name: "reset:ip:hourly", windowSeconds: 3600, max: 6 } as RateLimitRule,
  RESET_EMAIL: { name: "reset:email:hourly", windowSeconds: 3600, max: 4 } as RateLimitRule,

  // AI Assistant (/api/ai/chat)
  AI_IP_HOURLY: { name: "ai:ip:hourly", windowSeconds: 3600, max: 40 } as RateLimitRule,
  AI_USER_HOURLY: { name: "ai:user:hourly", windowSeconds: 3600, max: 60 } as RateLimitRule,
  AI_MAX_PAYLOAD_BYTES: 16384, // 16 KB max request body
  AI_MAX_PROMPT_CHARS: 4000, // 4,000 max prompt length

  // Public Contacts & Visits
  CONTACT_IP_HOURLY: { name: "contact:ip:hourly", windowSeconds: 3600, max: 10 } as RateLimitRule,
  CONTACT_USER_HOURLY: {
    name: "contact:user:hourly",
    windowSeconds: 3600,
    max: 15,
  } as RateLimitRule,
  VISIT_IP_HOURLY: { name: "visit:ip:hourly", windowSeconds: 3600, max: 6 } as RateLimitRule,
  ENQUIRY_IP_BURST: { name: "enquiry:ip:burst", windowSeconds: 60, max: 2 } as RateLimitRule,
  ENQUIRY_IP_HOURLY: { name: "enquiry:ip:hourly", windowSeconds: 3600, max: 6 } as RateLimitRule,
  ENQUIRY_IP_DAILY: { name: "enquiry:ip:daily", windowSeconds: 86400, max: 20 } as RateLimitRule,
  ENQUIRY_PHONE_DAILY: {
    name: "enquiry:phone:daily",
    windowSeconds: 86400,
    max: 10,
  } as RateLimitRule,
  ENQUIRY_IP_PROPERTY: {
    name: "enquiry:ip+property:daily",
    windowSeconds: 86400,
    max: 2,
  } as RateLimitRule,

  // Owner Operations
  PROPERTY_CREATE_HOURLY: {
    name: "property:create:hourly",
    windowSeconds: 3600,
    max: 10,
  } as RateLimitRule,
  PROPERTY_UPDATE_HOURLY: {
    name: "property:update:hourly",
    windowSeconds: 3600,
    max: 30,
  } as RateLimitRule,
  MEDIA_UPLOAD_HOURLY: {
    name: "media:upload:hourly",
    windowSeconds: 3600,
    max: 50,
  } as RateLimitRule,

  // Checkout & Payments
  CHECKOUT_CREATE_HOURLY: {
    name: "checkout:create:hourly",
    windowSeconds: 3600,
    max: 10,
  } as RateLimitRule,
} as const;

/**
 * Standardized 429 response formatter.
 */
export function rateLimitExceededResponse(ruleName: string, retryAfterSeconds = 3600): Response {
  return new Response(
    JSON.stringify({
      error: "RATE_LIMITED",
      message: "Too many requests. Please try again later.",
      rule: ruleName,
      retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "retry-after": String(retryAfterSeconds),
      },
    },
  );
}
