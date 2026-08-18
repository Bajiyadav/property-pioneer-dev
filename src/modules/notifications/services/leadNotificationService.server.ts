import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface LeadDetails {
  propertyId: string;
  propertyTitle: string;
  propertyAddress?: string;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  customerName: string;
  customerPhone: string;
  customerMessage: string;
}

export interface NotificationResult {
  inAppNotificationCreated: boolean;
  whatsappMessageSent: boolean;
  smsMessageSent: boolean;
  whatsappDirectUrl: string;
}

/**
 * Normalizes phone number into international WhatsApp/SMS format (defaults to India +91).
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Builds the WhatsApp notification template for new property leads.
 */
export function buildWhatsAppLeadMessage(lead: LeadDetails): string {
  return [
    `🏠 *New Property Enquiry - Seedha Properties*`,
    ``,
    `*Property:* ${lead.propertyTitle}`,
    lead.propertyAddress ? `*Location:* ${lead.propertyAddress}` : null,
    ``,
    `👤 *Lead Details:*`,
    `• *Name:* ${lead.customerName}`,
    `• *Phone:* ${lead.customerPhone}`,
    `• *Message:* "${lead.customerMessage}"`,
    ``,
    `_Received via Seedha Properties Platform. Direct owner connect enabled._`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/**
 * Generates direct WhatsApp click-to-chat URL for instant response.
 */
export function generateWhatsAppDirectUrl(recipientPhone: string, text: string): string {
  const formattedPhone = formatPhoneNumber(recipientPhone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Dispatches automated notifications across In-App, WhatsApp, and SMS channels.
 */
export async function dispatchLeadNotification(
  db: SupabaseClient<Database>,
  lead: LeadDetails,
): Promise<NotificationResult> {
  const result: NotificationResult = {
    inAppNotificationCreated: false,
    whatsappMessageSent: false,
    smsMessageSent: false,
    whatsappDirectUrl: "",
  };

  const messageText = buildWhatsAppLeadMessage(lead);

  // 1. In-App Notification (Stored in Supabase database for the owner)
  if (lead.ownerId) {
    try {
      const { error } = await db.from("notifications").insert({
        user_id: lead.ownerId,
        title: `New lead for ${lead.propertyTitle}`,
        body: `${lead.customerName} (${lead.customerPhone}): "${lead.customerMessage.slice(0, 80)}..."`,
        kind: "info",
      });

      if (!error) {
        result.inAppNotificationCreated = true;
      } else {
        console.warn("[leadNotification] In-app notification creation failed:", error);
      }
    } catch (err) {
      console.warn("[leadNotification] In-app notification error:", err);
    }
  }

  // 2. Generate WhatsApp Direct Click-To-Chat URL
  const targetPhone = lead.ownerPhone || lead.customerPhone;
  if (targetPhone) {
    result.whatsappDirectUrl = generateWhatsAppDirectUrl(targetPhone, messageText);
  }

  // 3. Automated WhatsApp Dispatch (via Meta WhatsApp Cloud API or configured Webhook)
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const whatsappWebhook = process.env.WHATSAPP_WEBHOOK_URL;

  if (whatsappPhoneId && whatsappToken && targetPhone) {
    try {
      const formattedPhone = formatPhoneNumber(targetPhone);
      const res = await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: { body: messageText },
        }),
      });

      if (res.ok) {
        result.whatsappMessageSent = true;
      }
    } catch (err) {
      console.error("[leadNotification] Meta WhatsApp API failed:", err);
    }
  } else if (whatsappWebhook && targetPhone) {
    try {
      const res = await fetch(whatsappWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: formatPhoneNumber(targetPhone),
          message: messageText,
          property_id: lead.propertyId,
          customer_name: lead.customerName,
          customer_phone: lead.customerPhone,
        }),
      });
      if (res.ok) {
        result.whatsappMessageSent = true;
      }
    } catch (err) {
      console.error("[leadNotification] WhatsApp webhook failed:", err);
    }
  }

  // 4. Automated SMS Dispatch (via SMS Gateway if configured in .env)
  const smsGatewayUrl = process.env.SMS_GATEWAY_URL;
  if (smsGatewayUrl && targetPhone) {
    try {
      const res = await fetch(smsGatewayUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: formatPhoneNumber(targetPhone),
          text: `[Seedha Properties] New enquiry on ${lead.propertyTitle} from ${lead.customerName} (${lead.customerPhone}): "${lead.customerMessage.slice(0, 60)}"`,
        }),
      });
      if (res.ok) {
        result.smsMessageSent = true;
      }
    } catch (err) {
      console.error("[leadNotification] SMS gateway failed:", err);
    }
  }

  return result;
}
