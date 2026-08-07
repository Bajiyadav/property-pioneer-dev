import { recordAudit } from "@/lib/security.server";

export type AuditEventType =
  | "property_viewed"
  | "property_shared"
  | "contact_requested"
  | "contact_completed"
  | "whatsapp_clicked"
  | "email_clicked"
  | "visit_requested"
  | "owner_verified"
  | "property_approved"
  | "property_rejected"
  | "admin_action";

export interface LogAuditParams {
  event: AuditEventType;
  ip: string;
  userAgent?: string;
  userId?: string;
  propertyId?: string;
  details?: Record<string, unknown>;
}

export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  const { event, ip, userAgent, userId, propertyId, details } = params;
  await recordAudit({
    event,
    outcome: "success",
    ip,
    userAgent,
    actorId: userId,
    subjectType: propertyId ? "property" : undefined,
    subjectId: propertyId,
    details: {
      timestamp: new Date().toISOString(),
      ...details,
    },
  });
}
