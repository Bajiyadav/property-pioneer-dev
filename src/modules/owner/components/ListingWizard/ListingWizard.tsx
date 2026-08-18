import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronRight, ArrowLeft, ArrowRight, Sparkles, Building2 } from "lucide-react";
import { Step1Location } from "./steps/Step1Location";
import { Step2Details } from "./steps/Step2Details";
import { Step3Pricing } from "./steps/Step3Pricing";
import { Step4Amenities } from "./steps/Step4Amenities";
import { Step5Photos } from "./steps/Step5Photos";
import { Step6Review } from "./steps/Step6Review";
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
    // No `phone` here: it was declared and never read, so the number the owner
    // typed on /list-property was silently discarded. It now arrives through
    // sessionStorage (see readStashedPhone) and prefills `owner_phone`.
  };
}

/**
 * Recovers the number entered on /list-property.
 *
 * Guarded rather than read directly: this component renders during SSR where
 * `sessionStorage` is undefined, and private browsing can throw on access. An
 * empty string just means the owner fills the field in, which is a fine
 * fallback — losing the value silently, as this flow used to, is not.
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

/**
 * Persists wizard state so signing in does not discard six steps of work.
 *
 * localStorage rather than sessionStorage: the sign-in round trip can involve a
 * fresh tab (an email link, a provider redirect), which a session-scoped store
 * would not survive. Cleared the moment the server confirms the listing.
 */
function saveDraft(data: ListingFormData): void {
  try {
    window.localStorage.setItem(LISTING_DRAFT_KEY, JSON.stringify(data));
  } catch {
    // Storage blocked or full. Losing the draft is bad; blocking the sign-in
    // they need in order to save at all is worse.
  }
}

function clearDraft(): void {
  try {
    window.localStorage.removeItem(LISTING_DRAFT_KEY);
  } catch {
    /* nothing to recover */
  }
}

