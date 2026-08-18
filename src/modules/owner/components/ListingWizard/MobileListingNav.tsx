import React from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface MobileListingNavProps {
  currentStep: number;
  totalSteps: number;
  isSaving: boolean;
  onBack: () => void;
  onNext: () => void;
  onSaveSubmit: () => void;
}

/**
 * Mobile-First bottom navigation bar for the listing wizard.
 * Provides touch-friendly min-48px buttons that stay accessible on all mobile viewports.
 */
export function MobileListingNav({
  currentStep,
  totalSteps,
  isSaving,
  onBack,
  onNext,
  onSaveSubmit,
}: MobileListingNavProps) {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border/80 p-3 sm:p-4 shadow-2xl md:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={onBack}
            disabled={isSaving}
            aria-label="Previous step"
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground shadow-xs active:scale-95 transition-all hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        {isLastStep ? (
          <button
            type="button"
            onClick={onSaveSubmit}
            disabled={isSaving}
            aria-label="Publish property listing"
            className="flex-1 flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-6 text-base font-bold text-white shadow-lg active:scale-95 transition-all hover:from-emerald-500 hover:to-teal-600 disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                <span>Publish Listing Now</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={isSaving}
            aria-label="Continue to next step"
            className="flex-1 flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-md active:scale-95 transition-all hover:bg-primary/90"
          >
            <span>Continue</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
