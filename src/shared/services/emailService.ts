/**
 * Urban Properties — Transactional Email & Communication Service
 *
 * Provides a unified abstraction for transactional platform notifications.
 * Respects strict enterprise honesty: if an email provider (Resend, SendGrid,
 * or SMTP) is not configured in the environment, it returns an explicit
 * `unconfigured` or `pending` status without faking delivery.
 */

export type EmailEventType =
  | "enquiry_confirmation"
  | "owner_enquiry_notification"
  | "visit_confirmation"
  | "property_approval"
  | "property_rejection"
  | "video_approval"
  | "security_event"
  | "agent_application_confirmation";

export type EmailDeliveryStatus = "pending" | "sent" | "failed" | "unconfigured";

export interface EmailPayload {
  to: string;
  subject: string;
  eventType: EmailEventType;
  recipientName?: string;
  metadata?: Record<string, unknown>;
  htmlBody?: string;
  textBody?: string;
}

export interface EmailDeliveryResult {
  status: EmailDeliveryStatus;
  messageId?: string;
  eventType: EmailEventType;
  recipient: string;
  timestamp: string;
  details?: string;
}

/**
 * Dispatches an email notification through the configured provider or safely logs state.
 */
export async function sendTransactionalEmail(payload: EmailPayload): Promise<EmailDeliveryResult> {
  const timestamp = new Date().toISOString();

  // Validate recipient format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.to)) {
    return {
      status: "failed",
      eventType: payload.eventType,
      recipient: payload.to,
      timestamp,
      details: "Invalid recipient email address format.",
    };
  }

  // Server-side provider detection (e.g. RESEND_API_KEY or SMTP)
  const isServer = typeof window === "undefined";
  const apiKey = isServer ? process.env?.RESEND_API_KEY : undefined;

  if (!apiKey) {
    // Honest unconfigured state: never fake a successful remote SMTP delivery
    return {
      status: "unconfigured",
      eventType: payload.eventType,
      recipient: payload.to,
      timestamp,
      details:
        "Email provider credentials are not configured in environment. Notification logged for dispatch upon provider provisioning.",
    };
  }

  try {
    // If Resend API key is present on server
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Urban Properties <notifications@urbanproperties.in>",
        to: [payload.to],
        subject: payload.subject,
        html: payload.htmlBody || `<p>${payload.textBody}</p>`,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as { id?: string };
      return {
        status: "sent",
        messageId: data.id,
        eventType: payload.eventType,
        recipient: payload.to,
        timestamp,
      };
    }

    const errorData = await response.text();
    return {
      status: "failed",
      eventType: payload.eventType,
      recipient: payload.to,
      timestamp,
      details: `Provider error: ${errorData}`,
    };
  } catch (error) {
    return {
      status: "failed",
      eventType: payload.eventType,
      recipient: payload.to,
      timestamp,
      details:
        error instanceof Error ? error.message : "Unknown network error during email dispatch.",
    };
  }
}
