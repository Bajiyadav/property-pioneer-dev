import { describe, it, expect } from "vitest";
import { sendTransactionalEmail } from "@/shared/services/emailService";

describe("Transactional Email Service", () => {
  it("rejects an invalid email format", async () => {
    const result = await sendTransactionalEmail({
      to: "invalid-email-string",
      subject: "Test Visit",
      eventType: "visit_confirmation",
    });

    expect(result.status).toBe("failed");
    expect(result.details).toContain("Invalid recipient email address format");
  });

  it("handles unconfigured provider without faking delivery", async () => {
    const result = await sendTransactionalEmail({
      to: "tenant@example.com",
      subject: "Your Visit is Requested",
      eventType: "visit_confirmation",
      textBody: "Visit requested for Gachibowli rental.",
    });

    expect(result.status).toBe("unconfigured");
    expect(result.recipient).toBe("tenant@example.com");
    expect(result.eventType).toBe("visit_confirmation");
    expect(result.details).toContain("not configured");
  });

  it("accurately handles enquiry confirmation event", async () => {
    const result = await sendTransactionalEmail({
      to: "customer@example.com",
      subject: "Enquiry Received",
      eventType: "enquiry_confirmation",
    });

    expect(result.status).toBe("unconfigured");
    expect(result.eventType).toBe("enquiry_confirmation");
  });
});
