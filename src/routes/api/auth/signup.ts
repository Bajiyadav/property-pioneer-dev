import { createFileRoute } from "@tanstack/react-router";
import {
  getClientIp,
  getUserAgent,
  jsonResponse,
  recordAudit,
  checkRateLimits,
  type RateLimitRule,
} from "@/lib/security.server";
import { MIN_PASSWORD_LENGTH } from "@/modules/authentication/services/passwordPolicy";

/**
 * Account-creation endpoint.
 *
 * Creates the user server-side with `email_confirm: true`, so a brand-new
 * account is immediately usable and the client establishes a session with a
 * single signInWithPassword — no confirmation-email round trip. This
 * deliberately trades signup email verification for a zero-friction first run:
 * with Supabase's "Confirm email" on and transactional email undelivered,
 * signUp returned no session and stranded the user on an OTP screen. Re-enable
 * "Confirm email" and drop this endpoint once email delivery is proven.
 *
 * Invariants (twin of request-password-reset.ts):
 *  1. The service-role client never leaves the server.
 *  2. NO PASSWORD IS EVER LOGGED. Audit rows carry only a redacted email and the
 *     outcome — never the password, never a session token.
 *  3. Rate-limited per IP via the same Postgres-backed limiter.
 */

const PER_IP_SIGNUP: RateLimitRule = { name: "signup:ip:hourly", windowSeconds: 3600, max: 8 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}
function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  return domain ? `${local.slice(0, 1)}***@${domain}` : "invalid";
}
function str(raw: unknown, max: number): string {
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

async function countRecentSignups(ip: string, sinceIso: string): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("event", "auth.signup.created")
    .eq("ip_address", ip)
    .gte("created_at", sinceIso);
  return count ?? 0;
}

export const Route = createFileRoute("/api/auth/signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIp(request);
        const userAgent = getUserAgent(request);

        let body: {
          email?: unknown;
          password?: unknown;
          name?: unknown;
          phone?: unknown;
          address?: unknown;
        } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return jsonResponse({ error: "Invalid request body." }, 400);
        }

        const email = normalizeEmail(body.email);
        const password = typeof body.password === "string" ? body.password : "";
        const name = str(body.name, 120);
        const phone = str(body.phone, 20);
        const address = str(body.address, 200) || "Hyderabad";

        if (!EMAIL_RE.test(email) || email.length > 254) {
          return jsonResponse({ error: "Enter a valid email address." }, 400);
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
          return jsonResponse(
            { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
            400,
          );
        }
        if (name.length < 2) {
          return jsonResponse({ error: "Enter your full name." }, 400);
        }

        const redacted = redactEmail(email);

        const limit = await checkRateLimits([
          { rule: PER_IP_SIGNUP, count: (since) => countRecentSignups(ip, since) },
        ]);
        if (!limit.allowed) {
          await recordAudit({
            event: "auth.signup.rejected",
            outcome: "rate_limited",
            ip,
            userAgent,
            subjectId: redacted,
            details: { rule: limit.rule?.name },
          });
          return jsonResponse(
            { error: "Too many sign-up attempts. Please wait and try again." },
            429,
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: name,
            phone,
            address,
            role: "customer",
          },
        });

        if (error || !data?.user) {
          const msg = (error?.message ?? "").toLowerCase();
          const status =
            typeof (error as { status?: unknown } | null)?.status === "number"
              ? (error as { status: number }).status
              : 0;
          const exists =
            msg.includes("already been registered") ||
            msg.includes("already registered") ||
            msg.includes("already exists") ||
            msg.includes("already in use") ||
            msg.includes("duplicate") ||
            status === 422;

          await recordAudit({
            event: "auth.signup.rejected",
            outcome: exists ? "rejected" : "error",
            ip,
            userAgent,
            subjectId: redacted,
            details: exists ? { reason: "duplicate" } : {}, // never the password
          });

          if (exists) {
            return jsonResponse({ error: "An account with this email already exists." }, 409);
          }
          return jsonResponse({ error: "Could not create your account. Please try again." }, 400);
        }

        await recordAudit({
          event: "auth.signup.created",
          outcome: "success",
          ip,
          userAgent,
          subjectId: redacted,
          details: {}, // no password, no session token
        });

        // The account is confirmed; the client establishes the session itself
        // with signInWithPassword using the same credentials.
        return jsonResponse({ ok: true }, 200);
      },
    },
  },
});
