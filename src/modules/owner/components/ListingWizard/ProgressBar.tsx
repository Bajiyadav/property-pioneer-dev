import React from "react";
import { Check } from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ id: number; name: string; desc: string }>;
  onStepClick?: (stepId: number) => void;
}

/**
 * Mobile-first modern Progress Bar showing step completion % and visual badges.
 */
export function ProgressBar({ currentStep, totalSteps, steps, onStepClick }: ProgressBarProps) {
  const percentage = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <div className="w-full bg-card rounded-2xl border border-border/60 p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
      {/* Mobile Top Header: Step Counter & Percent */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            Step {currentStep} of {totalSteps}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
            {steps[currentStep - 1]?.name}:{" "}
            <span className="text-muted-foreground font-normal text-xs sm:text-sm">
              {steps[currentStep - 1]?.desc}
            </span>
          </h2>
        </div>
        <span className="text-xs font-extrabold text-primary">{percentage}% Done</span>
      </div>

      {/* Modern Gradient Progress Line */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#0D9488] transition-all duration-500 ease-out shadow-xs"
          style={{ width: `${Math.max(percentage, 10)}%` }}
        />
      </div>

      {/* Desktop Step Badges */}
      <div className="hidden md:grid grid-cols-6 gap-2 mt-5 pt-4 border-t border-border/40">
        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <button
              key={step.id}
              type="button"
              disabled={step.id > currentStep}
              onClick={() => onStepClick?.(step.id)}
              className={`flex items-center gap-2 text-left transition-all p-1.5 rounded-lg ${
                isCurrent
                  ? "bg-primary/10 text-primary font-bold"
                  : isCompleted
                    ? "text-foreground hover:bg-secondary/60 cursor-pointer"
                    : "text-muted-foreground/50 opacity-60 cursor-not-allowed"
              }`}
            >
              <div
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold transition-all ${
                  isCompleted
                    ? "bg-emerald-600 text-white"
                    : isCurrent
                      ? "bg-primary text-white ring-2 ring-primary/30"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : step.id}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{step.name}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
