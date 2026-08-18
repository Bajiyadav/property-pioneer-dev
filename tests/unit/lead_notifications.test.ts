import { describe, it, expect, vi } from "vitest";
import {
  formatPhoneNumber,
  buildWhatsAppLeadMessage,
  generateWhatsAppDirectUrl,
  dispatchLeadNotification,
} from "@/modules/notifications/services/leadNotificationService.server";

describe("Automated Lead Notifications", () => {
  it("formats standard 10-digit Indian phone number to international 91 prefix", () => {
    expect(formatPhoneNumber("9876543210")).toBe("919876543210");
    expect(formatPhoneNumber("+91 98765 43210")).toBe("919876543210");
    expect(formatPhoneNumber("09876543210")).toBe("919876543210");
  });

  it("builds a clean structured WhatsApp lead template with property and customer details", () => {
    const message = buildWhatsAppLeadMessage({
      propertyId: "prop-123",
      propertyTitle: "Luxury 3BHK in Gachibowli",
      propertyAddress: "Financial District, Hyderabad",
      customerName: "Rahul Sharma",
      customerPhone: "9876543210",
      customerMessage: "Hi, I would like to schedule a visit tomorrow at 11 AM.",
    });

    expect(message).toContain("New Property Enquiry - Seedha Properties");
    expect(message).toContain("Luxury 3BHK in Gachibowli");
    expect(message).toContain("Rahul Sharma");
    expect(message).toContain("9876543210");
    expect(message).toContain("Financial District, Hyderabad");
  });

  it("generates a valid WhatsApp click-to-chat deep link URL", () => {
    const url = generateWhatsAppDirectUrl("9876543210", "Hello owner!");
    expect(url).toContain("https://wa.me/919876543210?text=Hello%20owner!");
  });

  it("dispatches in-app notification to the owner", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockDb = {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    } as unknown as Parameters<typeof dispatchLeadNotification>[0];

    const result = await dispatchLeadNotification(mockDb, {
      propertyId: "prop-123",
      propertyTitle: "Luxury 3BHK in Gachibowli",
      ownerId: "owner-user-id",
      ownerPhone: "9988776655",
      customerName: "Sneha Reddy",
      customerPhone: "9123456789",
      customerMessage: "Is this property pet friendly?",
    });

    expect(mockDb.from).toHaveBeenCalledWith("notifications");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "owner-user-id",
        title: expect.stringContaining("Luxury 3BHK in Gachibowli"),
        kind: "info",
      }),
    );
    expect(result.inAppNotificationCreated).toBe(true);
    expect(result.whatsappDirectUrl).toContain("https://wa.me/919988776655");
  });
});
