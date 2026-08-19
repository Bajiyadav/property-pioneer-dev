import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronRight, ArrowLeft, ArrowRight, Sparkles, Building2 } from "lucide-react";
import { Step1Location } from "./steps/Step1Location";
import { Step2Details } from "./steps/Step2Details";
import { Step3Pricing } from "./steps/Step3Pricing";
import { Step4Amenities } from "./steps/Step4Amenities";
import { Step5Photos } from "./steps/Step5Photos";
import { Step6Review } from "./steps/Step6Review";
import { ProgressBar } from "./ProgressBar";
import { MobileListingNav } from "./MobileListingNav";
import { useAdminPropertyStore } from "@/shared/stores/adminPropertyStore";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import type { ListingFormData } from "./types";
import { buildListingPayload } from "./buildListingPayload";
import { useServerFn } from "@tanstack/react-start";
import { createListing } from "@/modules/owner/services/ownerFunctions";
import { useAuth } from "@/modules/authentication/context/AuthContext";
import { LISTING_PHONE_KEY } from "@/routes/list-property";

interface ListingWizardProps {
  initialData?: {
    propertyType?: "Residential" | "Commercial";
    intent?: "Rent" | "Sell" | "PG/Co-living";
    city?: string;
    locality?: string;
    prefilled?: boolean;
    step?: number;
  };
}

/**
 * Recovers the number entered on /list-property.
 */
