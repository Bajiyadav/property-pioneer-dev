/**
 * Seedha Properties — Rental Agreement Types
 */

export type AgreementType = "residential" | "commercial";
export type TenantType = "single" | "multiple";

export type AgreementStatus =
  | "DRAFT"
  | "REVIEW"
  | "PAYMENT_PENDING"
  | "PAYMENT_COMPLETED"
  | "SIGNING_PENDING"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "REFUNDED";

export interface OwnerDetails {
  fullName: string;
  phone: string;
  email: string;
  panOrId?: string;
  idDocumentUrl?: string;
  currentAddress: string;
  city: string;
  state: string;
  pincode: string;
}

export interface TenantDetails {
  id: string; // for React keys
  fullName: string;
  phone: string;
  email: string;
  panOrId?: string;
  idDocumentUrl?: string;
  currentAddress: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PropertyDetails {
  propertyType:
    "Apartment" | "Independent House" | "Villa" | "Commercial Office" | "Commercial Shop" | "Other";
  unitNumber?: string;
  buildingName?: string;
  streetAddress: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  totalAreaSqFt?: number;
  furnishingStatus?: "Fully Furnished" | "Semi-Furnished" | "Unfurnished";
  fittingsAndFixtures?: string;
  ownershipDocumentUrl?: string;
}

export interface RentalTerms {
  monthlyRent: number;
  securityDeposit: number;
  startDate: string; // YYYY-MM-DD
  durationMonths: number; // 11, 12, 24, 36
  endDate: string; // YYYY-MM-DD
  noticePeriodMonths: number; // 1, 2, 3
  lockInPeriodMonths: number; // 0, 1, 3, 6, 11
  maintenanceResponsibility: "landlord" | "tenant";
  maintenanceAmountMonthly?: number;
  utilityResponsibility: "tenant" | "landlord";
  rentEscalationPercent: number; // 0, 5, 10
  rentEscalationPeriodMonths: number; // 11, 12, 24
  paymentDueDay: number; // 1 to 10 of every month
}

export interface ClauseSelection {
  noticePeriod: boolean;
  securityDepositRefund: boolean;
  lockInPeriod: boolean;
  utilityPayments: boolean;
  maintenanceCharges: boolean;
  rentEscalation: boolean;
  peacefulEnjoyment: boolean;
  noSubletting: boolean;
  propertyUsage: boolean;
  petPolicy: boolean;
  paintingAndRepairs: boolean;
  entryInspectionNotice: boolean;
  forceMajeure: boolean;
}

export interface RentalAgreementFormData {
  agreementType: AgreementType;
  tenantType: TenantType;
  ownerDetails: OwnerDetails;
  tenants: TenantDetails[];
  propertyDetails: PropertyDetails;
  rentalTerms: RentalTerms;
  clauses: ClauseSelection;
  customTerms: string[];
}

export interface RentalAgreementRecord {
  id: string;
  user_id: string;
  agreement_number: string;
  agreement_type: AgreementType;
  tenant_type: TenantType;
  status: AgreementStatus;
  owner_details: OwnerDetails;
  tenants: TenantDetails[];
  property_details: PropertyDetails;
  rental_terms: RentalTerms;
  clauses: ClauseSelection;
  custom_terms: string[];
  payment_status: PaymentStatus;
  payment_amount: number;
  payment_reference: string | null;
  document_url: string | null;
  original_agreement_id: string | null;
  created_at: string;
  updated_at: string;
}
