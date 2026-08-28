/**
 * Seedha Properties — Rental Agreement Zod Validation Schemas
 */

import { z } from "zod";

const phoneRegex = /^[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;

export const ownerDetailsSchema = z.object({
  fullName: z.string().trim().min(3, "Owner full name must be at least 3 characters").max(100),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid 10-digit Indian mobile number (e.g. 9876543210)"),
  email: z.string().trim().email("Enter a valid email address"),
  panOrId: z.string().trim().max(50).optional(),
  idDocumentUrl: z.string().trim().optional(),
  currentAddress: z.string().trim().min(5, "Address must be at least 5 characters").max(300),
  city: z.string().trim().min(2, "City is required").max(100),
  state: z.string().trim().min(2, "State is required").max(100),
  pincode: z.string().trim().regex(pincodeRegex, "PIN code must be exactly 6 digits"),
});

export const tenantDetailsSchema = z.object({
  id: z.string(),
  fullName: z.string().trim().min(3, "Tenant full name must be at least 3 characters").max(100),
  phone: z.string().trim().regex(phoneRegex, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().trim().email("Enter a valid email address"),
  panOrId: z.string().trim().max(50).optional(),
  idDocumentUrl: z.string().trim().optional(),
  currentAddress: z.string().trim().min(5, "Address must be at least 5 characters").max(300),
  city: z.string().trim().min(2, "City is required").max(100),
  state: z.string().trim().min(2, "State is required").max(100),
  pincode: z.string().trim().regex(pincodeRegex, "PIN code must be exactly 6 digits"),
});

export const propertyDetailsSchema = z.object({
  propertyType: z.enum([
    "Apartment",
    "Independent House",
    "Villa",
    "Commercial Office",
    "Commercial Shop",
    "Other",
  ]),
  unitNumber: z.string().trim().max(50).optional(),
  buildingName: z.string().trim().max(100).optional(),
  streetAddress: z.string().trim().min(5, "Street address must be at least 5 characters").max(300),
  locality: z.string().trim().min(2, "Locality/Neighborhood is required").max(100),
  city: z.string().trim().min(2, "City is required").max(100),
  state: z.string().trim().min(2, "State is required").max(100),
  pincode: z.string().trim().regex(pincodeRegex, "PIN code must be exactly 6 digits"),
  totalAreaSqFt: z.number().int().positive("Area must be greater than 0").max(100000).optional(),
  furnishingStatus: z.enum(["Fully Furnished", "Semi-Furnished", "Unfurnished"]).optional(),
  fittingsAndFixtures: z.string().trim().max(1000).optional(),
  ownershipDocumentUrl: z.string().trim().optional(),
});

export const rentalTermsSchema = z
  .object({
    monthlyRent: z
      .number()
      .int()
      .min(1000, "Monthly rent must be at least ₹1,000")
      .max(10000000, "Rent exceeds maximum limit"),
    securityDeposit: z
      .number()
      .int()
      .min(0, "Security deposit cannot be negative")
      .max(50000000, "Deposit exceeds limit"),
    startDate: z.string().min(10, "Valid start date is required"),
    durationMonths: z
      .number()
      .int()
      .min(1, "Duration must be at least 1 month")
      .max(60, "Duration cannot exceed 60 months"),
    endDate: z.string().min(10, "Valid end date is required"),
    noticePeriodMonths: z.number().int().min(1, "Notice period must be at least 1 month").max(6),
    lockInPeriodMonths: z.number().int().min(0, "Lock-in period cannot be negative").max(24),
    maintenanceResponsibility: z.enum(["landlord", "tenant"]),
    maintenanceAmountMonthly: z.number().int().min(0).optional(),
    utilityResponsibility: z.enum(["tenant", "landlord"]),
    rentEscalationPercent: z.number().min(0, "Escalation percent cannot be negative").max(100),
    rentEscalationPeriodMonths: z.number().int().min(6).max(36),
    paymentDueDay: z.number().int().min(1, "Payment due day must be between 1 and 31").max(31),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.endDate) > new Date(data.startDate);
    },
    {
      message: "Agreement end date must be after the start date",
      path: ["endDate"],
    },
  );

export const clauseSelectionSchema = z.object({
  noticePeriod: z.boolean(),
  securityDepositRefund: z.boolean(),
  lockInPeriod: z.boolean(),
  utilityPayments: z.boolean(),
  maintenanceCharges: z.boolean(),
  rentEscalation: z.boolean(),
  peacefulEnjoyment: z.boolean(),
  noSubletting: z.boolean(),
  propertyUsage: z.boolean(),
  petPolicy: z.boolean(),
  paintingAndRepairs: z.boolean(),
  entryInspectionNotice: z.boolean(),
  forceMajeure: z.boolean(),
});

export const rentalAgreementFormSchema = z.object({
  agreementType: z.enum(["residential", "commercial"]),
  tenantType: z.enum(["single", "multiple"]),
  ownerDetails: ownerDetailsSchema,
  tenants: z.array(tenantDetailsSchema).min(1, "At least one tenant is required"),
  propertyDetails: propertyDetailsSchema,
  rentalTerms: rentalTermsSchema,
  clauses: clauseSelectionSchema,
  customTerms: z.array(z.string().trim().min(3).max(500)),
});
