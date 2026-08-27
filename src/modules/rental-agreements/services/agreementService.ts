/**
 * Seedha Properties — Rental Agreement Client & Data Service
 */

import { supabase } from "@/integrations/supabase/client";
import { type Json } from "@/integrations/supabase/types";
import {
  type RentalAgreementFormData,
  type RentalAgreementRecord,
  type AgreementStatus,
} from "../types";
import { DEFAULT_CLAUSE_SELECTION } from "../constants/clauses";

const DRAFT_STORAGE_KEY = "seedha_rental_agreement_draft_v1";

export function getDefaultAgreementFormData(): RentalAgreementFormData {
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setMonth(nextYear.getMonth() + 11);

  return {
    agreementType: "residential",
    tenantType: "single",
    ownerDetails: {
      fullName: "",
      phone: "",
      email: "",
      currentAddress: "",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "",
    },
    tenants: [
      {
        id: "tenant-1",
        fullName: "",
        phone: "",
        email: "",
        currentAddress: "",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "",
      },
    ],
    propertyDetails: {
      propertyType: "Apartment",
      unitNumber: "",
      buildingName: "",
      streetAddress: "",
      locality: "Madhapur",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500081",
      furnishingStatus: "Semi-Furnished",
      fittingsAndFixtures: "Ceiling fans, LED lights, Geyser, Modular kitchen cabinets",
    },
    rentalTerms: {
      monthlyRent: 25000,
      securityDeposit: 50000,
      startDate: today.toISOString().split("T")[0],
      durationMonths: 11,
      endDate: nextYear.toISOString().split("T")[0],
      noticePeriodMonths: 1,
      lockInPeriodMonths: 1,
      maintenanceResponsibility: "tenant",
      maintenanceAmountMonthly: 2500,
      utilityResponsibility: "tenant",
      rentEscalationPercent: 5,
      rentEscalationPeriodMonths: 11,
      paymentDueDay: 5,
    },
    clauses: { ...DEFAULT_CLAUSE_SELECTION },
    customTerms: [],
  };
}

/**
 * Saves draft progress to local storage
 */
export function saveDraftToStorage(data: RentalAgreementFormData, currentStep: number) {
  try {
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        data,
        currentStep,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Ignore storage quota or disabled storage
  }
}

/**
 * Restores draft progress from local storage
 */
export function loadDraftFromStorage(): {
  data: RentalAgreementFormData;
  currentStep: number;
  savedAt: string;
} | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clears local draft
 */
export function clearDraftFromStorage() {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Calculates estimated Indian government stamp duty and statutory costs based on state regulations
 */
export function calculateStampDutyAndFees(
  state: string,
  monthlyRent: number,
  securityDeposit: number,
  durationMonths: number,
): {
  stampDuty: number;
  registrationFee: number;
  draftingFee: number;
  totalCost: number;
  rulesExplanation: string;
} {
  const annualRent = monthlyRent * Math.min(durationMonths, 12);
  const totalFinancialValue = annualRent + securityDeposit;

  let stampDuty = 100;
  let registrationFee = 500;
  let rulesExplanation =
    "Standard 11-month lease agreement stamp duty on government non-judicial stamp paper.";

  const normState = state.toLowerCase();

  if (normState.includes("telangana") || normState.includes("hyderabad")) {
    // Telangana: 0.5% of total value or min ₹100 for < 11 months
    stampDuty = Math.max(100, Math.round(totalFinancialValue * 0.005));
    registrationFee = 500;
    rulesExplanation =
      "Telangana Stamp Act: 0.5% of annual rent + deposit value (min ₹100 for <= 11 months).";
  } else if (
    normState.includes("karnataka") ||
    normState.includes("bangalore") ||
    normState.includes("bengaluru")
  ) {
    // Karnataka: 0.5% or min ₹200
    stampDuty = Math.max(200, Math.round(totalFinancialValue * 0.005));
    registrationFee = 500;
    rulesExplanation = "Karnataka Stamp Act: 0.5% of total monetary consideration.";
  } else if (
    normState.includes("maharashtra") ||
    normState.includes("mumbai") ||
    normState.includes("pune")
  ) {
    // Maharashtra: 0.25% of whole term value + deposit
    stampDuty = Math.max(100, Math.round(totalFinancialValue * 0.0025));
    registrationFee = 1000;
    rulesExplanation =
      "Maharashtra Stamp Act: 0.25% of total rent across agreement term + 10% refundable deposit component.";
  } else if (normState.includes("delhi")) {
    // Delhi: 2% of annual rent for <= 5 yrs
    stampDuty = Math.max(100, Math.round(annualRent * 0.02));
    registrationFee = 500;
    rulesExplanation = "Delhi Stamp Rules: 2% on average annual rent consideration.";
  } else if (normState.includes("tamil nadu") || normState.includes("chennai")) {
    // Tamil Nadu: 1% of total value
    stampDuty = Math.max(100, Math.round(totalFinancialValue * 0.01));
    registrationFee = 500;
    rulesExplanation = "Tamil Nadu Tenancy Act: 1% stamp duty on lease consideration.";
  }

  // Seedha platform digital drafting fee (₹0 platform brokerage, flat ₹499 digital legal drafting)
  const draftingFee = 499;
  const totalCost = stampDuty + registrationFee + draftingFee;

  return {
    stampDuty,
    registrationFee,
    draftingFee,
    totalCost,
    rulesExplanation,
  };
}

/**
 * Fetches all rental agreements created by the authenticated user
 */
export async function fetchUserRentalAgreements(): Promise<RentalAgreementRecord[]> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) {
    return [];
  }

  const { data, error } = await supabase
    .from("rental_agreements")
    .select("*")
    .eq("user_id", userRes.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    // If table doesn't exist yet on client, return empty array gracefully
    return [];
  }

  return (data as unknown as RentalAgreementRecord[]) || [];
}

