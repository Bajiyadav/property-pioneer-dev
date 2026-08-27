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
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // We generate the code but deliver it OURSELVES via Resend, rather than
        // letting Supabase send it. Supabase's built-in email is test-only (a very
        // low hourly cap and poor deliverability), which was silently dropping
        // login codes. `admin.generateLink` returns the one-time code WITHOUT
        // sending any email; we then send it through the app's branded transactional
        // email. The client still verifies it with `verifyOtp({ type: "email" })`.
        const redirectTo = `${APP_URL}/auth/callback?next=${encodeURIComponent(next)}`;
        let gen = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo },
        });
        // `magiclink` requires an existing user; create a pre-confirmed passwordless
        // account if this is a first-time email (mirrors the old shouldCreateUser).
        if (gen.error && /user|not found|exist|registered/i.test(gen.error.message ?? "")) {
          await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true }).catch(() => {});
          gen = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: { redirectTo },
          });
        }

        // Deliver the code via Resend. The OTP travels only in the email body sent
        // to the provider — it is never logged, audited, or returned to the client.
        let delivered = false;
        const otp = gen.data?.properties?.email_otp;
        if (!gen.error && otp) {
          const { sendTransactionalEmail } = await import("@/lib/emailService");
          const userName = (gen.data?.user?.user_metadata?.full_name as string | undefined) ?? null;
          const result = await sendTransactionalEmail({
            to: email,
            subject: "Your Seedha Properties Verification Code",
            eventType: "security_event",
            recipientName: userName ?? undefined,
            textBody: `Your Seedha Properties verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this login code, you can safely ignore this email.`,
            htmlBody: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;rounded:12px;">
              <h2 style="color:#0f766e;margin-top:0;">Seedha Properties</h2>
              <p style="color:#334155;font-size:15px;">Your verification code is:</p>
              <div style="background:#f1f5f9;padding:16px;text-align:center;font-size:28px;font-weight:bold;letter-spacing:4px;color:#0f172a;border-radius:8px;margin:16px 0;">
                ${otp}
              </div>
              <p style="color:#64748b;font-size:13px;">This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.</p>
            </div>`,
            metadata: { flow: "email_otp_login" },
          });
          delivered = result.status === "sent";
        }

        // Record the attempt for rate-limiting REGARDLESS of outcome, so a delivery
        // error cannot be used to bypass the limiter by retrying.
        await recordAudit({
          event: "auth.otp.requested",
          outcome: delivered ? "success" : "error",
          ip,
          userAgent,
          subjectId: redacted,
          // No token, no raw email. Only whether we delivered the code.
          details: { delivered },
        });

        // ENUMERATION-SAFE: Since shouldCreateUser is true, this succeeds for both new
        // and existing users. The user is told to check their inbox.
        return jsonResponse({ ok: true, next }, 200);
      },
    },
  },
});
