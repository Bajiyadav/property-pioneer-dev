import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side helpers for the passwordless Email-OTP flow.
 *
 * DIVISION OF RESPONSIBILITY
 *  - The REQUEST (sending the code) goes through /api/auth/request-otp so per-IP
 *    and per-email limits are enforced server-side. Never call signInWithOtp from
 *    the browser directly — that bypasses the limiter.
 *  - The VERIFY (exchanging the code for a session) is done here against Supabase
 *    Auth. It must run in the browser because verifyOtp establishes the session in
 *    the client's own storage. Supabase natively rate-limits verification and
 *    invalidates a code after repeated failures and after expiry, so brute-forcing
 *    a code is bounded by the provider even though this call is client-side.
 *
 * The OTP value is a short-lived secret. It is never logged here, and error text
 * is normalised so a raw provider string can't leak into logs or analytics.
 */

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Same internal-only rule as the server: root-relative, no `//`, not /auth. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  if (next.startsWith("/auth")) return "/";
  return next;
}

export type OtpRequestResult =
  { ok: true; next: string } | { ok: false; error: string; retryAfterSeconds?: number };

/** Asks the server to send a code. Enumeration-safe: success looks the same for any email. */
export async function requestEmailOtp(email: string, next?: string): Promise<OtpRequestResult> {
  let res: Response;
  try {
    res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: normalizeEmail(email), next: safeNextPath(next) }),
    });
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }

  if (res.ok) {
    const data = (await res.json().catch(() => ({}))) as { next?: string };
    return { ok: true, next: safeNextPath(data.next) };
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return {
    ok: false,
    error: data.error ?? "Could not send the code. Please try again.",
    retryAfterSeconds: res.status === 429 ? 3600 : undefined,
  };
}

export type OtpVerifyResult = { ok: true } | { ok: false; error: string };

/**
 * Exchanges a 6-digit code for a session. `type: "email"` is the passwordless
 * login variant (distinct from "signup"/"recovery" used elsewhere in the app).
 */
export async function verifyEmailOtp(email: string, token: string): Promise<OtpVerifyResult> {
  const code = token.trim();
  if (!/^\d{6,8}$/.test(code)) {
    return { ok: false, error: "Enter the code from your email (6–8 digits)." };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizeEmail(email),
    token: code,
    type: "email",
  });

  if (error) {
    // Normalised, non-revealing messages. The code itself is never echoed.
    const m = error.message?.toLowerCase() ?? "";
    if (m.includes("expired"))
      return { ok: false, error: "That code has expired. Request a new one." };
    if (m.includes("invalid") || m.includes("token"))
      return { ok: false, error: "That code is incorrect. Check it and try again." };
    return { ok: false, error: "Could not verify the code. Please try again." };
  }
  if (!data.session) {
    return { ok: false, error: "Verification did not establish a session. Please try again." };
  }
  return { ok: true };
}