/** Reads a saved draft. Shape is re-checked because storage is untrusted input. */
function readStashedDraft(): Partial<ListingFormData> | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(LISTING_DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Partial<ListingFormData>;
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const { status, refreshSession } = useAuth();
  const create = useServerFn(createListing);
  const addProperty = useAdminPropertyStore((state) => state.addProperty);

  const [formData, setFormData] = useState<ListingFormData>({
    owner_name: "",
    // Prefilled from the number given on /list-property, which used to be
    // collected and then discarded. Read lazily inside useState's initialiser so
    // it runs once, on the client only — sessionStorage does not exist during SSR.
    owner_phone: readStashedPhone(),
    project_name: "",
    city: "Hyderabad",
    locality: "",
    address: "",
    landmark: "",
    property_type: initialData?.propertyType === "Commercial" ? "Office" : "Apartment",
    listing_type: initialData?.intent === "Sell" ? "sale" : "rent",
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
    // Last, so a restored draft wins over the defaults above. Returning from
    // sign-in lands back on the same details rather than an empty form.
    ...(readStashedDraft() ?? {}),
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
      // Required, not optional: enquiries are delivered to this number, so a
      // listing without a valid one cannot be contacted at all.
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

  /**
   * Saves the listing.
   *
   * This used to call `addProperty`, which writes to a Zustand store in
   * localStorage, and then told the owner "Property listing submitted
   * successfully! Our moderation team will review and approve within 2-4 hours."
   * No row was created. No moderator could see it. The listing never appeared,
   * and the owner waited for enquiries that could not arrive. Six steps of work
   * went into one browser's local storage.
   *
   * It now calls the same auth-gated server function the onboarding modal uses,
   * and — the part that matters — success is only reported after the server has
   * confirmed the row exists.
   */
  const handleSave = async (mode: "draft" | "submit") => {
    if (isSaving) return;

    const built = buildListingPayload(formData, mode);
    if (!built.ok) {
      // Named field, not a generic failure: the owner is six steps deep and
      // needs to know which one to go back to.
      toast.error(built.problems[0].message);
      return;
    }

    // Not signed in: a listing needs an owner id, and the server function is
    // auth-gated. Keep the draft, send them to sign in, bring them back.
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

      // Only now does anything exist on the server.
      clearDraft();
      try {
        sessionStorage.removeItem(LISTING_PHONE_KEY);
      } catch {
        /* best effort */
      }

      // The owner may have just become an owner; refresh so the role and the
      // dashboard route resolve.
      await refreshSession();

      if (mode === "draft") {
        toast.success("Draft saved", {
          description: "It stays private until you submit it for review.",
        });
      } else {
        toast.success("Submitted for review", {
          description: "A moderator checks it before it goes live. Track it in your dashboard.",
        });
      }
      navigate({ to: "/dashboard/owner", search: { tab: "listings" } });
    } catch (err) {
      // Reported, never swallowed. A failed save that looks like a success is
      // the exact defect this function replaced.
      toast.error(err instanceof Error ? err.message : "Could not save the listing.", {
        description: "Your details are still on this page — nothing was lost.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = () => void handleSave("submit");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Top Back Navigation Bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-xs hover:border-primary/50 hover:bg-secondary transition-all"
        >
          <ArrowLeft className="h-4 w-4 text-primary transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
          <Sparkles className="h-3 w-3" /> 100% Free Owner Listing
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight font-[family-name:var(--font-display)] flex items-center gap-2.5">
          <Building2 className="h-7 w-7 text-primary" /> Post Your Property
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          List your home, villa, or commercial space in 6 easy steps and get verified direct leads.
        </p>
      </div>

      {/* Progress Stepper Bar */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex items-center justify-between min-w-[580px] relative px-2">
          <div className="absolute left-6 right-6 top-4 h-0.5 bg-border -z-0">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id);
                }}
                className={`relative z-10 flex flex-col items-center gap-1.5 text-center group cursor-pointer transition-all ${
                  step.id < currentStep ? "hover:opacity-80" : ""
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110"
                      : isCompleted
                        ? "bg-emerald-600 text-white shadow-emerald-500/20"
                        : "bg-card text-muted-foreground border-2 border-border"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span
                  className={`text-xs font-bold ${
                    isActive
                      ? "text-primary"
                      : isCompleted
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.name}
                </span>
                <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
                  {step.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form Step Card */}
      <div className="bg-card rounded-3xl border border-border/80 shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 md:p-10">
          {currentStep === 1 && <Step1Location data={formData} updateData={updateFormData} />}
          {currentStep === 2 && <Step2Details data={formData} updateData={updateFormData} />}
          {currentStep === 3 && <Step3Pricing data={formData} updateData={updateFormData} />}
          {currentStep === 4 && <Step4Amenities data={formData} updateData={updateFormData} />}
          {currentStep === 5 && <Step5Photos data={formData} updateData={updateFormData} />}
          {currentStep === 6 && <Step6Review data={formData} />}
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 md:px-10 py-5 bg-secondary/30 border-t border-border flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="rounded-xl px-5 py-2.5 font-semibold text-xs sm:text-sm flex items-center gap-2 border-border bg-card hover:bg-secondary disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Step
          </Button>

          {/*
            Save draft, offered at every step rather than only at the end.
            Someone halfway through a six-step form is precisely who needs it,
            and `buildListingPayload` holds drafts to a lower bar than
            submissions, so a price they have not decided yet cannot block it.
          */}
          <Button
            variant="outline"
            onClick={() => void handleSave("draft")}
            disabled={isSaving}
            className="rounded-xl px-5 py-2.5 font-semibold text-xs sm:text-sm border-border bg-card hover:bg-secondary disabled:opacity-40"
          >
            {isSaving ? "Saving…" : "Save draft"}
          </Button>

          {currentStep < 6 ? (
            <Button
              onClick={handleNext}
              className="rounded-xl px-7 py-2.5 font-semibold text-xs sm:text-sm flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
            >
              Save & Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="rounded-xl px-8 py-2.5 font-semibold text-xs sm:text-sm flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Check className="w-4 h-4" />
              Submit Listing for Review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
