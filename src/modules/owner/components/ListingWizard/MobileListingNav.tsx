import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

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
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border/80 px-3 pt-3 sm:px-4 sm:pt-4 shadow-2xl md:hidden"
      // Respect the device safe area so the sticky bar clears the iPhone home
      // indicator / gesture bar instead of sitting under it.
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
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
            // Label matches the desktop footer and the truth: submitting sends
            // the listing to moderation; it is NOT published until an admin
            // approves it. "Publish now" would over-promise.
            aria-label="Submit listing for moderation"
            className="flex-1 flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-6 text-base font-bold text-white shadow-lg active:scale-95 transition-all hover:from-emerald-500 hover:to-teal-600 disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Check className="h-5 w-5 text-emerald-200" />
                <span>Submit for Moderation</span>
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
