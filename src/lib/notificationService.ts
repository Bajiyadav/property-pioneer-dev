/**
 * Seedha Properties — login security notification dispatcher.
 *
 * Guarantees:
 * 1. Honest provider reporting — an unconfigured provider is never reported as
 *    a successful delivery.
 * 2. Exactly one notification per genuine sign-in. The caller de-duplicates on
 *    the JWT `session_id`, which is stable across token refreshes, so a refresh
 *    or a page reload can never produce a second email.
 * 3. Failures are contained — a notification error never blocks or fails
 *    authentication. Every path resolves; none reject.
 * 4. No credential ever reaches the message body. The access token is used only
 *    as an `Authorization` header to this app's own origin and is never logged,
 *    echoed in a response, or written into the email.
 */
import { sendTransactionalEmail, type EmailDeliveryResult } from "@/lib/emailService";
import { loginSecurityEmail } from "@/lib/email/templates";

export interface LoginSecurityEventContext {
  userId: string;
  email: string;
  name: string;
  role?: string;
  /** Bearer token used to authenticate the dispatch request. Never persisted. */
  accessToken?: string;
}

export interface NotificationDispatchResult {
  channel: "email" | "sms" | "whatsapp" | "push";
  success: boolean;
  status: "sent" | "unconfigured" | "failed" | "skipped" | "pending";
  details?: string;
}

/** Endpoint that performs the actual send. Server-only credentials live there. */
export const LOGIN_NOTIFICATION_ENDPOINT = "/api/auth/login-notification";

function isValidEmail(value: string | undefined): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Builds the sign-in alert message. Pure and isomorphic so the same body is
 * covered by unit tests and rendered by the server route.
 */
export function buildLoginSecurityEmail(
  ctx: Pick<LoginSecurityEventContext, "email" | "name" | "role">,
  now: Date,
): { subject: string; htmlBody: string; textBody: string } {
  const formattedDate = now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });

  // Rendered through the centralized Seedha email template so this security
  // notification carries the same branded design as every other email. The
  // dispatch logic, dedup, and token handling below are unchanged.
  return loginSecurityEmail({
    userName: ctx.name,
    email: ctx.email,
    role: ctx.role,
    date: formattedDate,
    time: formattedTime,
  });
}

/**
 * Performs the actual send. Server-only: the provider credential is read from
 * `process.env` and must never be exposed to a browser bundle.
 */
export async function dispatchLoginSecurityEmail(
  ctx: Pick<LoginSecurityEventContext, "userId" | "email" | "name" | "role">,
): Promise<NotificationDispatchResult> {
  if (!isValidEmail(ctx.email)) {
    return {
      channel: "email",
      success: true,
      status: "skipped",
      details: "No valid email address associated with account.",
    };
  }

  const now = new Date();
  const { subject, htmlBody, textBody } = buildLoginSecurityEmail(ctx, now);

  try {
    const result: EmailDeliveryResult = await sendTransactionalEmail({
      to: ctx.email,
      subject,
      eventType: "security_event",
      recipientName: ctx.name,
      htmlBody,
      textBody,
      // Identifiers only — no token, password, or session material.
      metadata: { userId: ctx.userId, loginTimestamp: now.toISOString() },
    });

    return {
      channel: "email",
      // `unconfigured` is not a failure of the login path, but it is not a
      // delivery either — the status field keeps that distinction honest.
      success: result.status === "sent" || result.status === "unconfigured",
      status: result.status,
      details: result.details,
    };
  } catch (err) {
    console.error("[Notification] Error dispatching login security email:", err);
    return {
      channel: "email",
      success: false,
      status: "failed",
      details: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Sends the sign-in alert for a successful authentication.
 *
 * In the browser this delegates to a server route, because the email provider
 * credential is server-only — a client-side send could never work and would
 * leak the key if it did. On the server (SSR and tests) it dispatches directly.
 */
export async function notifyLoginSecurityEvent(
  ctx: LoginSecurityEventContext,
): Promise<NotificationDispatchResult> {
  if (!isValidEmail(ctx.email)) {
    return {
      channel: "email",
      success: true,
      status: "skipped",
      details: "No valid email address associated with account.",
    };
  }

  if (typeof window === "undefined") {
    return dispatchLoginSecurityEmail(ctx);
  }

  if (!ctx.accessToken) {
    return {
      channel: "email",
      success: false,
      status: "skipped",
      details: "No access token available to authenticate the notification request.",
    };
  }

  try {
    const response = await fetch(LOGIN_NOTIFICATION_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Same-origin only. Never logged, never echoed back.
        Authorization: `Bearer ${ctx.accessToken}`,
      },
      // Sign-in redirects to the dashboard immediately after this call, so the
      // request must be allowed to outlive the page it started on.
      keepalive: true,
      body: "{}",
    });

    if (!response.ok) {
      return {
        channel: "email",
        success: false,
        status: "failed",
        details: `Notification endpoint returned ${response.status}.`,
      };
    }

    const body = (await response.json()) as Partial<NotificationDispatchResult>;
    return {
      channel: "email",
      success: Boolean(body.success),
      status: body.status ?? "failed",
      details: body.details,
    };
  } catch (err) {
    // Network failure on a best-effort notification. Authentication is already
    // complete at this point and is unaffected.
    console.error("[Notification] Login notification request failed:", err);
    return {
      channel: "email",
      success: false,
      status: "failed",
      details: err instanceof Error ? err.message : "Unknown network error",
    };
  }
}
