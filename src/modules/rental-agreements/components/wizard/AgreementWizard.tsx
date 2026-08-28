/**
 * Seedha Properties — 4-Step Production Rental Agreement Wizard
 *
 * STEP 1: Details (Owner, Tenant, Property)
 * STEP 2: Rental Terms & Clauses
 * STEP 3: Review
 * STEP 4: Generate Agreement
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  User,
  Users,
  Building2,
  Banknote,
  Scale,
  Eye,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  Edit3,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";
import { type RentalAgreementFormData, type TenantDetails } from "../../types";
import {
  getDefaultAgreementFormData,
  saveDraftToStorage,
  loadDraftFromStorage,
  clearDraftFromStorage,
  saveRentalAgreementRecord,
} from "../../services/agreementService";
import { STANDARD_CLAUSES } from "../../constants/clauses";
import { AgreementDocumentPreview } from "../AgreementDocumentPreview";

const STEPS = [
  { id: 1, name: "Details", icon: Users, description: "Owner, Tenant & Property" },
  { id: 2, name: "Terms", icon: Banknote, description: "Rent, Deposit & Clauses" },
  { id: 3, name: "Review", icon: Eye, description: "Verify Agreement Summary" },
  { id: 4, name: "Generate", icon: CheckCircle2, description: "Download & Save Draft" },
];

export const AgreementWizard: React.FC<{ initialAgreementId?: string }> = ({
  initialAgreementId,
}) => {
  const navigate = useNavigate();
  const { status: authStatus, user } = useAuthSession();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RentalAgreementFormData>(getDefaultAgreementFormData());
  const [customTermInput, setCustomTermInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedAgreementId, setSavedAgreementId] = useState<string | undefined>(initialAgreementId);
  const [agreementNumber, setAgreementNumber] = useState<string>("SP-RA-DRAFT");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load draft on mount
  useEffect(() => {
    if (!initialAgreementId) {
      const savedDraft = loadDraftFromStorage();
      if (savedDraft) {
        setFormData(savedDraft.data);
        if (savedDraft.currentStep && savedDraft.currentStep <= 4) {
          setCurrentStep(savedDraft.currentStep);
        }
      }
    }
  }, [initialAgreementId]);

  // Autosave to localStorage on form changes
  useEffect(() => {
    if (currentStep < 4) {
      saveDraftToStorage(formData, currentStep);
    }
  }, [formData, currentStep]);

  // Recalculate end date whenever start date or duration changes
  const handleDurationChange = (months: number) => {
    const startDate = formData.rentalTerms.startDate
      ? new Date(formData.rentalTerms.startDate)
      : new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    setFormData((prev) => ({
      ...prev,
      rentalTerms: {
        ...prev.rentalTerms,
        durationMonths: months,
        endDate: endDate.toISOString().split("T")[0],
      },
    }));
  };

  const handleStartDateChange = (dateStr: string) => {
    const startDate = new Date(dateStr);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (formData.rentalTerms.durationMonths || 11));

    setFormData((prev) => ({
      ...prev,
      rentalTerms: {
        ...prev.rentalTerms,
        startDate: dateStr,
        endDate: endDate.toISOString().split("T")[0],
      },
    }));
  };

  // Co-tenant management
  const addCoTenant = () => {
    const newTenant: TenantDetails = {
      id: `tenant-${Date.now()}`,
      fullName: "",
      phone: "",
      email: "",
      currentAddress: "",
      city: formData.ownerDetails.city || "Hyderabad",
      state: formData.ownerDetails.state || "Telangana",
      pincode: "",
    };
    setFormData((prev) => ({
      ...prev,
      tenants: [...prev.tenants, newTenant],
    }));
  };

  const removeCoTenant = (index: number) => {
    if (formData.tenants.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      tenants: prev.tenants.filter((_, i) => i !== index),
    }));
  };

  const updateTenant = (index: number, field: keyof TenantDetails, value: string) => {
    setFormData((prev) => ({
      ...prev,
      tenants: prev.tenants.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    }));
  };

  // Clause management
  const toggleClause = (clauseKey: keyof typeof formData.clauses) => {
    setFormData((prev) => ({
      ...prev,
      clauses: {
        ...prev.clauses,
        [clauseKey]: !prev.clauses[clauseKey],
      },
    }));
  };

  const addCustomTerm = () => {
    if (!customTermInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      customTerms: [...(prev.customTerms || []), customTermInput.trim()],
    }));
    setCustomTermInput("");
  };

  const removeCustomTerm = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      customTerms: (prev.customTerms || []).filter((_, i) => i !== idx),
    }));
  };

  // Validation
  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.ownerDetails.fullName.trim()) {
        errors.ownerName = "Owner full name is required";
      }
      if (!formData.ownerDetails.phone.trim()) {
        errors.ownerPhone = "Owner contact number is required";
      }
      if (!formData.tenants[0]?.fullName.trim()) {
        errors.tenantName = "Tenant full name is required";
      }
      if (!formData.tenants[0]?.phone.trim()) {
        errors.tenantPhone = "Tenant contact number is required";
      }
      if (!formData.propertyDetails.streetAddress.trim()) {
        errors.propertyAddress = "Property address / house number is required";
      }
      if (!formData.propertyDetails.locality.trim()) {
        errors.propertyLocality = "Locality is required";
      }
    }

    if (currentStep === 2) {
      if (formData.rentalTerms.monthlyRent <= 0) {
        errors.rent = "Monthly rent must be greater than 0";
      }
      if (formData.rentalTerms.securityDeposit < 0) {
        errors.deposit = "Security deposit cannot be negative";
      }
      if (!formData.rentalTerms.startDate) {
        errors.startDate = "Start date is required";
      }
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fill in the required fields to continue.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGenerateAgreement = async () => {
    setIsSaving(true);
    try {
      if (authStatus === "authenticated" && user) {
        const result = await saveRentalAgreementRecord(formData, "COMPLETED", savedAgreementId);
        if (!result.success || !result.agreement) {
          throw new Error(result.error || "Failed to generate agreement record");
        }
        setSavedAgreementId(result.agreement.id);
        setAgreementNumber(result.agreement.agreement_number);
        clearDraftFromStorage();
      } else {
        // Guest draft generation
        const localDraftNum = `SP-RA-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        setAgreementNumber(localDraftNum);
        clearDraftFromStorage();
      }

      setCurrentStep(4);
      toast.success("Rental Agreement generated successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const friendlyMsg = getFriendlyErrorMessage(
        err,
        "We couldn't generate your agreement right now. Your details are saved. Please try again.",
      );
      toast.error(friendlyMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
      {/* 4-Step Header Progress Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Rental Agreement Creator
            </h1>
            <p className="text-xs text-muted-foreground">
              Step {currentStep} of 4: {STEPS[currentStep - 1].name} —{" "}
              {STEPS[currentStep - 1].description}
            </p>
          </div>
          {currentStep < 4 && (
            <button
              type="button"
              onClick={() => {
                saveDraftToStorage(formData, currentStep);
                toast.success("Draft saved to browser storage.");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save Draft</span>
            </button>
          )}
        </div>

        {/* Visual Progress Steps */}
        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((s) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;
            return (
              <div
                key={s.id}
                className={`p-2.5 sm:p-3 rounded-2xl border transition text-center space-y-1 ${
                  isCurrent
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : isCompleted
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-card text-muted-foreground border-border"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <span className="font-extrabold text-xs">{s.id}.</span>
                  )}
                  <span className="font-bold text-xs truncate">{s.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Details (Owner, Tenant, Property) */}
      {currentStep === 1 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border space-y-8 shadow-xs">
          {/* Agreement Type */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>Agreement Type</span>
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "residential", label: "Residential", desc: "Flat, House, Villa" },
                { id: "commercial", label: "Commercial", desc: "Office, Shop, Showroom" },
                { id: "pg_coliving", label: "PG / Coliving", desc: "Bed or Room Lease" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, agreementType: t.id as typeof p.agreementType }))
                  }
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer space-y-1 ${
                    formData.agreementType === t.id
                      ? "bg-primary/5 border-primary ring-1 ring-primary"
                      : "bg-card border-border hover:bg-secondary/40"
                  }`}
                >
                  <span className="text-xs font-bold text-foreground block">{t.label}</span>
                  <span className="text-[11px] text-muted-foreground block">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Owner Details */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span>Landlord / Owner Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Full Legal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Chandra Sharma"
                  value={formData.ownerDetails.fullName}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      ownerDetails: { ...p.ownerDetails, fullName: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
                {validationErrors.ownerName && (
                  <p className="text-[11px] text-destructive font-medium">
                    {validationErrors.ownerName}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Contact Mobile Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formData.ownerDetails.phone}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      ownerDetails: { ...p.ownerDetails, phone: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
                {validationErrors.ownerPhone && (
                  <p className="text-[11px] text-destructive font-medium">
                    {validationErrors.ownerPhone}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@example.com"
                  value={formData.ownerDetails.email}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      ownerDetails: { ...p.ownerDetails, email: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Current Residential Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot 12, Jubilee Hills, Hyderabad"
                  value={formData.ownerDetails.currentAddress}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      ownerDetails: { ...p.ownerDetails, currentAddress: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Landlord ID Document Upload */}
              <div className="space-y-1 sm:col-span-2 pt-1">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Landlord Identity Document (PAN / Aadhaar / Passport)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Optional · JPG, PNG, PDF
                  </span>
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setFormData((p) => ({
                            ...p,
                            ownerDetails: {
                              ...p.ownerDetails,
                              idDocumentUrl: reader.result as string,
                            },
                          }));
                          toast.success("Landlord ID document attached successfully");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                  {formData.ownerDetails.idDocumentUrl && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                      ✓ Document Attached
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Details */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Tenant &amp; Co-Tenant Details</span>
              </h3>
              <button
                type="button"
                onClick={addCoTenant}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Co-Tenant</span>
              </button>
            </div>

            {formData.tenants.map((tenant, idx) => (
              <div
                key={tenant.id}
                className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3 relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground">
                    {idx === 0 ? "Primary Tenant" : `Co-Tenant #${idx + 1}`}
                  </span>
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => removeCoTenant(idx)}
                      className="text-destructive hover:text-destructive/80 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={tenant.fullName}
                      onChange={(e) => updateTenant(idx, "fullName", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                    {idx === 0 && validationErrors.tenantName && (
                      <p className="text-[11px] text-destructive font-medium">
                        {validationErrors.tenantName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground">Mobile Number *</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9123456789"
                      value={tenant.phone}
                      onChange={(e) => updateTenant(idx, "phone", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                    {idx === 0 && validationErrors.tenantPhone && (
                      <p className="text-[11px] text-destructive font-medium">
                        {validationErrors.tenantPhone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. priya@example.com"
                      value={tenant.email}
                      onChange={(e) => updateTenant(idx, "email", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground">
                      Permanent Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. H.No 4-50, Warangal"
                      value={tenant.currentAddress}
                      onChange={(e) => updateTenant(idx, "currentAddress", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Tenant ID Document Upload */}
                  <div className="space-y-1 sm:col-span-2 pt-1">
                    <label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                      <span>Tenant ID Document (Aadhaar / PAN / Voter ID)</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        Optional · JPG, PNG, PDF
                      </span>
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              updateTenant(idx, "idDocumentUrl", reader.result as string);
                              toast.success(`Tenant #${idx + 1} ID document attached`);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                      />
                      {tenant.idDocumentUrl && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                          ✓ Document Attached
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Property Details */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span>Rental Property Address &amp; Specification</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Flat / Unit Number</label>
                <input
                  type="text"
                  placeholder="e.g. Flat 402, Block A"
                  value={formData.propertyDetails.unitNumber}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      propertyDetails: { ...p.propertyDetails, unitNumber: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Building / Society Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cyber Heights"
                  value={formData.propertyDetails.buildingName}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      propertyDetails: { ...p.propertyDetails, buildingName: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Locality / Area *</label>
                <input
                  type="text"
                  placeholder="e.g. Madhapur"
                  value={formData.propertyDetails.locality}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      propertyDetails: { ...p.propertyDetails, locality: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
                {validationErrors.propertyLocality && (
                  <p className="text-[11px] text-destructive font-medium">
                    {validationErrors.propertyLocality}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-foreground">Street Address *</label>
                <input
                  type="text"
                  placeholder="e.g. Road No 36, Near Metro Station"
                  value={formData.propertyDetails.streetAddress}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      propertyDetails: { ...p.propertyDetails, streetAddress: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
                {validationErrors.propertyAddress && (
                  <p className="text-[11px] text-destructive font-medium">
                    {validationErrors.propertyAddress}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Pincode</label>
                <input
                  type="text"
                  placeholder="e.g. 500081"
                  value={formData.propertyDetails.pincode}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      propertyDetails: { ...p.propertyDetails, pincode: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Property Document Upload */}
              <div className="space-y-1 sm:col-span-3 pt-1">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Electricity Bill / Property Ownership Proof</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Optional · Electricity bill, municipal tax receipt, or deed (JPG, PNG, PDF)
                  </span>
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setFormData((p) => ({
                            ...p,
                            propertyDetails: {
                              ...p.propertyDetails,
                              ownershipDocumentUrl: reader.result as string,
                            },
                          }));
                          toast.success("Property proof document attached successfully");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                  {formData.propertyDetails.ownershipDocumentUrl && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                      ✓ Document Attached
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Terms (Rent, Deposit, Clauses) */}
      {currentStep === 2 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border space-y-8 shadow-xs">
          {/* Financials */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" />
              <span>Rental Financials &amp; Duration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Monthly Rent (₹) *</label>
                <input
                  type="number"
                  min={1000}
                  value={formData.rentalTerms.monthlyRent}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      rentalTerms: { ...p.rentalTerms, monthlyRent: parseInt(e.target.value) || 0 },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
                {validationErrors.rent && (
                  <p className="text-[11px] text-destructive font-medium">
                    {validationErrors.rent}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Security Deposit (₹) *</label>
                <input
                  type="number"
                  min={0}
                  value={formData.rentalTerms.securityDeposit}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      rentalTerms: {
                        ...p.rentalTerms,
                        securityDeposit: parseInt(e.target.value) || 0,
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
                {validationErrors.deposit && (
                  <p className="text-[11px] text-destructive font-medium">
                    {validationErrors.deposit}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Payment Due Day</label>
                <select
                  value={formData.rentalTerms.paymentDueDay || 5}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      rentalTerms: {
                        ...p.rentalTerms,
                        paymentDueDay: parseInt(e.target.value) || 5,
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  {[1, 5, 7, 10].map((d) => (
                    <option key={d} value={d}>
                      {d}th of every month
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Agreement Start Date *</label>
                <input
                  type="date"
                  value={formData.rentalTerms.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
                {validationErrors.startDate && (
                  <p className="text-[11px] text-destructive font-medium">
                    {validationErrors.startDate}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Duration (Months)</label>
                <select
                  value={formData.rentalTerms.durationMonths || 11}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value) || 11)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  <option value={11}>11 Months (Standard)</option>
                  <option value={12}>12 Months</option>
                  <option value={24}>24 Months</option>
                  <option value={36}>36 Months</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Calculated End Date</label>
                <input
                  type="date"
                  disabled
                  value={formData.rentalTerms.endDate}
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs font-semibold text-muted-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Notice Period (Months)</label>
                <select
                  value={formData.rentalTerms.noticePeriodMonths || 1}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      rentalTerms: {
                        ...p.rentalTerms,
                        noticePeriodMonths: parseInt(e.target.value) || 1,
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  <option value={1}>1 Month Notice</option>
                  <option value={2}>2 Months Notice</option>
                  <option value={3}>3 Months Notice</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Lock-in Period (Months)</label>
                <select
                  value={formData.rentalTerms.lockInPeriodMonths || 1}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      rentalTerms: {
                        ...p.rentalTerms,
                        lockInPeriodMonths: parseInt(e.target.value) || 1,
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  <option value={0}>No Lock-in Period</option>
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                </select>
              </div>
            </div>
          </div>

          {/* Standard & Custom Clauses */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              <span>Standard Tenancy Clauses</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  key: "noSubletting" as const,
                  title: "Subletting Prohibited",
                  desc: "Tenant cannot transfer or sublease property.",
                },
                {
                  key: "paintingAndRepairs" as const,
                  title: "Repairs & Maintenance",
                  desc: "Minor repairs by tenant, structural repairs by owner.",
                },
                {
                  key: "entryInspectionNotice" as const,
                  title: "Inspection with Prior Notice",
                  desc: "Landlord may inspect with 24 hours advance notice.",
                },
                {
                  key: "peacefulEnjoyment" as const,
                  title: "Quiet & Peaceful Enjoyment",
                  desc: "Tenant enjoys uninterrupted possession during tenure.",
                },
                {
                  key: "propertyUsage" as const,
                  title: "Residential Usage Only",
                  desc: "Premises strictly reserved for residential living.",
                },
                {
                  key: "petPolicy" as const,
                  title: "Pet Policy",
                  desc: "Clear agreement regarding domestic pets.",
                },
              ].map((c) => {
                const isSelected = !!formData.clauses[c.key];
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggleClause(c.key)}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer space-y-1 ${
                      isSelected
                        ? "bg-primary/5 border-primary"
                        : "bg-card border-border hover:bg-secondary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{c.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {isSelected ? "Included" : "Excluded"}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground block">{c.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Terms */}
            <div className="pt-4 space-y-3">
              <label className="text-xs font-bold text-foreground block">
                Add Custom Terms / House Rules
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Covered car parking #22 included in rent"
                  value={customTermInput}
                  onChange={(e) => setCustomTermInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTerm())}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={addCustomTerm}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-105 transition cursor-pointer shrink-0"
                >
                  Add Term
                </button>
              </div>

              {(formData.customTerms || []).length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {formData.customTerms.map((term, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-secondary/40 border border-border flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="text-foreground">{term}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomTerm(idx)}
                        className="text-destructive hover:text-destructive/80 cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Review */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-foreground">
                  Review Agreement Summary
                </h3>
                <p className="text-xs text-muted-foreground">
                  Verify all details before generating the final deed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Info</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1.5">
                <span className="text-xs font-bold text-foreground block">👤 Landlord / Owner</span>
                <p className="text-xs font-extrabold text-foreground">
                  {formData.ownerDetails.fullName || "Not specified"}
                </p>
                <p className="text-[11px] text-muted-foreground">{formData.ownerDetails.phone}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formData.ownerDetails.currentAddress || formData.ownerDetails.city}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1.5">
                <span className="text-xs font-bold text-foreground">👥 Tenant(s)</span>
                <p className="text-xs font-extrabold text-foreground">
                  {formData.tenants[0]?.fullName || "Not specified"}
                </p>
                <p className="text-[11px] text-muted-foreground">{formData.tenants[0]?.phone}</p>
                {formData.tenants.length > 1 && (
                  <p className="text-[11px] text-primary font-bold">
                    + {formData.tenants.length - 1} Co-Tenant(s)
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1.5">
                <span className="text-xs font-bold text-foreground">🏠 Property</span>
                <p className="text-xs font-extrabold text-foreground">
                  {formData.propertyDetails.unitNumber} {formData.propertyDetails.buildingName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formData.propertyDetails.streetAddress}, {formData.propertyDetails.locality}
                </p>
              </div>
            </div>

            {/* Attached Verification Documents Status */}
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2">
              <span className="text-xs font-bold text-foreground block">
                📑 Attached Verification Documents
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${formData.ownerDetails.idDocumentUrl ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                  />
                  <span className="text-muted-foreground">Landlord ID:</span>
                  <span className="font-semibold text-foreground">
                    {formData.ownerDetails.idDocumentUrl ? "Attached ✓" : "Not attached"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${formData.tenants[0]?.idDocumentUrl ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                  />
                  <span className="text-muted-foreground">Tenant ID:</span>
                  <span className="font-semibold text-foreground">
                    {formData.tenants[0]?.idDocumentUrl ? "Attached ✓" : "Not attached"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${formData.propertyDetails.ownershipDocumentUrl ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                  />
                  <span className="text-muted-foreground">Electricity Bill:</span>
                  <span className="font-semibold text-foreground">
                    {formData.propertyDetails.ownershipDocumentUrl ? "Attached ✓" : "Not attached"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Preview Box */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Document Live Draft Preview
            </h4>
            <div className="p-6 rounded-3xl bg-background border border-border shadow-xs overflow-auto max-h-[420px]">
              <AgreementDocumentPreview
                data={formData}
                agreementNumber={agreementNumber}
                status="DRAFT"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Complete / Generate */}
      {currentStep === 4 && (
        <div className="p-8 sm:p-12 rounded-3xl bg-card border border-border text-center space-y-6 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-black text-foreground">
              Agreement Generated Successfully!
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your rental agreement has been compiled and is ready for download, printing, and
              execution.
            </p>
            <div className="inline-block px-3 py-1 rounded-full bg-secondary text-foreground text-xs font-mono font-bold mt-2">
              ID: {agreementNumber}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-105 transition cursor-pointer shadow-xs"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </button>

            {savedAgreementId && (
              <Link
                to="/rental-agreement/$id"
                params={{ id: savedAgreementId }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-card border border-border text-foreground text-xs font-bold hover:bg-secondary transition"
              >
                <Eye className="h-4 w-4" />
                <span>View Full Document</span>
              </Link>
            )}

            <Link
              to="/my-agreements"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition"
            >
              <span>My Agreements Dashboard</span>
            </Link>
          </div>

          <div className="pt-6 border-t border-border/60 max-w-lg mx-auto text-[11px] text-muted-foreground leading-relaxed">
            Legal Note: Once printed, both landlord and tenant should affix signatures on all pages
            alongside two witnesses, and attach the appropriate local state stamp paper value.
          </div>
        </div>
      )}

      {/* Navigation Buttons (Steps 1 to 3) */}
      {currentStep < 4 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-105 transition cursor-pointer shadow-xs"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleGenerateAgreement}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-extrabold hover:brightness-105 transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSaving ? (
                <span>Generating Agreement...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Generate Agreement</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
