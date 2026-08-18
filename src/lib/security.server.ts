/**
 * Server-only security primitives: client identity, rate limiting, audit
 * logging, and CAPTCHA verification. Shared by every write endpoint so new
 * modules inherit the same protections without re-implementing them.
 */

import type { Json } from "@/integrations/supabase/types";

export function getClientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

export function getUserAgent(request: Request): string {
  return (request.headers.get("user-agent") ?? "").slice(0, 512);
}

export function jsonResponse(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

export interface RateLimitRule {
  /** Human-readable name, surfaced in audit logs. */
  name: string;
  /** Sliding window in seconds. */
  windowSeconds: number;
  /** Max allowed events in the window. */
  max: number;
}

export interface RateLimitCheck {
  allowed: boolean;
  rule?: RateLimitRule;
  retryAfterSeconds?: number;
}

type CountFn = (sinceIso: string) => Promise<number>;

/**
 * Evaluates a set of sliding-window rules against a counting function.
 * Backed by Postgres, so limits hold across all worker instances.
 */
export async function checkRateLimits(
  rules: Array<{ rule: RateLimitRule; count: CountFn }>,
): Promise<RateLimitCheck> {
  for (const { rule, count } of rules) {
    const since = new Date(Date.now() - rule.windowSeconds * 1000).toISOString();
    const used = await count(since);
    if (used >= rule.max) {
      return { allowed: false, rule, retryAfterSeconds: rule.windowSeconds };
    }
  }
  return { allowed: true };
}

export interface AuditEvent {
  event: string;
  actorId?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;
  outcome?: "success" | "rejected" | "error" | "rate_limited" | "captcha_failed";
  ip?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown>;
}

export async function recordAudit(entry: AuditEvent): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("audit_logs").insert({
      event: entry.event,
      actor_id: entry.actorId ?? null,
      subject_type: entry.subjectType ?? null,
      subject_id: entry.subjectId ?? null,
      outcome: entry.outcome ?? "success",
      ip_address: entry.ip ?? null,
      user_agent: entry.userAgent ?? null,
      // AuditEvent.details is a loose bag of values; the column is jsonb.
      details: (entry.details ?? {}) as Json,
    });
  } catch (error) {
    // Auditing must never break the request path.
    console.error("[audit] failed to record event", entry.event, error);
  }
}

/**
 * Cloudflare Turnstile verification.
 * Follows Cloudflare's canonical server-side siteverify specification.
 * Returns `true` when the CAPTCHA is not configured in local development,
 * so the platform runs smoothly until the secret is provisioned.
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string,
  expectedAction?: string,
): Promise<{ ok: boolean; configured: boolean; reason?: string }> {
  const secret = process.env.TURNSTILE_SECRET || process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, configured: false };
  if (!token || typeof token !== "string" || token.length === 0 || token.length > 4096) {
    return { ok: false, configured: true, reason: "missing-token" };
  }

  const expectedHostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean),
  );

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });
    if (ip && ip !== "unknown") {
      body.set("remoteip", ip);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { ok: false, configured: true, reason: `http-${res.status}` };
    }

    const data = (await res.json()) as {
      success?: boolean;
      action?: string;
      hostname?: string;
      "error-codes"?: string[];
    };

    if (!data.success) {
      return {
        ok: false,
        configured: true,
        reason: (data["error-codes"] ?? []).join(",") || "failed",
      };
    }

    if (expectedAction && data.action && data.action !== expectedAction) {
      return { ok: false, configured: true, reason: "action-mismatch" };
    }

    if (expectedHostnames.size > 0 && data.hostname && !expectedHostnames.has(data.hostname)) {
      return { ok: false, configured: true, reason: "hostname-mismatch" };
    }

    return { ok: true, configured: true };
  } catch (error) {
    console.error("[turnstile] verification error", error);
    return { ok: false, configured: true, reason: "verify-error" };
  }
}
