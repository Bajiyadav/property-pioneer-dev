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
 * Password-reset REQUEST endpoint — server-mediated so the same Postgres-backed
 * limiter used by OTP and contact applies per-IP and per-email. It is the twin
 * of request-otp.ts and follows the same three invariants:
 *
 *  1. ENUMERATION-SAFE. Always `{ ok: true }` on a well-formed request. Supabase's
 *     resetPasswordForEmail is itself enumeration-safe (it neither confirms nor
 *     denies the address); the UI must not re-introduce a leak by branching the
 *     response — which the existing client toast did by echoing the target email.
 *  2. NO TOKEN IS SEEN OR LOGGED. Supabase mints and mails the recovery link;
 *     this server never receives it. Audit rows carry only a redacted email.
 *  3. INTERNAL-ONLY REDIRECT. redirectTo is fixed to the app's own /auth/callback;
 *     no external or user-controlled destination is accepted.
 */

const PER_IP_RESET: RateLimitRule = { name: "reset:ip:hourly", windowSeconds: 3600, max: 6 };
const PER_EMAIL_RESET: RateLimitRule = { name: "reset:email:hourly", windowSeconds: 3600, max: 4 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}
function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  return domain ? `${local.slice(0, 1)}***@${domain}` : "invalid";
}

async function countRecentReset(
  field: "ip_address" | "subject_id",
  value: string,
  sinceIso: string,
): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("event", "auth.reset.requested")
    .eq(field, value)
    .gte("created_at", sinceIso);
  return count ?? 0;
}

export const Route = createFileRoute("/api/auth/request-password-reset")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIp(request);
        const userAgent = getUserAgent(request);

        let body: { email?: unknown } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return jsonResponse({ error: "Invalid request body." }, 400);
        }

        const email = normalizeEmail(body.email);
        if (!EMAIL_RE.test(email) || email.length > 254) {
          return jsonResponse({ error: "Enter a valid email address." }, 400);
        }

        const redacted = redactEmail(email);
        const limit = await checkRateLimits([
          { rule: PER_IP_RESET, count: (since) => countRecentReset("ip_address", ip, since) },
          {
            rule: PER_EMAIL_RESET,
            count: (since) => countRecentReset("subject_id", redacted, since),
          },
        ]);
        if (!limit.allowed) {
          await recordAudit({
            event: "auth.reset.rejected",
            outcome: "rate_limited",
            ip,
            userAgent,
            subjectId: redacted,
            details: { rule: limit.rule?.name },
          });
          return jsonResponse(
            { error: "Too many reset requests. Please wait and try again." },
            429,
          );
        }

        const { APP_URL } = await import("@/config/app");
        const { supabase } = await import("@/integrations/supabase/client");
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${APP_URL}/auth/callback?type=recovery`,
        });

        await recordAudit({
          event: "auth.reset.requested",
          outcome: error ? "error" : "success",
          ip,
          userAgent,
          subjectId: redacted,
          details: { delivered: !error }, // no token, no raw email
        });

        // Same 200 whether or not the account exists. The message the client
        // shows must be generic — never echo the address or confirm delivery.
        return jsonResponse({ ok: true }, 200);
      },
    },
  },
});
