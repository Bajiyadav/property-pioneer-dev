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

const steps = [
  { id: 1, name: "Location", desc: "City & Address" },
  { id: 2, name: "Details", desc: "Type & Rooms" },
  { id: 3, name: "Pricing", desc: "Rent & Deposit" },
  { id: 4, name: "Amenities", desc: "Features & Facilities" },
  { id: 5, name: "Photos", desc: "Gallery & Video" },
  { id: 6, name: "Review", desc: "Verify & Submit" },
];

export function ListingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const addProperty = useAdminPropertyStore((state) => state.addProperty);

  const [formData, setFormData] = useState<ListingFormData>({
    city: "Hyderabad",
    locality: "",
    address: "",
    landmark: "",
    property_type: "Apartment",
    listing_type: "rent",
    bedrooms: 2,
    bathrooms: 2,
    floor_number: "1-3",
    total_rooms: 3,
    area_sqft: 1100,
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
  });

  const updateFormData = (data: Partial<ListingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.locality.trim() && !formData.address.trim()) {
      toast.error("Please enter a locality or address to proceed.");
      return;
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

  const handleSubmit = () => {
    const title =
      formData.title ||
      `${formData.bedrooms} BHK ${formData.property_type} in ${formData.locality || formData.city}`;

    addProperty({
      ...formData,
      title,
      listing_type: formData.listing_type || "rent",
      is_featured: false,
      is_approved: false,
    });

    toast.success("Property listing submitted successfully!", {
      description: "Our moderation team will review and approve within 2-4 hours.",
    });
    navigate({ to: "/" });
  };

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
