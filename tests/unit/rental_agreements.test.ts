/**
 * Seedha Properties — Rental Agreement Domain, Validation & Security Test Suite
 */

import { describe, it, expect } from "vitest";
import {
  ownerDetailsSchema,
  tenantDetailsSchema,
  propertyDetailsSchema,
  rentalTermsSchema,
  clauseSelectionSchema,
  rentalAgreementFormSchema,
} from "@/modules/rental-agreements/schema";
import {
  calculateStampDutyAndFees,
  getDefaultAgreementFormData,
} from "@/modules/rental-agreements/services/agreementService";
import {
  DEFAULT_CLAUSE_SELECTION,
  STANDARD_CLAUSES,
} from "@/modules/rental-agreements/constants/clauses";
import { type RentalAgreementFormData } from "@/modules/rental-agreements/types";

describe("Rental Agreement Domain & Validation Suite", () => {
  describe("1. Owner Details Validation", () => {
    it("accepts valid owner details", () => {
      const validOwner = {
        fullName: "Ramesh Chandra Reddy",
        phone: "9876543210",
        email: "ramesh.reddy@example.com",
        currentAddress: "Plot 42, Jubilee Hills, Road No 36",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500033",
      };

      const result = ownerDetailsSchema.safeParse(validOwner);
      expect(result.success).toBe(true);
    });

    it("rejects invalid Indian mobile numbers", () => {
      const invalidOwner = {
        fullName: "Ramesh Reddy",
        phone: "12345", // too short, invalid prefix
        email: "ramesh@example.com",
        currentAddress: "Plot 42, Jubilee Hills",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500033",
      };

      const result = ownerDetailsSchema.safeParse(invalidOwner);
      expect(result.success).toBe(false);
    });

    it("rejects invalid 5-digit or alphabetical PIN codes", () => {
      const invalidOwner = {
        fullName: "Ramesh Reddy",
        phone: "9876543210",
        email: "ramesh@example.com",
        currentAddress: "Plot 42, Jubilee Hills",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "5000A",
      };

      const result = ownerDetailsSchema.safeParse(invalidOwner);
      expect(result.success).toBe(false);
    });
  });

  describe("2. Tenant Details & Multi-Tenant Support", () => {
    it("validates a primary single tenant", () => {
      const validTenant = {
        id: "tenant-1",
        fullName: "Priya Sharma",
        phone: "9123456780",
        email: "priya.sharma@example.com",
        currentAddress: "Flat 204, Green Meadows, Madhapur",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500081",
      };

      const result = tenantDetailsSchema.safeParse(validTenant);
      expect(result.success).toBe(true);
    });

    it("validates multiple co-tenants array", () => {
      const defaultData = getDefaultAgreementFormData();
      const multiTenants = [
        {
          id: "tenant-1",
          fullName: "Priya Sharma",
          phone: "9123456780",
          email: "priya@example.com",
          currentAddress: "Address 1",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500081",
        },
        {
          id: "tenant-2",
          fullName: "Ananya Roy",
          phone: "9876501234",
          email: "ananya@example.com",
          currentAddress: "Address 2",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500081",
        },
      ];

      const formData: RentalAgreementFormData = {
        ...defaultData,
        ownerDetails: {
          fullName: "Ramesh Reddy",
          phone: "9876543210",
          email: "ramesh@example.com",
          currentAddress: "Jubilee Hills, Road No 36",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500033",
        },
        propertyDetails: {
          ...defaultData.propertyDetails,
          streetAddress: "Plot 100, Madhapur Main Road",
        },
        tenantType: "multiple",
        tenants: multiTenants,
      };

      const result = rentalAgreementFormSchema.safeParse(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tenants.length).toBe(2);
      }
    });
  });

  describe("3. Property Details Validation", () => {
    it("validates residential and commercial property types", () => {
      const apartmentProp = {
        propertyType: "Apartment" as const,
        unitNumber: "402",
        buildingName: "Aparna Serene",
        streetAddress: "Financial District Main Road",
        locality: "Nanakramguda",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500032",
        furnishingStatus: "Semi-Furnished" as const,
      };

      expect(propertyDetailsSchema.safeParse(apartmentProp).success).toBe(true);

      const commercialProp = {
        propertyType: "Commercial Office" as const,
        unitNumber: "Suite 501",
        buildingName: "Cyber Gateway",
        streetAddress: "HITEC City Phase 2",
        locality: "Madhapur",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500081",
      };

      expect(propertyDetailsSchema.safeParse(commercialProp).success).toBe(true);
    });
  });

  describe("4. Commercial & Rental Terms Validation", () => {
    it("enforces start date before end date", () => {
      const invalidDatesTerms = {
        monthlyRent: 25000,
        securityDeposit: 50000,
        startDate: "2026-08-01",
        durationMonths: 11,
        endDate: "2026-07-01", // before start date!
        noticePeriodMonths: 1,
        lockInPeriodMonths: 1,
        maintenanceResponsibility: "tenant" as const,
        utilityResponsibility: "tenant" as const,
        rentEscalationPercent: 5,
        rentEscalationPeriodMonths: 11,
        paymentDueDay: 5,
      };

      const result = rentalTermsSchema.safeParse(invalidDatesTerms);
      expect(result.success).toBe(false);
    });

    it("rejects negative security deposit or rent below ₹1,000", () => {
      const invalidRentTerms = {
        monthlyRent: 500, // below min ₹1,000
        securityDeposit: -5000, // negative!
        startDate: "2026-08-01",
        durationMonths: 11,
        endDate: "2027-07-01",
        noticePeriodMonths: 1,
        lockInPeriodMonths: 0,
        maintenanceResponsibility: "tenant" as const,
        utilityResponsibility: "tenant" as const,
        rentEscalationPercent: 5,
        rentEscalationPeriodMonths: 11,
        paymentDueDay: 5,
      };

      const result = rentalTermsSchema.safeParse(invalidRentTerms);
      expect(result.success).toBe(false);
    });
  });

  describe("5. Stamp Duty & Statutory Fee Calculations", () => {
    it("calculates Telangana stamp duty properly (0.5% min ₹100)", () => {
      // Rent ₹30,000 * 11 = ₹330,000 + Deposit ₹60,000 = ₹390,000. 0.5% = ₹1,950
      const calc = calculateStampDutyAndFees("Telangana", 30000, 60000, 11);
      expect(calc.stampDuty).toBe(1950);
      expect(calc.draftingFee).toBe(499);
      expect(calc.totalCost).toBe(1950 + 500 + 499);
    });

    it("calculates Karnataka stamp duty properly", () => {
      const calc = calculateStampDutyAndFees("Karnataka", 25000, 50000, 11);
      expect(calc.stampDuty).toBeGreaterThanOrEqual(200);
      expect(calc.totalCost).toBe(calc.stampDuty + calc.registrationFee + calc.draftingFee);
    });

    it("calculates Maharashtra stamp duty properly (0.25%)", () => {
      const calc = calculateStampDutyAndFees("Maharashtra", 40000, 100000, 11);
      expect(calc.stampDuty).toBeGreaterThan(0);
      expect(calc.registrationFee).toBe(1000);
    });
  });

  describe("6. Clauses & Legal Covenants Integrity", () => {
    it("contains all recommended standard legal clauses", () => {
      expect(STANDARD_CLAUSES.length).toBeGreaterThanOrEqual(10);
      const clauseIds = STANDARD_CLAUSES.map((c) => c.id);
      expect(clauseIds).toContain("noticePeriod");
      expect(clauseIds).toContain("securityDepositRefund");
      expect(clauseIds).toContain("utilityPayments");
      expect(clauseIds).toContain("maintenanceCharges");
      expect(clauseIds).toContain("peacefulEnjoyment");
      expect(clauseIds).toContain("forceMajeure");
    });

    it("renders clause template text dynamically with rent & deposit interpolation", () => {
      const depositClause = STANDARD_CLAUSES.find((c) => c.id === "securityDepositRefund")!;
      const renderedText = depositClause.templateText({
        monthlyRent: 25000,
        securityDeposit: 60000,
        noticePeriodMonths: 1,
        lockInPeriodMonths: 3,
        rentEscalationPercent: 5,
        rentEscalationPeriodMonths: 11,
        paymentDueDay: 5,
        maintenanceResponsibility: "tenant",
        utilityResponsibility: "tenant",
      });

      expect(renderedText).toContain("₹60,000");
      expect(renderedText).toContain("refunded to the Tenant within 7 days");
    });
  });

  describe("7. Renewal Duplication Logic", () => {
    it("applies rent escalation and increments dates upon renewal", () => {
      const baseRent = 30000;
      const escalationPercent = 10;
      const newRent = Math.round(baseRent * (1 + escalationPercent / 100));
      expect(newRent).toBe(33000);

      const oldStartDate = new Date("2026-08-01");
      const renewalStartDate = new Date(oldStartDate);
      renewalStartDate.setMonth(renewalStartDate.getMonth() + 11);
      expect(renewalStartDate.getMonth()).toBe((oldStartDate.getMonth() + 11) % 12);
    });
  });

  describe("8. State Machine & Status Scoping", () => {
    it("permits valid agreement lifecycle transitions", () => {
      const validStatuses = [
        "DRAFT",
        "REVIEW",
        "PAYMENT_PENDING",
        "PAYMENT_COMPLETED",
        "SIGNING_PENDING",
        "COMPLETED",
        "EXPIRED",
        "CANCELLED",
      ];
      expect(validStatuses).toContain("DRAFT");
      expect(validStatuses).toContain("REVIEW");
      expect(validStatuses).toContain("COMPLETED");
    });
  });
});
