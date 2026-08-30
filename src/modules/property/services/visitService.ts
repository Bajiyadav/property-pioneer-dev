import { z } from "zod";

/**
 * Shared client/server contract for site-visit requests.
 *
 * Every visit-booking surface goes through this one path. Before it there were
 * three: one wrote to `enquiries` as an encoded string, one inserted columns
 * that `property_visits` does not have, and one only recorded an audit event
 * and stored no visit at all — while all three told the visitor it worked.
 */

/** The slots offered to a visitor, and the only values the API accepts. */
export const VISIT_SLOTS = [
  "Morning (9 AM - 12 PM)",
  "Afternoon (12 PM - 4 PM)",
  "Evening (4 PM - 7 PM)",
] as const;

export type VisitSlot = (typeof VISIT_SLOTS)[number];

export const visitRequestSchema = z.object({
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
  /** ISO date, `YYYY-MM-DD`. The server also rejects dates in the past. */
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Please choose a visit date" }),
  preferredSlot: z.enum(VISIT_SLOTS, { message: "Please choose a time slot" }),
  visitType: z.enum(["in_person", "video_call"]).default("in_person"),
  notes: z.string().trim().max(1000, { message: "Notes must be under 1000 characters" }).optional(),
  /** Honeypot — must stay empty. Bots fill it in. */
  company: z.string().max(0, { message: "Rejected" }).optional().default(""),
});

export type VisitRequestInput = z.input<typeof visitRequestSchema>;

export type VisitResult =
  { ok: true; visitId?: string } | { ok: false; error: string; retryAfterSeconds?: number };

/**
 * Books a site visit.
 *
 * Always awaits the response and reports what actually happened. A caller must
 * branch on `ok` before showing a confirmation — announcing success without
 * reading this is the specific bug this service exists to end.
 */
export async function scheduleVisit(input: VisitRequestInput): Promise<VisitResult> {
  const res = await fetch(
    `/api/public/properties/${encodeURIComponent(input.propertyId)}/schedule-visit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  let payload: { error?: string; retryAfterSeconds?: number; visitId?: string } = {};
  try {
    payload = (await res.json()) as typeof payload;
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    return {
      ok: false,
      error: payload.error ?? "Could not schedule your visit. Please try again.",
      retryAfterSeconds: payload.retryAfterSeconds,
    };
  }
  return { ok: true, visitId: payload.visitId };
}
