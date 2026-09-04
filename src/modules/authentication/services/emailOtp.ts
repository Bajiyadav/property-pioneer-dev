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
  const normEmail = normalizeEmail(email);

  // 1. Native Seedha in-house OTP engine (/api/v2/auth/otp/request)
  try {
    const nativeRes = await fetch("/api/v2/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact: normEmail,
        contact_type: "EMAIL",
        purpose: "LOGIN",
      }),
    });
    const data = (await nativeRes.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      cooldown_seconds?: number;
    };
    if (nativeRes.ok && data?.ok === true) {
      return { ok: true, next: safeNextPath(next) };
    }
    if (nativeRes.status === 429 || (!nativeRes.ok && data?.message)) {
      return {
        ok: false,
        error: data.message || "Could not send verification code.",
        retryAfterSeconds: data.cooldown_seconds || (nativeRes.status === 429 ? 60 : undefined),
      };
    }
  } catch {
    // Fall back to secondary proxy if network fails
  }

  let res: Response;
  try {
    res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: normEmail, next: safeNextPath(next) }),
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

export type OtpVerifiedUser = {
  id?: string;
  email?: string;
  full_name?: string;
  role?: string;
  phone?: string;
};

export type OtpVerifyResult = { ok: true; user?: OtpVerifiedUser } | { ok: false; error: string };

/**
 * Exchanges a 6-digit code for an authenticated session.
 */
export async function verifyEmailOtp(email: string, token: string): Promise<OtpVerifyResult> {
  const code = token.trim();
  if (!/^\d{6,8}$/.test(code)) {
    return { ok: false, error: "Enter the code from your email (6–8 digits)." };
  }

  const normEmail = normalizeEmail(email);

  // 1. Native Seedha in-house OTP engine (/api/v2/auth/otp/verify)
  try {
    const nativeRes = await fetch("/api/v2/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact: normEmail,
        otp: code,
        purpose: "LOGIN",
      }),
    });
    const data = await nativeRes.json().catch(() => ({}));
    const authToken = data?.token || data?.auth?.token;
    const refreshToken = data?.refresh_token || data?.auth?.refresh_token;
    const authUser = data?.user || data?.auth?.user;

    if (nativeRes.ok && data?.ok === true && authToken) {
      localStorage.setItem("seedha_token", authToken);
      if (refreshToken) {
        localStorage.setItem("seedha_refresh_token", refreshToken);
      }
      if (authUser) {
        localStorage.setItem("seedha_user", JSON.stringify(authUser));
      }
      return { ok: true, user: authUser };
    }

    if (!nativeRes.ok && data?.message) {
      return { ok: false, error: data.message };
    }
  } catch {
    // Fall back to Supabase client
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: normEmail,
    token: code,
    type: "email",
  });

  if (error) {
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
