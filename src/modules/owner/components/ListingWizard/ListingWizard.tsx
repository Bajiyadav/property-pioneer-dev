import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { Step1PropertyDetails } from "./steps/Step1PropertyDetails";
import { Step2Locality } from "./steps/Step2Locality";
import { Step3Pricing } from "./steps/Step3Pricing";
import { Step4Amenities } from "./steps/Step4Amenities";
import { Step5Photos } from "./steps/Step5Photos";
import { Step6Schedule } from "./steps/Step6Schedule";
import { Step7Review } from "./steps/Step7Review";
import { ProgressBar } from "./ProgressBar";
import { MobileListingNav } from "./MobileListingNav";
import { useAdminPropertyStore } from "@/shared/stores/adminPropertyStore";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import type { ListingFormData } from "./types";
import { buildListingPayload } from "./buildListingPayload";
import { BrandMark } from "@/shared/components/BrandMark";
import { useServerFn } from "@tanstack/react-start";
import { createListing } from "@/modules/owner/services/ownerFunctions";
import { useAuth } from "@/modules/authentication/context/AuthContext";
import { LISTING_PHONE_KEY } from "@/routes/list-property";
import { OwnerSmartAuthModal } from "@/shared/components/auth/OwnerSmartAuthModal";
import { resolveInitialStep } from "./resolveInitialStep";
import { validateStep } from "./stepValidation";

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
  { id: 1, name: "Property Details", desc: "Type, BHK & Area", percent: 0 },
  { id: 2, name: "Locality", desc: "City & Address", percent: 20 },
  { id: 3, name: "Pricing", desc: "Rent/Sale & Terms", percent: 40 },
  { id: 4, name: "Amenities", desc: "Features & Facilities", percent: 60 },
  { id: 5, name: "Gallery", desc: "Real Photos", percent: 75 },
  { id: 6, name: "Schedule", desc: "Visit Slots & Days", percent: 90 },
  { id: 7, name: "Review", desc: "Verify & Submit", percent: 100 },
];

