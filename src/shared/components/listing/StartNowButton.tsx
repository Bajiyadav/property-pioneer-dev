import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/modules/authentication/context/AuthContext";
import { LISTING_PHONE_KEY } from "@/routes/list-property";

interface StartNowButtonProps {
  phone?: string;
  propertyType?: "Residential" | "Commercial";
  intent?: "Rent" | "Sell" | "PG/Co-living";
  onValidate?: () => boolean;
  className?: string;
  children?: React.ReactNode;
  requireAuthDirectly?: boolean;
}

/**
 * High-performance, touch-friendly "Start Now" button for the Seedha Properties
 * owner onboarding flow.
 *
 * Features:
 * - Minimum 48px touch target for mobile-first usability
 * - Animated loading spinner state with timeout fallback
 * - Integrated authentication check with draft preservation & redirect
 * - Smooth scroll & navigation to the listing wizard
 * - Comprehensive toast feedback
 */
export function StartNowButton({
  phone = "",
  propertyType = "Residential",
  intent = "Rent",
  onValidate,
  className = "",
  children,
  requireAuthDirectly = false,
}: StartNowButtonProps) {
  const navigate = useNavigate();
  const { status } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (isLoading) return;

    // Optional form validation before proceeding
    if (onValidate && !onValidate()) {
      return;
    }

    // Phone validation if provided
    const pureDigits = phone.replace(/\D/g, "");
    if (phone.trim().length > 0 && (pureDigits.length < 7 || pureDigits.length > 15)) {
      toast.error("Please enter a valid phone number (7 to 15 digits).");
      return;
    }

    setIsLoading(true);

    try {
      // Stash phone safely in sessionStorage
      if (pureDigits.length > 0) {
        try {
          sessionStorage.setItem(LISTING_PHONE_KEY, phone.trim());
        } catch {
          // Private browsing fallback
        }
      }

      // Check authentication if strictly required or guest handling
      if (requireAuthDirectly && status !== "authenticated") {
        toast.info("Authentication Required", {
          description: "Please sign in to publish your listing. Your progress will be saved!",
        });

        // 500ms smooth transition before auth redirect
        setTimeout(() => {
          setIsLoading(false);
          navigate({
            to: "/auth",
            search: { redirect: "/list-property/wizard" },
          });
        }, 500);
        return;
      }

      // Smooth transition to the multi-step listing wizard
      setTimeout(() => {
        setIsLoading(false);
        navigate({
          to: "/list-property/wizard",
          search: { propertyType, intent },
        });
      }, 400);
    } catch (error) {
      setIsLoading(false);
      toast.error("Unable to start listing flow. Please try again.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-label="Start property listing now"
      className={`relative inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#0F766E] via-[#115E59] to-[#0D9488] px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg font-bold text-white shadow-lg shadow-teal-950/20 transition-all duration-300 hover:shadow-xl hover:shadow-teal-900/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none cursor-pointer select-none ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin text-white" />
          <span>Starting Listing Flow...</span>
        </>
      ) : (
        children || (
          <>
            <Sparkles className="h-5 w-5 text-amber-300" />
            <span className="tracking-wide uppercase text-sm sm:text-base">START NOW — FREE</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </>
        )
      )}
    </button>
  );
}
