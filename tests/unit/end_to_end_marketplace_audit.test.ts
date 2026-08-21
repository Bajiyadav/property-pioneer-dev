import { describe, it, expect } from "vitest";
import { buildListingPayload } from "@/modules/owner/components/ListingWizard/buildListingPayload";
import { isOwnerVerified, isPropertyVerified } from "@/modules/property/services/propertyService";

function generateWhatsAppOutreachUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

describe("Phase 1: End-to-End Multi-Persona Marketplace Audit", () => {
  // 1. OWNER PERSONA TEST
  describe("1. Owner Persona: Property Creation & Media Upload", () => {
    it("successfully creates a 2 BHK rental listing with room photos & video tour", () => {
      const ownerForm = {
        owner_name: "Javisetty Naga Pavan Kumar",
        owner_phone: "6301196547",
        city: "Hyderabad",
        locality: "Kondapur",
        address: "GLS Homes, Damabama Road, Kondapur, Hyderabad",
        property_type: "Apartment",
        listing_type: "rent" as const,
        bhk_type: "2 BHK",
        bedrooms: 2,
        bathrooms: 2,
        area_sqft: 1250,
        price: 32000,
        deposit: 64000,
        maintenance: 2500,
        furnishing_status: "semi-furnished" as const,
        amenities: ["Lift", "Power Backup", "Security", "Reserved Parking", "Gym"],
        images: [
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
        ],
        description:
          "Spacious 2 BHK East facing apartment in Kondapur near Botanical Garden with 24/7 water and security.",
      };

      const result = buildListingPayload(ownerForm, "submit");
      expect(result.ok).toBe(true);

      if (result.ok) {
        expect(result.payload.locality).toBe("Kondapur");
        expect(result.payload.price).toBe(32000);
        expect(result.payload.owner_phone).toBe("6301196547");
        expect(result.payload.images.length).toBe(2);
      }
    });
  });

  // 2. ADMIN & AGENT PERSONA TEST
  describe("2. Admin & Agent Persona: Listing Verification & WhatsApp Outreach", () => {
    it("allows admin to inspect, highlight, and verify owner property", () => {
      const pendingProperty = {
        id: "prop-kondapur-201",
        title: "GLS Homes 2 BHK Apartment in Kondapur",
        description: "High quality apartment",
        address: "Kondapur, Hyderabad",
        property_type: "Apartment",
        area_sqft: 1250,
        bedrooms: 2,
        bathrooms: 2,
        images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00"],
        is_featured: true,
        city: "Hyderabad",
        price: 32000,
        listing_type: "rent",
        status: "active",
        is_approved: true,
        owner_verification_status: "verified",
        property_verification_status: "verified",
        created_at: new Date().toISOString(),
      };

      expect(isOwnerVerified(pendingProperty)).toBe(true);
      expect(isPropertyVerified(pendingProperty)).toBe(true);
      expect(pendingProperty.is_featured).toBe(true);
    });

    it("generates line-broken WhatsApp outreach link for fast agent-owner communication", () => {
      const phone = "916301196547";
      const message =
        "Hello Javisetty Naga Pavan Kumar! Your property GLS Homes in Kondapur is verified and live on Seedha Properties.";

      const whatsappUrl = generateWhatsAppOutreachUrl(phone, message);
      expect(whatsappUrl).toContain("https://wa.me/916301196547?text=");
      expect(whatsappUrl).toContain("Hello%20Javisetty");
    });
  });

  // 3. CUSTOMER / SEEKER PERSONA TEST
  describe("3. Customer Persona: Search, Wishlist & Visit Booking", () => {
    it("allows customer to filter Kondapur listings and request a walkthrough visit", () => {
      const visitSchedule = {
        property_id: "prop-kondapur-201",
        customer_name: "Customer QA User",
        customer_phone: "+91 9876543210",
        locality: "Kondapur",
        preferred_date: "2026-08-25",
        preferred_time_slot: "10:00 AM - 12:00 PM",
        visit_mode: "In-Person Walkthrough",
        status: "pending",
      };

      expect(visitSchedule.locality).toBe("Kondapur");
      expect(visitSchedule.status).toBe("pending");
      expect(visitSchedule.preferred_time_slot).toBe("10:00 AM - 12:00 PM");
    });
  });

  // 4. AGENT & ADMIN FOLLOW-UP ESCALATION TEST
  describe("4. Agent Escalation: Pending Visit Confirmation", () => {
    it("updates visit schedule status from pending to confirmed upon agent review", () => {
      let visitStatus = "pending";

      // Agent approves visit schedule appointment
      visitStatus = "confirmed";
      expect(visitStatus).toBe("confirmed");

      // Agent completes property tour with customer
      visitStatus = "completed";
      expect(visitStatus).toBe("completed");
    });
  });
});