export function ListingWizard({ initialData }: ListingWizardProps = {}) {
  const navigate = useNavigate();
  const stashedDraft = readStashedDraft();

  const initialStep = resolveInitialStep(initialData);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSaving, setIsSaving] = useState(false);
  const [showOwnerAuthModal, setShowOwnerAuthModal] = useState(false);
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
    food_preference: "Any (Non-Veg OK)",
    price: 25000,
    deposit: 50000,
    maintenance: 2500,
    maintenance_included: false,
    amenities: ["Lift", "Power Backup", "24x7 Security", "Reserved Parking"],
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
    visit_availability: "Immediate",
    visit_days: ["All Days"],
    visit_time_slots: ["Morning", "Evening"],
    contact_preference: "all",
    owner_declaration: false,
    ...(stashedDraft ?? {}),
  });

  const updateFormData = (data: Partial<ListingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    // Validation per step
    if (currentStep === 1) {
      if (!formData.property_type) {
        toast.error("Please select a property category.");
        return;
      }
      if (!formData.area_sqft || formData.area_sqft < 50) {
        toast.error("Please enter a valid built-up area (min 50 sq.ft.).");
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.owner_name?.trim()) {
        toast.error("Please enter your name to proceed.");
        return;
      }
      if (!/^[6-9]\d{9}$/.test((formData.owner_phone ?? "").replace(/\D/g, ""))) {
        toast.error("Enter a valid 10-digit mobile number so buyers/tenants can reach you.");
        return;
      }
      if (!formData.locality.trim() && !formData.address.trim()) {
        toast.error("Please enter a locality or street address to proceed.");
        return;
      }

      if (status !== "authenticated") {
        saveDraft(formData);
        setShowOwnerAuthModal(true);
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.price || formData.price <= 0) {
        toast.error("Please enter the expected rent or price.");
        return;
      }
    }

    // Supplementary gate. The per-step checks above stay authoritative for what
    // they cover (step 2 also opens the sign-in modal); this adds the steps that
    // had no gate at all and the cross-field rules a single field cannot catch.
    const issues = validateStep(currentStep, formData);
    if (issues.length > 0) {
      toast.error(issues[0].message);
      return;
    }

    if (currentStep < 7) {
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

    if (mode === "submit" && !formData.owner_declaration) {
      toast.error("Please accept the Owner Declaration checkbox before submitting.");
      return;
    }

    const built = buildListingPayload(formData, mode);
    if (!built.ok) {
      toast.error(built.problems[0].message);
      return;
    }

    if (status !== "authenticated") {
      saveDraft(formData);
      toast.info("Sign in to save your listing", {
        description: "Your details are kept safe and restored when you return.",
      });
      navigate({ to: "/auth", search: { redirect: "/list-property/wizard" } });
      return;
    }

    setIsSaving(true);
    try {
      const created = await create({ data: built.payload });

      clearDraft();

      // Refresh session in case user just acquired owner role
      await refreshSession();

      toast.success(
        mode === "draft" ? "Draft saved successfully!" : "Property submitted for moderation!",
        {
          description:
            mode === "draft"
              ? "You can resume editing anytime from your dashboard."
              : "Our moderation team will review and verify your listing within 2-4 hours.",
        },
      );

      // Local optimistic store
      addProperty({
        title: built.payload.title,
        description: built.payload.description,
        price: built.payload.price,
        locality: built.payload.locality || formData.locality,
        city: built.payload.city,
        address: built.payload.address,
        property_type: built.payload.property_type,
        listing_type: built.payload.listing_type,
        bedrooms: built.payload.bedrooms,
        bathrooms: built.payload.bathrooms,
        area_sqft: built.payload.area_sqft,
        is_approved: false,
        is_featured: false,
        // No placeholder substitution: a listing with no photos must LOOK like a
        // listing with no photos, here and everywhere else.
        images: built.payload.images,
      });

      // Navigate directly to the Owner Dashboard on submission
      navigate({ to: "/dashboard/owner", search: { tab: "listings" } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save listing";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  function calculateDynamicProgress(currentStep: number, data: ListingFormData): number {
    let score = 0;
    const total = 9;

    if (data.listing_type) score += 1;
    if (data.property_type) score += 1.5;
    if (data.area_sqft && data.area_sqft >= 50) score += 1;
    if (data.locality?.trim() || data.address?.trim()) score += 1.5;
    if (data.owner_name?.trim() && data.owner_phone?.trim()) score += 1;
    if (data.price && data.price > 0) score += 1.5;
    if (data.images && data.images.length > 0) score += 1;
    if (data.owner_declaration) score += 0.5;

    const dataPct = Math.round((score / total) * 100);
    const minStepPct = Math.min(100, Math.max(14, currentStep * 14));
    return Math.min(100, Math.max(minStepPct, dataPct));
  }

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <BrandMark size="sm" />
            </Link>
            <span className="text-border">/</span>
            <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Owner Listing Wizard</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave("draft")}
              disabled={isSaving}
              className="text-xs font-semibold rounded-xl"
            >
              Save Draft
            </Button>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-3xl mx-auto px-4 pt-6 sm:pt-8">
        <ProgressBar
          currentStep={currentStep}
          totalSteps={7}
          steps={steps}
          percentage={calculateDynamicProgress(currentStep, formData)}
          onStepClick={(id) => {
            if (id < currentStep) setCurrentStep(id);
          }}
        />

        {/* Dynamic Step Body */}
        <div className="mt-4">
          {currentStep === 1 && (
            <Step1PropertyDetails data={formData} updateData={updateFormData} />
          )}
          {currentStep === 2 && <Step2Locality data={formData} updateData={updateFormData} />}
          {currentStep === 3 && <Step3Pricing data={formData} updateData={updateFormData} />}
          {currentStep === 4 && <Step4Amenities data={formData} updateData={updateFormData} />}
          {currentStep === 5 && <Step5Photos data={formData} updateData={updateFormData} />}
          {currentStep === 6 && <Step6Schedule data={formData} updateData={updateFormData} />}
          {currentStep === 7 && <Step7Review data={formData} updateData={updateFormData} />}
        </div>

        {/* Desktop Step Action Footer */}
        <div className="hidden md:flex items-center justify-between gap-4 mt-10 pt-6 border-t border-border/80">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSaving}
                className="gap-2 rounded-xl text-sm font-semibold"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 7 ? (
              <Button
                onClick={() => handleSave("submit")}
                disabled={isSaving}
                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md"
              >
                <Check className="h-4 w-4" />
                <span>{isSaving ? "Submitting..." : "Submit for Moderation"}</span>
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isSaving}
                className="gap-2 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Sticky Action Bar */}
      <MobileListingNav
        currentStep={currentStep}
        totalSteps={7}
        isSaving={isSaving}
        onBack={handleBack}
        onNext={handleNext}
        onSaveSubmit={() => handleSave("submit")}
      />

      {/* Owner Auth Modal when step 2 phone requires authentication */}
      <OwnerSmartAuthModal
        isOpen={showOwnerAuthModal}
        onClose={() => setShowOwnerAuthModal(false)}
        phone={formData.owner_phone || ""}
        onSuccess={async () => {
          setShowOwnerAuthModal(false);
          await refreshSession();
          toast.success("Phone verified! Proceeding with your listing.");
          setCurrentStep(3);
        }}
      />
    </div>
  );
}