function readStashedPhone(): string {
  try {
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem(LISTING_PHONE_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Key holding an in-progress listing while the owner signs in. */
const LISTING_DRAFT_KEY = "sp_listing_draft";

function saveDraft(data: ListingFormData): void {
  try {
    window.localStorage.setItem(LISTING_DRAFT_KEY, JSON.stringify(data));
  } catch {
    // Storage blocked fallback
  }
}

function clearDraft(): void {
  try {
    window.localStorage.removeItem(LISTING_DRAFT_KEY);
    window.localStorage.removeItem("listing_prefill");
  } catch {
    /* nothing to recover */
  }
}

function readStashedDraft(): Partial<ListingFormData> | null {
  try {
    if (typeof window === "undefined") return null;

    let draft: Partial<ListingFormData> = {};

    // 1. Read main draft
    const rawMain =
      window.localStorage.getItem(LISTING_DRAFT_KEY) ||
      window.localStorage.getItem("listing_draft");
    if (rawMain) {
      try {
        const parsed = JSON.parse(rawMain);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          draft = { ...draft, ...parsed };
        }
      } catch {
        // Ignore unparseable draft JSON
      }
    }

    // 2. Read prefill from Start Now / Home
    const rawPrefill = window.localStorage.getItem("listing_prefill");
    if (rawPrefill) {
      try {
        const parsed = JSON.parse(rawPrefill);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          if (parsed.city) draft.city = parsed.city;
          if (parsed.locality) draft.locality = parsed.locality;
          if (parsed.propertyType === "Commercial" || parsed.property_type === "Commercial") {
            draft.property_type = "Office";
          } else if (parsed.property_type) {
            draft.property_type = parsed.property_type;
          }
          if (parsed.intent === "Sell" || parsed.listing_type === "sale") {
            draft.listing_type = "sale";
          } else if (parsed.listing_type) {
            draft.listing_type = parsed.listing_type;
          }
          if (parsed.owner_phone) draft.owner_phone = parsed.owner_phone;
        }
      } catch {
        // Ignore unparseable prefill JSON
      }
    }

    return Object.keys(draft).length > 0 ? draft : null;
  } catch {
    return null;
  }
}

const steps = [
  { id: 1, name: "Location", desc: "City & Address" },
  { id: 2, name: "Details", desc: "Type & Rooms" },
  { id: 3, name: "Pricing", desc: "Rent & Deposit" },
  { id: 4, name: "Amenities", desc: "Features & Facilities" },
  { id: 5, name: "Photos", desc: "Gallery & Video" },
  { id: 6, name: "Review", desc: "Verify & Submit" },
];

export function ListingWizard({ initialData }: ListingWizardProps = {}) {
  const navigate = useNavigate();
  const stashedDraft = readStashedDraft();

  // Check if we have prefilled location from search params or localStorage
  const hasPrefilledLocation = Boolean(
    initialData?.prefilled ||
    initialData?.step === 2 ||
    (initialData?.city && initialData?.locality) ||
    (stashedDraft?.city && stashedDraft?.locality),
  );

  const initialStep = initialData?.step ?? (hasPrefilledLocation ? 2 : 1);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSaving, setIsSaving] = useState(false);
  const { status, refreshSession } = useAuth();
  const create = useServerFn(createListing);
  const addProperty = useAdminPropertyStore((state) => state.addProperty);

  const [formData, setFormData] = useState<ListingFormData>({
    owner_name: "",
    owner_phone: readStashedPhone(),
    project_name: "",
    city: initialData?.city || stashedDraft?.city || "Hyderabad",
    locality: initialData?.locality || stashedDraft?.locality || "",
    address: "",
    landmark: "",
    property_type:
      initialData?.propertyType === "Commercial"
        ? "Office"
        : stashedDraft?.property_type || "Apartment",
    listing_type: initialData?.intent === "Sell" ? "sale" : stashedDraft?.listing_type || "rent",
    bhk_type: "2 BHK",
    bedrooms: 2,
    bathrooms: 2,
    floor_number: "1-3",
    total_rooms: 3,
    area_sqft: 1100,
    area_unit: "Sq.ft",
    furnishing_status: "semi-furnished",
    preferred_tenant: ["Family"],
    food_preference: "Any",
    price: 25000,
    deposit: 50000,
    maintenance: 2500,
    maintenance_included: false,
    amenities: ["Lift", "Power Backup", "Security", "Reserved Parking"],
    images: [],
    title: "",
    description: "",
    property_age: "0-1 Years",
    total_floors: 5,
    exact_floor: 2,
    balconies: 1,
    parking_covered: 1,
    parking_open: 0,
    facing: "East",
    available_from: "",
    rent_negotiable: false,
    ...(stashedDraft ?? {}),
  });

  const updateFormData = (data: Partial<ListingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.owner_name?.trim()) {
        toast.error("Please enter your name to proceed.");
        return;
      }
      if (!/^[6-9]\d{9}$/.test((formData.owner_phone ?? "").replace(/\D/g, ""))) {
        toast.error("Enter a valid 10-digit mobile number so tenants can reach you.");
        return;
      }
      if (!formData.locality.trim() && !formData.address.trim()) {
        toast.error("Please enter a locality or address to proceed.");
        return;
      }
    }
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSave = async (mode: "draft" | "submit") => {
    if (isSaving) return;

    const built = buildListingPayload(formData, mode);
    if (!built.ok) {
      toast.error(built.problems[0].message);
      return;
    }

    if (status !== "authenticated") {
      saveDraft(formData);
      toast.info("Sign in to save your listing", {
        description: "Your details are kept and restored when you return.",
      });
      navigate({ to: "/auth", search: { redirect: "/list-property/wizard" } });
      return;
    }

    setIsSaving(true);
    try {
      await create({ data: built.payload });

      clearDraft();

      // Refresh session in case user just acquired owner role
      await refreshSession();

      toast.success(
        mode === "draft" ? "Draft saved successfully!" : "Property submitted for moderation!",
        {
          description:
            mode === "draft"
              ? "You can resume editing anytime from your dashboard."
              : "Our moderation team will review and approve your listing within 2-4 hours.",
        },
      );

      navigate({ to: "/dashboard/owner", search: { tab: "listings" } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      toast.error(`Unable to save listing: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = () => {
    void handleSave("submit");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-24 md:pb-12">
      {/* Navigation Breadcrumb */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/list-property" className="hover:text-foreground transition">
            Post Property
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-primary font-bold">Wizard</span>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
          <Sparkles className="h-3.5 w-3.5" /> 100% Free Owner Listing
        </span>
      </div>

      {/* Progress Stepper & Completion Bar */}
      <ProgressBar
        currentStep={currentStep}
        totalSteps={steps.length}
        steps={steps}
        onStepClick={(stepId) => {
          if (stepId < currentStep) setCurrentStep(stepId);
        }}
      />

      {/* Location-First Pre-Fill Continuation Banner */}
      {formData.locality && formData.city && currentStep >= 2 && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-300/80 dark:border-emerald-700/50 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
              📍
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-200/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                  Step 1 Completed
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  {formData.property_type || "Apartment"} ·{" "}
                  {formData.listing_type === "sale" ? "For Sale" : "For Rent"}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-emerald-950 dark:text-emerald-100 mt-0.5">
                {formData.locality}, {formData.city}{" "}
                <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">
                  (Pre-filled from your selection)
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrentStep(1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-emerald-100 underline underline-offset-4 shrink-0 px-3 py-1.5 rounded-lg hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50 transition-colors"
          >
            Change Location (Step 1)
          </button>
        </div>
      )}

      {/* Main Form Step Container */}
      <div className="bg-card rounded-3xl border border-border/80 shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-300">
        <div className="p-5 sm:p-8 md:p-10">
          {currentStep === 1 && <Step1Location data={formData} updateData={updateFormData} />}
          {currentStep === 2 && <Step2Details data={formData} updateData={updateFormData} />}
          {currentStep === 3 && <Step3Pricing data={formData} updateData={updateFormData} />}
          {currentStep === 4 && <Step4Amenities data={formData} updateData={updateFormData} />}
          {currentStep === 5 && <Step5Photos data={formData} updateData={updateFormData} />}
          {currentStep === 6 && <Step6Review data={formData} />}
        </div>

        {/* Desktop Footer Actions */}
        <div className="hidden md:flex px-6 md:px-10 py-5 bg-secondary/30 border-t border-border justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="rounded-xl px-5 py-2.5 font-semibold text-xs sm:text-sm flex items-center gap-2 border-border bg-card hover:bg-secondary disabled:opacity-40 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Step
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => void handleSave("draft")}
              disabled={isSaving}
              className="rounded-xl px-5 py-2.5 font-semibold text-xs sm:text-sm border-border bg-card hover:bg-secondary disabled:opacity-40 min-h-[44px]"
            >
              {isSaving ? "Saving…" : "Save Draft"}
            </Button>

            {currentStep < 6 ? (
              <Button
                onClick={handleNext}
                className="rounded-xl px-7 py-2.5 font-bold text-xs sm:text-sm flex items-center gap-2 bg-[#0F766E] hover:bg-[#0F766E]/90 text-white shadow-md hover:shadow-lg transition-all min-h-[44px]"
              >
                Save &amp; Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="rounded-xl px-8 py-2.5 font-bold text-xs sm:text-sm flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all min-h-[44px]"
              >
                {isSaving ? "Submitting..." : "Submit Listing Now"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileListingNav
        currentStep={currentStep}
        totalSteps={steps.length}
        isSaving={isSaving}
        onBack={handleBack}
        onNext={handleNext}
        onSaveSubmit={handleSubmit}
      />
    </div>
  );
}
