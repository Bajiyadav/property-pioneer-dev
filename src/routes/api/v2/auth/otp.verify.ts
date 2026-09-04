import { createFileRoute } from "@tanstack/react-router";
import { getClientIp, getUserAgent, jsonResponse } from "@/lib/security.server";
import { refreshTokenTtlSeconds } from "@/server/auth";
import { processOtpVerify } from "@/server/otpService";

const REFRESH_COOKIE = "seedha_refresh";

function refreshCookie(value: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return (
    `${REFRESH_COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/api/v2/auth` +
    `; Max-Age=${maxAgeSeconds}${secure}`
  );
}

/**
 * Native in-house OTP VERIFY endpoint.
 *
 * Direct parity with Java 21 Spring Boot backend:
 *   POST /api/v2/auth/otp/verify
 *
 * Guarantees:
 * 1. Single-use guarantee: marked consumed immediately on verification.
 * 2. Brute-force bounding: maximum 5 attempts before challenge invalidation.
 * 3. 5-minute challenge expiration enforcement.
 * 4. Issues enterprise JWT access token + refresh token pair (dual-backend compatible).
 */
export const Route = createFileRoute("/api/v2/auth/otp/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          const ipAddress = getClientIp(request);
          const userAgent = getUserAgent(request);

          const result = await processOtpVerify({
            contact: String(body.contact || ""),
            otp: String(body.otp || ""),
            purpose: body.purpose ? String(body.purpose) : "LOGIN",
            newPassword: body.new_password ? String(body.new_password) : undefined,
            fullName: body.full_name ? String(body.full_name) : undefined,
            deviceInfo: body.device_info ? String(body.device_info) : undefined,
            ipAddress,
            userAgent,
          });

          if (!result.ok) {
            return jsonResponse(
              {
                ok: false,
                message: result.message,
              },
              result.statusCode,
            );
          }

          const headers: Record<string, string> = {};
          if (result.refreshToken) {
            headers["Set-Cookie"] = refreshCookie(result.refreshToken, refreshTokenTtlSeconds());
          }

          return jsonResponse(
            {
              ok: true,
              message: result.message,
              token: result.token,
              refresh_token: result.refreshToken,
              expires_in: result.expiresIn,
              auth: result.auth,
              user: result.user,
            },
            200,
            headers,
          );
        } catch {
          return jsonResponse({ ok: false, message: "OTP verification failed" }, 500);
        }
      },
    },
  },
});
