import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronRight } from "lucide-react";
import { Step1Location } from "./steps/Step1Location";
import { Step2Details } from "./steps/Step2Details";
import { Step3Pricing } from "./steps/Step3Pricing";
import { Step4Amenities } from "./steps/Step4Amenities";
import { Step5Photos } from "./steps/Step5Photos";
import { Step6Review } from "./steps/Step6Review";
import { useAdminPropertyStore } from "@/shared/stores/adminPropertyStore";
import { Button } from "@/shared/components/ui/button";

const steps = ["Location", "Property Details", "Pricing", "Amenities", "Photos", "Review & Submit"];

export function ListingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const addProperty = useAdminPropertyStore((state) => state.addProperty);

  const [formData, setFormData] = useState<any>({
    city: "",
    locality: "",
    address: "",
    property_type: "Apartment",
    listing_type: "rent",
    bedrooms: 1,
    bathrooms: 1,
    floor_number: "Ground",
    total_rooms: 1,
    area_sqft: 500,
    furnishing_status: "unfurnished",
    preferred_tenant: ["Family"],
    price: 0,
    deposit: 0,
    maintenance: 0,
    maintenance_included: false,
    amenities: [],
    images: [],
    title: "",
    description: "",
  });

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    // Generate a title if not provided
    const title =
      formData.title ||
      `${formData.bedrooms} BHK ${formData.property_type} in ${formData.locality || formData.city}`;

    addProperty({
      ...formData,
      title,
    });

    // Redirect to a success page or back to home
    alert("Property submitted successfully for review!");
    navigate({ to: "/" });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Post Your Property</h1>
        <p className="text-neutral-500">Complete listing in 6 easy steps</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 hidden md:block">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-200 rounded">
            <div
              className="h-full bg-brand-600 rounded transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${
                    isActive
                      ? "bg-brand-600 text-white border-2 border-brand-600"
                      : isCompleted
                        ? "bg-brand-600 text-white border-2 border-brand-600"
                        : "bg-white text-neutral-400 border-2 border-neutral-200"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
                </div>
                <span
                  className={`text-xs font-medium ${isActive || isCompleted ? "text-neutral-900" : "text-neutral-400"}`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          {currentStep === 1 && <Step1Location data={formData} updateData={updateFormData} />}
          {currentStep === 2 && <Step2Details data={formData} updateData={updateFormData} />}
          {currentStep === 3 && <Step3Pricing data={formData} updateData={updateFormData} />}
          {currentStep === 4 && <Step4Amenities data={formData} updateData={updateFormData} />}
          {currentStep === 5 && <Step5Photos data={formData} updateData={updateFormData} />}
          {currentStep === 6 && <Step6Review data={formData} />}
        </div>

        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-between items-center">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            Back
          </Button>

          {currentStep < 6 ? (
            <Button onClick={handleNext}>
              Save & Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white">
              Submit for Review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
