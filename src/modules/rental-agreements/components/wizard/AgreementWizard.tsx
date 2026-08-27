/**
 * Seedha Properties — 10-Step Production Rental Agreement Creation Wizard
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  User,
  Users,
  Building2,
  Building,
  Banknote,
  Scale,
  Eye,
  CreditCard,
  PenTool,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Info,
  Sparkles,
  HelpCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthSession } from "@/hooks/useAuthSession";
import {
  type RentalAgreementFormData,
  type TenantDetails,
  type AgreementStatus,
} from "../../types";
import {
  getDefaultAgreementFormData,
  saveDraftToStorage,
  loadDraftFromStorage,
  clearDraftFromStorage,
  saveRentalAgreementRecord,
  calculateStampDutyAndFees,
} from "../../services/agreementService";
import { STANDARD_CLAUSES } from "../../constants/clauses";
import { AgreementDocumentPreview } from "../AgreementDocumentPreview";

const STEPS = [
  { id: 1, name: "Agreement Type", icon: FileText },
  { id: 2, name: "Owner Details", icon: User },
  { id: 3, name: "Tenant Details", icon: Users },
  { id: 4, name: "Property Details", icon: Building2 },
  { id: 5, name: "Rental Terms", icon: Banknote },
  { id: 6, name: "Clauses", icon: Scale },
  { id: 7, name: "Review & Draft", icon: Eye },
  { id: 8, name: "Fee & Pricing", icon: CreditCard },
  { id: 9, name: "Digital Execution", icon: PenTool },
  { id: 10, name: "Completed", icon: CheckCircle2 },
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
  const [digitalConfirmationChecked, setDigitalConfirmationChecked] = useState(false);

  // Load draft on mount
  useEffect(() => {
    if (!initialAgreementId) {
      const savedDraft = loadDraftFromStorage();
      if (savedDraft) {
        setFormData(savedDraft.data);
        if (savedDraft.currentStep && savedDraft.currentStep < 10) {
          setCurrentStep(savedDraft.currentStep);
        }
      }
    }
  }, [initialAgreementId]);

  // Autosave to localStorage on form changes
  useEffect(() => {
    if (currentStep < 10) {
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

  // Step Validation logic
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      return true;
    }

    if (step === 2) {
      const { fullName, phone, email, currentAddress, pincode } = formData.ownerDetails;
      if (!fullName || fullName.length < 3) {
        toast.error("Please enter the owner's full legal name (at least 3 characters).");
        return false;
      }
      if (!/^[6-9]\d{9}$/.test(phone)) {
        toast.error("Please enter a valid 10-digit Indian mobile number for the owner.");
        return false;
      }
      if (!email || !email.includes("@")) {
        toast.error("Please enter a valid email address for the owner.");
        return false;
      }
      if (!currentAddress || currentAddress.length < 5) {
        toast.error("Please enter the owner's residential address.");
        return false;
      }
      if (!/^\d{6}$/.test(pincode)) {
        toast.error("Please enter a valid 6-digit PIN code.");
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (formData.tenants.length === 0) {
        toast.error("At least one tenant is required.");
        return false;
      }
      for (let i = 0; i < formData.tenants.length; i++) {
        const t = formData.tenants[i];
        if (!t.fullName || t.fullName.length < 3) {
          toast.error(`Please enter full legal name for Tenant #${i + 1}.`);
          return false;
        }
        if (!/^[6-9]\d{9}$/.test(t.phone)) {
          toast.error(`Please enter a valid 10-digit mobile number for Tenant #${i + 1}.`);
          return false;
        }
        if (!t.email || !t.email.includes("@")) {
          toast.error(`Please enter a valid email for Tenant #${i + 1}.`);
          return false;
        }
      }
      return true;
    }

    if (step === 4) {
      const { streetAddress, locality, city, state, pincode } = formData.propertyDetails;
      if (!streetAddress || streetAddress.length < 5) {
        toast.error("Please enter the property street address / building details.");
        return false;
      }
      if (!locality) {
        toast.error("Locality/Area is required.");
        return false;
      }
      if (!city || !state) {
        toast.error("City and State are required.");
        return false;
      }
      if (!/^\d{6}$/.test(pincode)) {
        toast.error("Please enter a valid 6-digit property PIN code.");
        return false;
      }
      return true;
    }

    if (step === 5) {
      const { monthlyRent, securityDeposit, startDate, endDate } = formData.rentalTerms;
      if (!monthlyRent || monthlyRent < 1000) {
        toast.error("Monthly rent must be at least ₹1,000.");
        return false;
      }
      if (securityDeposit < 0) {
        toast.error("Security deposit cannot be negative.");
        return false;
      }
      if (!startDate || !endDate) {
        toast.error("Please select valid tenancy start and end dates.");
        return false;
      }
      if (new Date(endDate) <= new Date(startDate)) {
        toast.error("End date must be after the start date.");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 7) {
      // Review step -> save as REVIEW
      if (authStatus === "authenticated") {
        setIsSaving(true);
        const res = await saveRentalAgreementRecord(formData, "REVIEW", savedAgreementId);
        setIsSaving(false);
        if (res.success && res.agreement) {
          setSavedAgreementId(res.agreement.id);
          setAgreementNumber(res.agreement.agreement_number);
        }
      }
    }

    if (currentStep === 9) {
      // Digital Execution step
      if (!digitalConfirmationChecked) {
        toast.error(
          "Please verify and check the digital confirmation statement before completing.",
        );
        return;
      }

      if (authStatus !== "authenticated") {
        toast.error(
          "Please sign in or create a free account to complete and secure your agreement.",
        );
        navigate({ to: "/auth", search: { redirect: "/rental-agreement/create" } });
        return;
      }

      setIsSaving(true);
      const res = await saveRentalAgreementRecord(formData, "COMPLETED", savedAgreementId);
      setIsSaving(false);

      if (res.success && res.agreement) {
        setSavedAgreementId(res.agreement.id);
        setAgreementNumber(res.agreement.agreement_number);
        clearDraftFromStorage();
        toast.success("Rental Agreement created and recorded successfully!");
        setCurrentStep(10);
      } else {
        toast.error(res.error || "Failed to save completed agreement.");
      }
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 10));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveDraft = async () => {
    if (authStatus !== "authenticated") {
      toast.info("Draft saved locally! Sign in anytime to sync to your cloud account.");
      saveDraftToStorage(formData, currentStep);
      return;
    }

    setIsSaving(true);
    const res = await saveRentalAgreementRecord(formData, "DRAFT", savedAgreementId);
    setIsSaving(false);

    if (res.success && res.agreement) {
      setSavedAgreementId(res.agreement.id);
      setAgreementNumber(res.agreement.agreement_number);
      toast.success("Draft saved successfully to My Agreements!");
    } else {
      toast.error(res.error || "Could not save draft to cloud.");
    }
  };

  // Multiple tenants helpers
  const handleAddTenant = () => {
    const newTenant: TenantDetails = {
      id: `tenant-${Date.now()}`,
      fullName: "",
      phone: "",
      email: "",
      currentAddress: "",
      city: formData.propertyDetails.city || "Hyderabad",
      state: formData.propertyDetails.state || "Telangana",
      pincode: formData.propertyDetails.pincode || "",
    };
    setFormData((prev) => ({
      ...prev,
      tenants: [...prev.tenants, newTenant],
    }));
  };

  const handleRemoveTenant = (id: string) => {
    if (formData.tenants.length <= 1) {
      toast.error("At least one tenant must remain.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      tenants: prev.tenants.filter((t) => t.id !== id),
    }));
  };

  // Custom terms helper
  const handleAddCustomTerm = () => {
    if (!customTermInput.trim() || customTermInput.trim().length < 3) {
      toast.error("Custom covenant must be at least 3 characters.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      customTerms: [...prev.customTerms, customTermInput.trim()],
    }));
    setCustomTermInput("");
  };

  const handleRemoveCustomTerm = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customTerms: prev.customTerms.filter((_, i) => i !== index),
    }));
  };

  const feeCalc = calculateStampDutyAndFees(
    formData.propertyDetails.state || "Telangana",
    formData.rentalTerms.monthlyRent || 0,
    formData.rentalTerms.securityDeposit || 0,
    formData.rentalTerms.durationMonths || 11,
  );

  return (
    <div className="min-h-screen bg-secondary/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <Link
              to="/rental-agreement"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Rental Agreement Service</span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Create Legally Valid Rental Agreement
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-card hover:bg-secondary text-foreground border border-border transition shadow-2xs active:scale-95 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5 text-primary" />
              <span>{isSaving ? "Saving..." : "Save Draft"}</span>
            </button>
            <Link
              to="/my-agreements"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition active:scale-95"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>My Agreements</span>
            </Link>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
            <span>
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
            </span>
            <span>{Math.round((currentStep / STEPS.length) * 100)}% Completed</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Step Pill Navigation */}
          <div className="hidden sm:grid grid-cols-5 md:grid-cols-10 gap-1.5 mt-4 pt-3 border-t border-border/60">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isPast = s.id < currentStep;
              const isCurrent = s.id === currentStep;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (s.id < currentStep || validateStep(currentStep)) {
                      setCurrentStep(s.id);
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-bold transition ${
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : isPast
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "text-muted-foreground hover:bg-secondary opacity-60"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 mb-0.5" />
                  <span className="truncate max-w-[50px]">{s.name.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Wizard Form Card */}
        <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
          {/* STEP 1: Agreement Type */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Step 1 — Choose Agreement Type
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Select the tenancy format that matches your property and tenant structure.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, agreementType: "residential" }))}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    formData.agreementType === "residential"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">Residential Tenancy</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    For apartments, independent houses, gated villas, and family/bachelor homes.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, agreementType: "commercial" }))}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    formData.agreementType === "commercial"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                    <Building className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">Commercial Lease</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    For corporate offices, retail shops, warehouses, co-working, and commercial
                    premises.
                  </p>
                </button>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <label className="text-xs font-bold text-foreground block">Tenant Structure</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      formData.tenantType === "single"
                        ? "border-primary bg-primary/5 text-foreground font-semibold"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tenantType"
                      checked={formData.tenantType === "single"}
                      onChange={() => {
                        setFormData((p) => ({
                          ...p,
                          tenantType: "single",
                          tenants: p.tenants.slice(0, 1),
                        }));
                      }}
                      className="accent-primary"
                    />
                    <div>
                      <span className="text-xs font-bold block">Single Primary Tenant</span>
                      <span className="text-[11px] text-muted-foreground">
                        Individual leasing the home
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      formData.tenantType === "multiple"
                        ? "border-primary bg-primary/5 text-foreground font-semibold"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tenantType"
                      checked={formData.tenantType === "multiple"}
                      onChange={() => setFormData((p) => ({ ...p, tenantType: "multiple" }))}
                      className="accent-primary"
                    />
                    <div>
                      <span className="text-xs font-bold block">
                        Multiple Co-Tenants / Roommates
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Joint agreement with 2+ signers
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Owner Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Step 2 — Landlord / Owner Details
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter authentic legal details of the property owner (First Party / Lessor).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Full Legal Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Chandra Reddy"
                    value={formData.ownerDetails.fullName}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        ownerDetails: { ...p.ownerDetails, fullName: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    value={formData.ownerDetails.phone}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        ownerDetails: {
                          ...p.ownerDetails,
                          phone: e.target.value.replace(/\D/g, ""),
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Email Address *</label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh.reddy@example.com"
                    value={formData.ownerDetails.email}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        ownerDetails: { ...p.ownerDetails, email: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Current Residential Address *
                  </label>
                  <input
                    type="text"
                    placeholder="House/Flat No, Street, Landmark"
                    value={formData.ownerDetails.currentAddress}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        ownerDetails: { ...p.ownerDetails, currentAddress: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={formData.ownerDetails.city}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        ownerDetails: { ...p.ownerDetails, city: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">State *</label>
                    <input
                      type="text"
                      placeholder="e.g. Telangana"
                      value={formData.ownerDetails.state}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          ownerDetails: { ...p.ownerDetails, state: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">PIN Code *</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="500081"
                      value={formData.ownerDetails.pincode}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          ownerDetails: {
                            ...p.ownerDetails,
                            pincode: e.target.value.replace(/\D/g, ""),
                          },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Tenant Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Step 3 — Tenant Information</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter details of the tenant(s) taking the premises on lease.
                  </p>
                </div>
                {formData.tenantType === "multiple" && (
                  <button
                    type="button"
                    onClick={handleAddTenant}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Co-Tenant</span>
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {formData.tenants.map((tenant, idx) => (
                  <div
                    key={tenant.id || idx}
                    className="p-5 rounded-2xl border border-border bg-secondary/20 space-y-4 relative"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                        Tenant #{idx + 1}
                      </span>
                      {formData.tenants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTenant(tenant.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition text-xs flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-foreground">
                          Full Legal Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Priya Sharma"
                          value={tenant.fullName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((p) => ({
                              ...p,
                              tenants: p.tenants.map((t, i) =>
                                i === idx ? { ...t, fullName: val } : t,
                              ),
                            }));
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">
                          Mobile Phone Number *
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={tenant.phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setFormData((p) => ({
                              ...p,
                              tenants: p.tenants.map((t, i) =>
                                i === idx ? { ...t, phone: val } : t,
                              ),
                            }));
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Email Address *</label>
                        <input
                          type="email"
                          placeholder="e.g. priya.sharma@example.com"
                          value={tenant.email}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((p) => ({
                              ...p,
                              tenants: p.tenants.map((t, i) =>
                                i === idx ? { ...t, email: val } : t,
                              ),
                            }));
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-foreground">
                          Permanent / Current Address
                        </label>
                        <input
                          type="text"
                          placeholder="Flat No, Apartment, Street Address"
                          value={tenant.currentAddress}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((p) => ({
                              ...p,
                              tenants: p.tenants.map((t, i) =>
                                i === idx ? { ...t, currentAddress: val } : t,
                              ),
                            }));
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Property Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Step 4 — Property &amp; Premises Details
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Specify the exact address of the rented premises to be scheduled in the agreement.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Property Type *</label>
                  <select
                    value={formData.propertyDetails.propertyType}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        propertyDetails: {
                          ...p.propertyDetails,
                          propertyType: e.target
                            .value as RentalAgreementFormData["propertyDetails"]["propertyType"],
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="Apartment">Apartment / Gated Flat</option>
                    <option value="Independent House">Independent House / Builder Floor</option>
                    <option value="Villa">Villa / Row House</option>
                    <option value="Commercial Office">Commercial Office</option>
                    <option value="Commercial Shop">Commercial Retail Shop</option>
                    <option value="Other">Other Property</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Unit / Flat No.</label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 402, Tower B"
                    value={formData.propertyDetails.unitNumber || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        propertyDetails: { ...p.propertyDetails, unitNumber: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Building / Society Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. My Home Bhooja / Aparna Serene"
                    value={formData.propertyDetails.buildingName || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        propertyDetails: { ...p.propertyDetails, buildingName: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Street Address / Landmark *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot No 45, Road No 12, Financial District"
                    value={formData.propertyDetails.streetAddress}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        propertyDetails: { ...p.propertyDetails, streetAddress: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Locality / Neighborhood *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Madhapur / Gachibowli"
                    value={formData.propertyDetails.locality}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        propertyDetails: { ...p.propertyDetails, locality: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={formData.propertyDetails.city}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        propertyDetails: { ...p.propertyDetails, city: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">State *</label>
                  <input
                    type="text"
                    placeholder="e.g. Telangana"
                    value={formData.propertyDetails.state}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        propertyDetails: { ...p.propertyDetails, state: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">PIN Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="500081"
                    value={formData.propertyDetails.pincode}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        propertyDetails: {
                          ...p.propertyDetails,
                          pincode: e.target.value.replace(/\D/g, ""),
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Fittings, Fixtures &amp; Inventory Provided
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 3 Ceiling fans, 2 AC units, Modular kitchen cabinets, Geyser, Wardrobes"
                    value={formData.propertyDetails.fittingsAndFixtures || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        propertyDetails: {
                          ...p.propertyDetails,
                          fittingsAndFixtures: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Rental Terms */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Step 5 — Commercial &amp; Rental Terms
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Define rent, security deposit, duration, notice periods, and payment
                  responsibilities.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Monthly Rent (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-muted-foreground text-sm font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={1000}
                      step={500}
                      value={formData.rentalTerms.monthlyRent || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          rentalTerms: {
                            ...p.rentalTerms,
                            monthlyRent: parseInt(e.target.value) || 0,
                          },
                        }))
                      }
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-bold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Refundable Security Deposit (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-muted-foreground text-sm font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={formData.rentalTerms.securityDeposit || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          rentalTerms: {
                            ...p.rentalTerms,
                            securityDeposit: parseInt(e.target.value) || 0,
                          },
                        }))
                      }
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-bold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Tenancy Start Date *</label>
                  <input
                    type="date"
                    value={formData.rentalTerms.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Agreement Duration *</label>
                  <select
                    value={formData.rentalTerms.durationMonths}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value={11}>11 Months (Standard Lease)</option>
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={24}>24 Months (2 Years)</option>
                    <option value={36}>36 Months (3 Years)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Notice Period (Months) *
                  </label>
                  <select
                    value={formData.rentalTerms.noticePeriodMonths}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        rentalTerms: {
                          ...p.rentalTerms,
                          noticePeriodMonths: parseInt(e.target.value),
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value={1}>1 Month Notice</option>
                    <option value={2}>2 Months Notice</option>
                    <option value={3}>3 Months Notice</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Lock-in Period (Months)
                  </label>
                  <select
                    value={formData.rentalTerms.lockInPeriodMonths}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        rentalTerms: {
                          ...p.rentalTerms,
                          lockInPeriodMonths: parseInt(e.target.value),
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value={0}>No Lock-in Period</option>
                    <option value={1}>1 Month Lock-in</option>
                    <option value={3}>3 Months Lock-in</option>
                    <option value={6}>6 Months Lock-in</option>
                    <option value={11}>11 Months Lock-in</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Monthly Maintenance Borne By
                  </label>
                  <select
                    value={formData.rentalTerms.maintenanceResponsibility}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        rentalTerms: {
                          ...p.rentalTerms,
                          maintenanceResponsibility: e.target
                            .value as RentalAgreementFormData["rentalTerms"]["maintenanceResponsibility"],
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="tenant">Tenant Pays Directly</option>
                    <option value="landlord">Included in Rent / Landlord Pays</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Rent Payment Due Day (Monthly)
                  </label>
                  <select
                    value={formData.rentalTerms.paymentDueDay}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        rentalTerms: {
                          ...p.rentalTerms,
                          paymentDueDay: parseInt(e.target.value),
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value={1}>1st of every month</option>
                    <option value={5}>5th of every month</option>
                    <option value={7}>7th of every month</option>
                    <option value={10}>10th of every month</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Clauses */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Step 6 — Standard &amp; Custom Legal Clauses
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Toggle clauses to include in your legal deed. All terms adhere to Indian Tenancy
                  laws.
                </p>
              </div>

              <div className="space-y-3">
                {STANDARD_CLAUSES.map((clause) => (
                  <label
                    key={clause.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      formData.clauses[clause.id]
                        ? "border-primary/50 bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground bg-card"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.clauses[clause.id]}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData((p) => ({
                          ...p,
                          clauses: { ...p.clauses, [clause.id]: checked },
                        }));
                      }}
                      className="mt-1 h-4 w-4 rounded-sm border-border text-primary focus:ring-primary accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{clause.title}</span>
                        {clause.recommended && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {clause.summary}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Custom Clauses Input */}
              <div className="pt-6 border-t border-border space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Add Special Custom Conditions
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Tenant agrees to keep the private terrace garden maintained..."
                    value={customTermInput}
                    onChange={(e) => setCustomTermInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomTerm();
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTerm}
                    className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition hover:brightness-105 active:scale-95 shrink-0"
                  >
                    Add Clause
                  </button>
                </div>

                {formData.customTerms.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {formData.customTerms.map((term, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/40 border border-border text-xs text-foreground"
                      >
                        <span className="flex-1">
                          <strong>Custom Term {i + 1}:</strong> {term}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomTerm(i)}
                          className="text-rose-500 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 7: Review & Legal Preview */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Step 7 — Review Agreement Draft
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Review the full rendered agreement deed. You can edit any step before proceeding
                  to digital execution.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 pb-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="p-2.5 rounded-xl border border-border hover:border-primary/50 bg-card text-left text-xs transition"
                >
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                    Owner
                  </span>
                  <span className="font-bold text-foreground truncate block">
                    {formData.ownerDetails.fullName || "Edit"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="p-2.5 rounded-xl border border-border hover:border-primary/50 bg-card text-left text-xs transition"
                >
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                    Tenant(s)
                  </span>
                  <span className="font-bold text-foreground truncate block">
                    {formData.tenants[0]?.fullName || "Edit"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="p-2.5 rounded-xl border border-border hover:border-primary/50 bg-card text-left text-xs transition"
                >
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                    Property
                  </span>
                  <span className="font-bold text-foreground truncate block">
                    {formData.propertyDetails.locality || "Edit"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="p-2.5 rounded-xl border border-border hover:border-primary/50 bg-card text-left text-xs transition"
                >
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                    Rent
                  </span>
                  <span className="font-bold text-foreground truncate block">
                    ₹{formData.rentalTerms.monthlyRent?.toLocaleString("en-IN")}/mo
                  </span>
                </button>
              </div>

              {/* Render Full Agreement Preview */}
              <div className="border border-border/80 rounded-2xl overflow-hidden bg-slate-100 p-2 sm:p-4">
                <AgreementDocumentPreview
                  data={formData}
                  agreementNumber={agreementNumber}
                  status="REVIEW"
                />
              </div>
            </div>
          )}

          {/* STEP 8: Fee & Pricing */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Step 8 — Statutory Duty &amp; Drafting Fee Summary
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  100% transparent fee calculation with zero platform brokerage.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-secondary/40 border border-border space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-xs font-bold text-muted-foreground">Service Item</span>
                  <span className="text-xs font-bold text-muted-foreground">Amount</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span>Seedha Platform Digital Drafting Fee</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹499 (Standard)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>
                      Estimated State Stamp Duty ({formData.propertyDetails.state || "State"})
                    </span>
                    <span className="font-bold text-foreground">₹{feeCalc.stampDuty}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Legal E-Stamping &amp; Document Processing</span>
                    <span className="font-bold text-foreground">₹{feeCalc.registrationFee}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-sm font-extrabold text-foreground block">
                      Total Estimated Fee
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Includes all statutory stamp duty &amp; drafting
                    </span>
                  </div>
                  <span className="text-lg font-black text-primary">₹{feeCalc.totalCost}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div className="space-y-1">
                  <p className="font-bold">Transparent Payment Policy:</p>
                  <p>
                    {feeCalc.rulesExplanation} You will only be billed when you decide to request
                    government stamped physical execution or optional doorstep delivery.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: Digital Execution */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Step 9 — Digital Confirmation &amp; Execution
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Finalize and confirm the mutually agreed terms before saving the completed
                  document.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Parties Confirmation</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      First Party (Lessor)
                    </span>
                    <span className="font-bold text-foreground block">
                      {formData.ownerDetails.fullName}
                    </span>
                    <span className="text-muted-foreground block">
                      {formData.ownerDetails.phone}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Second Party (Lessee)
                    </span>
                    <span className="font-bold text-foreground block">
                      {formData.tenants.map((t) => t.fullName).join(", ")}
                    </span>
                    <span className="text-muted-foreground block">
                      {formData.tenants[0]?.phone}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={digitalConfirmationChecked}
                      onChange={(e) => setDigitalConfirmationChecked(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded-sm border-border text-primary focus:ring-primary accent-primary"
                    />
                    <div className="text-xs leading-relaxed text-foreground">
                      <span className="font-bold block mb-0.5">
                        I confirm all entered information is accurate
                      </span>
                      <span>
                        Both parties have reviewed the commercial terms, monthly rent of ₹
                        {formData.rentalTerms.monthlyRent?.toLocaleString("en-IN")}, security
                        deposit, and selected clauses. I agree to record this digital agreement
                        draft on Seedha Properties.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: Completed */}
          {currentStep === 10 && (
            <div className="space-y-6 text-center py-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-foreground">Rental Agreement Recorded!</h2>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Agreement Reference:{" "}
                  <span className="font-mono font-bold text-foreground">{agreementNumber}</span> has
                  been securely stored in your account.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-secondary/40 border border-border text-left max-w-lg mx-auto space-y-3 text-xs">
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Property:</span>
                  <span className="font-bold text-foreground">
                    {formData.propertyDetails.locality}, {formData.propertyDetails.city}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Monthly Rent:</span>
                  <span className="font-bold text-foreground">
                    ₹{formData.rentalTerms.monthlyRent?.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Tenure:</span>
                  <span className="font-bold text-foreground">
                    {formData.rentalTerms.durationMonths} Months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    COMPLETED / SAVED
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/my-agreements"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition hover:brightness-105 shadow-sm active:scale-95"
                >
                  View in My Agreements Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => setCurrentStep(7)}
                  className="px-4 py-2.5 rounded-xl bg-card hover:bg-secondary text-foreground border border-border text-xs font-semibold transition active:scale-95"
                >
                  Print / Download Document
                </button>
              </div>
            </div>
          )}

          {/* Wizard Action Footer Navigation */}
          {currentStep < 10 && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition disabled:opacity-30 disabled:pointer-events-none active:scale-95"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:brightness-105 transition shadow-xs active:scale-95 disabled:opacity-50"
                >
                  <span>
                    {currentStep === 9
                      ? isSaving
                        ? "Saving..."
                        : "Confirm & Complete"
                      : "Continue"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
