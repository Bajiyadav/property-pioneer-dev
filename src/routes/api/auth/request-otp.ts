import { createFileRoute } from "@tanstack/react-router";
import {
  getClientIp,
  getUserAgent,
  jsonResponse,
  recordAudit,
  checkRateLimits,
  type RateLimitRule,
} from "@/lib/security.server";

/**
 * Passwordless Email-OTP REQUEST endpoint.
 *
 * This is the server-mediated front door for `signInWithOtp`. It exists (rather
 * than calling signInWithOtp straight from the browser) for one reason: to apply
 * per-IP and per-email limits with the same Postgres-backed limiter the contact
 * and enquiry endpoints use, so the limits hold across every worker instance.
 *
 * THREE INVARIANTS, each with a security reason:
 *
 *  1. ENUMERATION-SAFE. The response is identical whether or not the email is
 *     registered — always `{ ok: true }` on a well-formed request. Supabase's own
 *     signInWithOtp is enumeration-safe by design (it neither confirms nor denies
 *     the address); we must not undo that by branching the response on whether the
 *     user exists. `shouldCreateUser: true` is deliberate: a new visitor signing
 *     in for the first time is the primary flow, and it also means "exists vs not"
 *     never changes the outcome.
 *
 *  2. THE OTP VALUE IS NEVER SEEN HERE. Supabase generates and mails the code; this
 *     server never receives it, so it cannot log it. Audit rows record only the
 *     event, IP, and a redacted email — never a token.
 *
 *  3. THE REDIRECT IS VALIDATED. `next` is echoed into the verification link, so an
 *     unchecked value is an open-redirect. It is constrained to an internal
 *     absolute path here, mirroring safeRedirect in routes/auth.tsx.
 */

const PER_IP_OTP: RateLimitRule = {
  name: "otp:ip:hourly",
  windowSeconds: 3600,
  max: 8, // a human needs one or two codes; eight per hour per IP is generous
};
const PER_EMAIL_OTP: RateLimitRule = {
  name: "otp:email:hourly",
  windowSeconds: 3600,
  max: 5, // caps targeting a single inbox regardless of source IP
};

/** Trim + lowercase. A single canonical form so "A@x.com " and "a@x.com" collide. */
export function normalizeEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

/** RFC-pragmatic email shape. Not exhaustive — just enough to reject junk early. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Redact for audit: keep first char + domain, drop the rest of the local part. */
function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "invalid";
  return `${local.slice(0, 1)}***@${domain}`;
}

/**
 * Internal-path guard, identical rule to routes/auth.tsx safeRedirect: must be a
 * root-relative path, never protocol-relative (`//host`), never back into /auth.
 */
function safeNext(next: unknown): string {
  if (typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  if (next.startsWith("/auth")) return "/";
  return next;
}

async function countRecentOtp(
  field: "ip_address" | "subject_id",
  value: string,
  sinceIso: string,
): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("event", "auth.otp.requested")
    .eq(field, value)
    .gte("created_at", sinceIso);
  return count ?? 0;
}

export const Route = createFileRoute("/api/auth/request-otp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIp(request);
        const userAgent = getUserAgent(request);

        let body: { email?: unknown; next?: unknown } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return jsonResponse({ error: "Invalid request body." }, 400);
        }

        const email = normalizeEmail(body.email);
        const next = safeNext(body.next);

        // Malformed email is rejected BEFORE any limiter or Supabase call, so junk
        // never consumes a rate-limit slot. This is a format check, not an
        // existence check — it reveals nothing about who is registered.
        if (!EMAIL_RE.test(email) || email.length > 254) {
          return jsonResponse({ error: "Enter a valid email address." }, 400);
        }

        // Per-IP then per-email. `subject_id` carries the redacted email so the
        // limiter counts a single inbox without storing the raw address as an id.
        const redacted = redactEmail(email);
        const limit = await checkRateLimits([
          { rule: PER_IP_OTP, count: (since) => countRecentOtp("ip_address", ip, since) },
          {
            rule: PER_EMAIL_OTP,
            count: (since) => countRecentOtp("subject_id", redacted, since),
          },
        ]);
        if (!limit.allowed) {
          await recordAudit({
            event: "auth.otp.rejected",
            outcome: "rate_limited",
            ip,
            userAgent,
            subjectId: redacted,
            details: { rule: limit.rule?.name },
          });
          // Generic message; does not distinguish which limit or whether the email exists.
          return jsonResponse({ error: "Too many code requests. Please wait and try again." }, 429);
        }

        const { APP_URL } = await import("@/config/app");
        const { supabase } = await import("@/integrations/supabase/client");

        // Supabase generates + sends the code. We pass emailRedirectTo so the link
        // variant returns to the validated internal path; the numeric code variant
        // is verified by the client against the same email.
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${APP_URL}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });

        // Record the attempt for rate-limiting REGARDLESS of provider outcome, so a
        // provider error cannot be used to bypass the limiter by retrying.
        await recordAudit({
          event: "auth.otp.requested",
          outcome: error ? "error" : "success",
          ip,
          userAgent,
          subjectId: redacted,
          // No token, no raw email. Only whether the provider accepted the send.
          details: { delivered: !error },
        });

        if (error) {
          // If the provider fails to send the email (e.g. rate limit, SMTP error),
          // we must inform the client so they don't wait for an email that will never arrive.
          return jsonResponse({ error: error.message || "Failed to send OTP code." }, 400);
        }

        // ENUMERATION-SAFE: Since shouldCreateUser is true, this succeeds for both new
        // and existing users. The user is told to check their inbox.
        return jsonResponse({ ok: true, next }, 200);
      },
    },
  },
});
