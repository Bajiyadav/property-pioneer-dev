import { z } from "zod";

/** Shared client/server contract for property enquiries. */

export const MIN_SUBMIT_MS = 2500;
export const MAX_FORM_AGE_MS = 1000 * 60 * 60 * 6;

export const enquiryInputSchema = z.object({
  propertyId: z.string().uuid({ message: "Invalid property" }),
  name: z
    .string()
    .trim()
    .min(2, { message: "Please enter your name" })
    .max(100, { message: "Name must be under 100 characters" }),
  phone: z
    .string()
    .trim()
    .min(7, { message: "Please enter a valid phone number" })
    .max(20, { message: "Phone number is too long" })
    .regex(/^[0-9+\-()\s]+$/, { message: "Phone number has invalid characters" }),
  message: z
    .string()
    .trim()
    .min(5, { message: "Please add a short message" })
    .max(1000, { message: "Message must be under 1000 characters" }),
  /** Honeypot — must stay empty. Bots fill it in. */
  company: z.string().max(0, { message: "Rejected" }).optional().default(""),
  /** Milliseconds between form render and submit. */
  elapsedMs: z.number().int().nonnegative().max(MAX_FORM_AGE_MS),
  turnstileToken: z.string().max(4096).optional(),
});

export type EnquiryInput = z.infer<typeof enquiryInputSchema>;

export type EnquiryResult =
  { ok: true; whatsappUrl?: string } | { ok: false; error: string; retryAfterSeconds?: number };

export async function submitEnquiry(input: EnquiryInput): Promise<EnquiryResult> {
  const res = await fetch("/api/public/enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  let payload: { error?: string; retryAfterSeconds?: number; whatsappUrl?: string } = {};
  try {
    payload = (await res.json()) as typeof payload;
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    return {
      ok: false,
      error: payload.error ?? "Could not send your enquiry. Please try again.",
      retryAfterSeconds: payload.retryAfterSeconds,
    };
  }
  return { ok: true, whatsappUrl: payload.whatsappUrl };
}

export const TURNSTILE_SITE_KEY: string | undefined =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_TURNSTILE_SITE_KEY) || undefined;