/**
 * Fetches a single rental agreement by ID (RLS protected)
 */
export async function fetchRentalAgreementById(id: string): Promise<RentalAgreementRecord | null> {
  const { data, error } = await supabase
    .from("rental_agreements")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as RentalAgreementRecord;
}

/**
 * Creates or saves a rental agreement draft in Supabase
 */
export async function saveRentalAgreementRecord(
  formData: RentalAgreementFormData,
  status: AgreementStatus = "DRAFT",
  existingId?: string,
): Promise<{ success: boolean; agreement?: RentalAgreementRecord; error?: string }> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) {
    return { success: false, error: "Authentication required to save agreements." };
  }

  const userId = userRes.user.id;
  const agreementNumber = existingId
    ? undefined
    : `SP-RA-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const payload = {
    user_id: userId,
    ...(agreementNumber ? { agreement_number: agreementNumber } : {}),
    agreement_type: formData.agreementType,
    tenant_type: formData.tenantType,
    status,
    owner_details: formData.ownerDetails as unknown as Json,
    tenants: formData.tenants as unknown as Json,
    property_details: formData.propertyDetails as unknown as Json,
    rental_terms: formData.rentalTerms as unknown as Json,
    clauses: formData.clauses as unknown as Json,
    custom_terms: formData.customTerms as unknown as Json,
    updated_at: new Date().toISOString(),
  };

  if (existingId) {
    const { data, error } = await supabase
      .from("rental_agreements")
      .update(payload)
      .eq("id", existingId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, agreement: data as unknown as RentalAgreementRecord };
  } else {
    const { data, error } = await supabase
      .from("rental_agreements")
      .insert({
        ...payload,
        payment_status: "UNPAID",
        payment_amount: 499,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, agreement: data as unknown as RentalAgreementRecord };
  }
}

/**
 * Duplicates an existing agreement for Renewal
 */
export async function duplicateAgreementForRenewal(
  originalId: string,
): Promise<{ success: boolean; newAgreementId?: string; error?: string }> {
  const original = await fetchRentalAgreementById(originalId);
  if (!original) {
    return { success: false, error: "Original agreement not found." };
  }

  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setMonth(nextYear.getMonth() + (original.rental_terms?.durationMonths || 11));

  // Clone terms with new dates and escalation applied
  const escalation = original.rental_terms.rentEscalationPercent || 0;
  const newRent = Math.round(original.rental_terms.monthlyRent * (1 + escalation / 100));

  const renewedFormData: RentalAgreementFormData = {
    agreementType: original.agreement_type,
    tenantType: original.tenant_type,
    ownerDetails: original.owner_details,
    tenants: original.tenants,
    propertyDetails: original.property_details,
    rentalTerms: {
      ...original.rental_terms,
      monthlyRent: newRent,
      startDate: today.toISOString().split("T")[0],
      endDate: nextYear.toISOString().split("T")[0],
    },
    clauses: original.clauses,
    customTerms: original.custom_terms || [],
  };

  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) {
    return { success: false, error: "Authentication required." };
  }

  const newAgreementNumber = `SP-RA-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const { data, error } = await supabase
    .from("rental_agreements")
    .insert({
      user_id: userRes.user.id,
      agreement_number: newAgreementNumber,
      agreement_type: renewedFormData.agreementType,
      tenant_type: renewedFormData.tenantType,
      status: "DRAFT",
      owner_details: renewedFormData.ownerDetails as unknown as Json,
      tenants: renewedFormData.tenants as unknown as Json,
      property_details: renewedFormData.propertyDetails as unknown as Json,
      rental_terms: renewedFormData.rentalTerms as unknown as Json,
      clauses: renewedFormData.clauses as unknown as Json,
      custom_terms: renewedFormData.customTerms as unknown as Json,
      payment_status: "UNPAID",
      payment_amount: 499,
      original_agreement_id: originalId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, newAgreementId: data.id };
}

/**
 * Deletes a draft agreement (RLS ensures only owner can delete DRAFT status)
 */
export async function deleteRentalAgreementDraft(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) {
    return { success: false, error: "Authentication required." };
  }

  const { error } = await supabase
    .from("rental_agreements")
    .delete()
    .eq("id", id)
    .eq("user_id", userRes.user.id)
    .eq("status", "DRAFT");

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
