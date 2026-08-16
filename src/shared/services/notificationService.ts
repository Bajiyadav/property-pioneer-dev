/**
 * Urban Properties — login security notification dispatcher.
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
import { sendTransactionalEmail, type EmailDeliveryResult } from "@/shared/services/emailService";
import { APP_NAME } from "@/config/app";

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

const SUPPORT_EMAIL = "support@urbanproperties.in";

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

  const subject = `New sign-in to your ${APP_NAME} account`;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 12px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 20px;">${APP_NAME} Security Alert</h2>
      </div>

      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
        Hello <strong>${ctx.name}</strong>,
      </p>

      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        We detected a successful sign-in to your <strong>${APP_NAME}</strong> account.
      </p>

      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding: 4px 0; width: 120px;"><strong>Account:</strong></td>
            <td style="color: #0f172a; padding: 4px 0;">${ctx.email}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;"><strong>Date:</strong></td>
            <td style="color: #0f172a; padding: 4px 0;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;"><strong>Time:</strong></td>
            <td style="color: #0f172a; padding: 4px 0;">${formattedTime}</td>
          </tr>
          ${ctx.role ? `<tr><td style="color: #64748b; padding: 4px 0;"><strong>Access Level:</strong></td><td style="color: #0f172a; padding: 4px 0; text-transform: uppercase;">${ctx.role}</td></tr>` : ""}
        </table>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #475569; margin-bottom: 16px;">
        If you initiated this sign-in, no further action is required.
      </p>

      <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 14px; border-radius: 8px; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #9f1239; margin: 0; font-weight: 600;">
          If this wasn't you:
        </p>
        <p style="font-size: 12px; color: #be123c; margin: 6px 0 0 0;">
          Please immediately reset your password and contact our trust &amp; security team at <a href="mailto:${SUPPORT_EMAIL}" style="color: #be123c; text-decoration: underline;">${SUPPORT_EMAIL}</a>.
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
        <p style="margin: 0;">This is an automated security notification regarding your ${APP_NAME} account.</p>
        <p style="margin: 4px 0 0 0;">© ${now.getFullYear()} ${APP_NAME}. All rights reserved.</p>
      </div>
    </div>
  `;

  const textBody = `
${APP_NAME} Security Alert: New Sign-in Detected

Hello ${ctx.name},

A new sign-in was detected for your account (${ctx.email}) on ${formattedDate} at ${formattedTime}.

If you initiated this sign-in, you can safely disregard this message.

If this was not you, please immediately change your password and contact ${SUPPORT_EMAIL}.
  `.trim();

  return { subject, htmlBody, textBody };
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
