import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const REGION = process.env.AWS_REGION || "ap-south-1";
const SENDER_EMAIL = process.env.SES_SENDER_EMAIL || "no-reply@seedhaproperties.com";

let sesClientInstance: SESClient | null = null;

function getSesClient(): SESClient {
  if (!sesClientInstance) {
    const config: any = { region: REGION };
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }
    sesClientInstance = new SESClient(config);
  }
  return sesClientInstance;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;
  status: "delivered" | "mocked" | "failed";
  error?: string;
}

/**
 * Sends a transactional email using AWS SES.
 * Automatically falls back to mock delivery in local/test environments if SES credentials are not present.
 */
export async function sendTransactionalEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const hasAwsConfig = !!(
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME
  );

  if (!hasAwsConfig || process.env.NODE_ENV === "test") {
    // Graceful mock in local dev / tests
    return {
      ok: true,
      messageId: `mock-ses-${crypto.randomUUID()}`,
      status: "mocked",
    };
  }

  try {
    const client = getSesClient();
    const command = new SendEmailCommand({
      Source: SENDER_EMAIL,
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: options.htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: options.textBody || options.subject,
            Charset: "UTF-8",
          },
        },
      },
    });

    const response = await client.send(command);
    return {
      ok: true,
      messageId: response.MessageId,
      status: "delivered",
    };
  } catch (error: any) {
    console.error("[AWS SES Error]", error);
    return {
      ok: false,
      status: "failed",
      error: error?.message || "Failed to send email via AWS SES",
    };
  }
}

/**
 * Pre-formatted transactional email templates
 */
export const EmailTemplates = {
  enquiryNotification: (
    ownerName: string,
    propertyTitle: string,
    seekerName: string,
    seekerPhone: string,
    message: string,
  ) => ({
    subject: `New Direct Seeker Enquiry for "${propertyTitle}" - Seedha Deals`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0284c7;">Seedha Properties - Direct Buyer/Tenant Lead</h2>
        <p>Hi <strong>${ownerName || "Property Owner"}</strong>,</p>
        <p>A verified customer has submitted a direct inquiry on your listing <strong>${propertyTitle}</strong>.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Seeker Name:</strong> ${seekerName}</p>
          <p><strong>Contact Phone:</strong> ${seekerPhone}</p>
          <p><strong>Message:</strong> "${message || "I am interested in this property."}"</p>
        </div>
        <p style="font-size: 12px; color: #64748b;">Seedha Deals • 100% Direct Owner • Zero Brokerage</p>
      </div>
    `,
  }),

  visitConfirmation: (
    visitorName: string,
    propertyTitle: string,
    visitDate: string,
    visitTime: string,
  ) => ({
    subject: `Site Visit Confirmed for "${propertyTitle}" - Seedha Deals`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0284c7;">Site Visit Confirmed</h2>
        <p>Hi <strong>${visitorName}</strong>,</p>
        <p>Your property site visit has been scheduled:</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Property:</strong> ${propertyTitle}</p>
          <p><strong>Date:</strong> ${visitDate}</p>
          <p><strong>Time:</strong> ${visitTime}</p>
        </div>
        <p style="font-size: 12px; color: #64748b;">Seedha Deals • Direct Connections</p>
      </div>
    `,
  }),
};
