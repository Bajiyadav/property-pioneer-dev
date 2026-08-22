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
  // Rough estimate: 6 mins total, -1 min per step completed
  const minutesRemaining = Math.max(1, 6 - currentStep + 1);

  return (
    <div className="w-full mb-6 sm:mb-8 bg-card rounded-2xl border border-border/60 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">
            Step {currentStep} of {totalSteps}{" "}
            <span className="text-muted-foreground font-normal mx-1">·</span>{" "}
            <span className="text-muted-foreground font-medium">
              About {minutesRemaining} min{minutesRemaining > 1 ? "s" : ""} remaining
            </span>
          </h2>
        </div>
      </div>

      {/* Modern Gradient Progress Line */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/80 mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0F766E] to-teal-500 transition-all duration-500 ease-out shadow-xs"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Desktop Step Sequence */}
      <div className="hidden sm:flex items-center flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                disabled={step.id > currentStep}
                onClick={() => onStepClick?.(step.id)}
                className={`transition-all flex items-center gap-1.5 ${
                  isCurrent
                    ? "text-foreground font-bold bg-secondary/50 px-2 py-1 rounded-md"
                    : isCompleted
                      ? "text-foreground hover:text-emerald-600 cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <span>{step.id}</span>
                )}
                {step.name}
              </button>
              {index < steps.length - 1 && <span className="text-border mx-1">→</span>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
