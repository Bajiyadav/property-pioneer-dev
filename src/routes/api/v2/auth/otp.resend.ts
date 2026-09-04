import { createFileRoute } from "@tanstack/react-router";
import { getClientIp, getUserAgent, jsonResponse } from "@/lib/security.server";
import { processOtpRequest } from "@/server/otpService";

/**
 * Native in-house OTP RESEND endpoint.
 *
 * Direct parity with Java 21 Spring Boot backend:
 *   POST /api/v2/auth/otp/resend
 *
 * Delegates to the request handler with cooldown checks and invalidation.
 */
export const Route = createFileRoute("/api/v2/auth/otp/resend")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          const ipAddress = getClientIp(request);
          const userAgent = getUserAgent(request);

          const result = await processOtpRequest({
            contact: String(body.contact || ""),
            contactType: body.contact_type ? String(body.contact_type) : undefined,
            purpose: body.purpose ? String(body.purpose) : "LOGIN",
            fullName: body.full_name ? String(body.full_name) : undefined,
            role: body.role ? String(body.role) : undefined,
            ipAddress,
            userAgent,
          });

          return jsonResponse(
            {
              ok: result.ok,
              message: result.message,
              ...(result.cooldownSeconds ? { cooldown_seconds: result.cooldownSeconds } : {}),
              ...(result.expiresInSeconds ? { expires_in_seconds: result.expiresInSeconds } : {}),
            },
            result.statusCode,
          );
        } catch {
          return jsonResponse({ ok: false, message: "OTP resend request failed" }, 500);
        }
      },
    },
  },
});
