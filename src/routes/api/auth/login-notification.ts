import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getClientIp, getUserAgent, jsonResponse, recordAudit } from "@/lib/security.server";
import { dispatchLoginSecurityEmail } from "@/lib/notificationService";
import { checkSessionLive } from "@/integrations/supabase/session-liveness.server";
import type { Database } from "@/integrations/supabase/types";

/**
 * Sends the "new sign-in" security email.
 *
 * The email provider credential is server-only, so the browser cannot send this
 * itself. The caller proves it just authenticated by presenting its Supabase
 * access token; every field in the message is derived from the *verified*
 * claims, never from the request body, so a caller cannot address the alert to
 * somebody else or forge the access level shown in it.
 *
 * The token is used to verify identity and is never logged, stored, echoed in
 * the response, or written into the email.
 */
export const Route = createFileRoute("/api/auth/login-notification")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return jsonResponse(
            { success: false, status: "failed", details: "Supabase is not configured." },
            503,
          );
        }

        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.startsWith("Bearer ")) {
          return jsonResponse({ success: false, status: "failed", details: "Unauthorized." }, 401);
        }

        const token = authHeader.slice("Bearer ".length).trim();
        if (token.split(".").length !== 3) {
          return jsonResponse({ success: false, status: "failed", details: "Unauthorized." }, 401);
        }

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        // Signature and expiry, verified locally against the JWKS.
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        const claims = claimsData?.claims;
        if (claimsError || !claims?.sub) {
          return jsonResponse({ success: false, status: "failed", details: "Unauthorized." }, 401);
        }

        // Session liveness. A signature check alone would still accept a token
        // from a session that has since been signed out, which would let an
        // alert be sent without a successful authentication behind it.
        const liveness = await checkSessionLive(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, token);
        if (!liveness.live) {
          return jsonResponse({ success: false, status: "failed", details: "Unauthorized." }, 401);
        }

        const userId = String(claims.sub);
        const email = typeof claims.email === "string" ? claims.email : "";

        if (!email) {
          return jsonResponse({
            success: true,
            status: "skipped",
            details: "No email address on the authenticated account.",
          });
        }

        // Role is read through the caller's own RLS-scoped view, so the access
        // level printed in the email is authoritative rather than caller-supplied.
        const { data: roleRows } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        const roles = (roleRows ?? []).map((r) => r.role);
        // Highest grant wins, matching the client-side resolver.
        const role = (["admin", "agent", "owner", "customer"] as const).find((r) =>
          roles.includes(r),
        );

        const metadata = claims.user_metadata as { full_name?: unknown } | undefined;
        const name =
          (typeof metadata?.full_name === "string" && metadata.full_name) ||
          email.split("@")[0] ||
          "User";

        const result = await dispatchLoginSecurityEmail({ userId, email, name, role });

        await recordAudit({
          event: "login_notification",
          actorId: userId,
          subjectType: "user",
          subjectId: userId,
          outcome: result.status === "failed" ? "error" : "success",
          ip: getClientIp(request),
          userAgent: getUserAgent(request),
          // Delivery status only — no token, address, or message body.
          details: { channel: result.channel, status: result.status },
        });

        return jsonResponse(result);
      },
    },
  },
});
