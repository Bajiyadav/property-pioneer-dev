import React, { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "@tanstack/react-router";
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
import { useAdminPropertyStore } from "@/modules/admin/stores/adminPropertyStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { showFriendlyErrorToast } from "@/lib/errorUtils";
import type { ListingFormData } from "./types";
import { buildListingPayload } from "./buildListingPayload";
import { BrandMark } from "@/components/branding/BrandMark";
import { useServerFn } from "@tanstack/react-start";
import { createListing, editListing } from "@/modules/owner/services/ownerFunctions";
import type { Property } from "@/modules/property/services/propertyQueries";
import { useAuth } from "@/modules/authentication/context/AuthContext";
import { LISTING_PHONE_KEY } from "@/routes/list-property";
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
  editProperty?: Property | null;
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
    window.localStorage.removeItem("listing_draft");
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
  { id: 6, name: "Schedule", desc: "Visit Slots & Contact", percent: 90 },
  { id: 7, name: "Review", desc: "Verify & Submit", percent: 100 },
];

export function ListingWizard({ initialData, editProperty }: ListingWizardProps = {}) {
  const navigate = useNavigate();
  const stashedDraft = readStashedDraft();

  const initialStep = resolveInitialStep(initialData);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSaving, setIsSaving] = useState(false);
  const { status, user, role, roleVerified, refreshSession } = useAuth();
  const create = useServerFn(createListing);
  const edit = useServerFn(editListing);
  const addProperty = useAdminPropertyStore((state) => state.addProperty);

  const [formData, setFormData] = useState<ListingFormData>({
    owner_name: stashedDraft?.owner_name || "",
    owner_phone: readStashedPhone() || stashedDraft?.owner_phone || "",
    owner_email: stashedDraft?.owner_email || "",
    project_name: "",
    city: initialData?.city || stashedDraft?.city || "Hyderabad",
    locality: initialData?.locality || stashedDraft?.locality || "",
    address: "",
    landmark: "",
    property_type:
      initialData?.propertyType === "Commercial" ? "Office" : stashedDraft?.property_type || "",
    listing_type: initialData?.intent === "Sell" ? "sale" : stashedDraft?.listing_type || "",
    bhk_type: stashedDraft?.bhk_type || "",
    bedrooms: stashedDraft?.bedrooms || 0,
    bathrooms: stashedDraft?.bathrooms || 0,
    floor_number: stashedDraft?.floor_number || "",
    total_rooms: stashedDraft?.total_rooms || 0,
    area_sqft: stashedDraft?.area_sqft || 0,
    area_unit: "Sq.ft",
    furnishing_status: stashedDraft?.furnishing_status || "",
    preferred_tenant: stashedDraft?.preferred_tenant || [],
    food_preference: stashedDraft?.food_preference || "",
    price: stashedDraft?.price || 0,
    deposit: stashedDraft?.deposit || 0,
    maintenance: stashedDraft?.maintenance || 0,
    maintenance_included: stashedDraft?.maintenance_included || false,
    amenities: stashedDraft?.amenities || [],
    images: stashedDraft?.images || [],
    title: stashedDraft?.title || "",
    description: stashedDraft?.description || "",
    property_age: stashedDraft?.property_age || "",
    total_floors: stashedDraft?.total_floors || 0,
    exact_floor: stashedDraft?.exact_floor || 0,
    balconies: stashedDraft?.balconies || 0,
    parking_covered: stashedDraft?.parking_covered || 0,
    parking_open: stashedDraft?.parking_open || 0,
    facing: stashedDraft?.facing || "",
    available_from: stashedDraft?.available_from || "",
    rent_negotiable: stashedDraft?.rent_negotiable || false,
    visit_availability: "Immediate",
    visit_days: ["All Days"],
    visit_time_slots: ["Morning", "Evening"],
    contact_preference: "all",
    owner_declaration: false,
    id: editProperty?.id,
    ...(editProperty
      ? {
          owner_name: (editProperty as Record<string, unknown>).owner_name
            ? String((editProperty as Record<string, unknown>).owner_name)
            : "",
          owner_phone: (editProperty as Record<string, unknown>).owner_phone
            ? String((editProperty as Record<string, unknown>).owner_phone)
            : "",
          owner_email: (editProperty as Record<string, unknown>).owner_email
            ? String((editProperty as Record<string, unknown>).owner_email)
            : "",
          city: editProperty.city || "",
          locality: editProperty.locality || "",
          address: editProperty.address || "",
          landmark: editProperty.landmark || "",
          property_type: editProperty.property_type || "",
          listing_type: editProperty.listing_type || "",
          bedrooms: editProperty.bedrooms || 0,
          bathrooms: editProperty.bathrooms || 0,
          area_sqft: editProperty.area_sqft || 0,
          price: editProperty.price || 0,
          images: editProperty.images || [],
          title: editProperty.title || "",
          description: editProperty.description || "",
          available_from: editProperty.available_from || "",
        }
      : (stashedDraft ?? {})),
  });

  // Automatically populate owner contact from user profile whenever auth state settles
  useEffect(() => {
    if (status === "authenticated" && user && roleVerified) {
      if (role === "agent" || role === "admin") return;
      setFormData((prev) => ({
        ...prev,
        owner_name:
          prev.owner_name ||
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          "",
        owner_phone:
          prev.owner_phone || (user.user_metadata?.phone as string) || (user.phone as string) || "",
        owner_email: prev.owner_email || user.email || "",
      }));
    }
  }, [status, user, role, roleVerified]);

  const updateFormData = (data: Partial<ListingFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...data };
      saveDraft(next);
      return next;
    });
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
      if (!formData.locality.trim() && !formData.address.trim()) {
        toast.error("Please enter a locality or street address to proceed.");
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.price || formData.price <= 0) {
        toast.error("Please enter the expected rent or price.");
        return;
      }
    }

    if (currentStep === 6) {
      const phoneDigits = (formData.owner_phone ?? "").replace(/\D/g, "").replace(/^91/, "");
      if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
        toast.error("Enter a valid 10-digit mobile number so buyers/tenants can reach you.");
        return;
      }
    }

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

    try {
      setIsSaving(true);
      const built = buildListingPayload(formData, mode);
      const isEditing = !!formData.id;

      if (!built.ok) {
        toast.error(built.problems[0].message);
        setIsSaving(false);
        return;
      }

      let created;
      if (isEditing) {
        created = await edit({ data: { id: formData.id!, patch: built.payload } });
      } else {
        created = await create({ data: built.payload });
        clearDraft();
      }

      // Refresh session in case user just acquired owner role
      await refreshSession();

      toast.success(
        mode === "draft" ? "Draft saved successfully!" : "Property submitted for moderation!",
        {
          description:
            mode === "draft"
              ? "Your draft has been saved. You can continue later."
              : "We'll review your listing and make it live within 24 hours.",
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
        images: built.payload.images,
      });

      // Navigate to dedicated submitted status page with reference ID
      const resultObj = created as { id?: string } | undefined | null;
      const propertyId = resultObj?.id && typeof resultObj.id === "string" ? resultObj.id : null;

      if (propertyId) {
        navigate({
          to: "/list-property/submitted/$id",
          params: { id: propertyId },
        });
      }
    } catch (err: unknown) {
      saveDraft(formData);
      showFriendlyErrorToast(
        err,
        "We couldn't save your changes. Your information is still here. Please try again.",
      );
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

  // STEP 0: Authentication Gate before wizard starts
  if (status !== "loading" && status !== "authenticated") {
    return <Navigate to="/auth" search={{ redirect: "/list-property/wizard" }} />;
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
              className="text-xs font-semibold rounded-xl cursor-pointer"
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
          {currentStep === 7 && (
            <Step7Review
              data={formData}
              updateData={updateFormData}
              onEditStep={(stepId) => {
                setCurrentStep(stepId);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </div>

        {/* Desktop Step Action Footer */}
        <div className="hidden md:flex items-center justify-between gap-4 mt-10 pt-6 border-t border-border/80">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSaving}
                className="gap-2 rounded-xl text-sm font-semibold cursor-pointer"
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
                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>{isSaving ? "Submitting..." : "Submit for Moderation"}</span>
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isSaving}
                className="gap-2 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl shadow-xs cursor-pointer"
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
    </div>
  );
}
