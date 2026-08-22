import React from "react";
import { Check, ShieldCheck } from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ id: number; name: string; desc: string; percent?: number }>;
  onStepClick?: (stepId: number) => void;
}

const STEP_PERCENTAGES = [0, 20, 40, 60, 75, 90, 100];

/**
 * Mobile-first modern Progress Bar showing step completion % and visual badges.
 */
export function ProgressBar({ currentStep, totalSteps, steps, onStepClick }: ProgressBarProps) {
  const currentPct =
    STEP_PERCENTAGES[currentStep - 1] ?? Math.round((currentStep / totalSteps) * 100);
  const minutesRemaining = Math.max(1, 7 - currentStep);

  return (
    <div className="w-full mb-6 sm:mb-8 bg-card rounded-2xl border border-border/70 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
            {currentPct}% Completed
          </span>
          <span className="text-muted-foreground font-normal text-xs">·</span>
          <span className="text-xs font-semibold text-foreground">
            Step {currentStep} of {totalSteps}: {steps[currentStep - 1]?.name}
          </span>
        </div>
        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Direct Owner · 0% Brokerage</span>
        </div>
      </div>

      {/* Modern Gradient Progress Line */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500 ease-out shadow-xs"
          style={{ width: `${Math.max(8, currentPct)}%` }}
        />
      </div>

      {/* Desktop Step Sequence */}
      <div className="hidden md:flex items-center justify-between gap-1 text-xs font-semibold text-muted-foreground">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                disabled={step.id > currentStep}
                onClick={() => onStepClick?.(step.id)}
                className={`transition-all flex items-center gap-1.5 py-1 px-2 rounded-lg ${
                  isCurrent
                    ? "text-primary font-bold bg-primary/10 shadow-2xs"
                    : isCompleted
                      ? "text-foreground hover:text-primary cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                }`}
              >
                {isCompleted ? (
                  <div className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </div>
                ) : (
                  <div
                    className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                      isCurrent
                        ? "bg-primary text-primary-foreground font-bold"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {step.id}
                  </div>
                )}
                <span>{step.name}</span>
              </button>
              {index < steps.length - 1 && <span className="text-border/80 text-[10px]">→</span>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
