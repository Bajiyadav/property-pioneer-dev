import { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchOwnerContact } from "@/modules/property/services/propertyQueries";
import { supabase } from "@/integrations/supabase/client";

export function WhatsAppButton({
  propertyId,
  className = "",
  onRequireAuth,
  onRequireSubscription,
}: {
  propertyId: string;
  className?: string;
  onRequireAuth?: () => void;
  onRequireSubscription?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;

    // 1. Require Authentication before revealing direct owner contact
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      toast.info("Sign in to unlock direct owner contact without brokerage", {
        description: "Get 3 free direct owner contact unlocks upon signing in.",
      });
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        window.location.href = `/auth?redirect=/properties/${propertyId}`;
      }
      return;
    }

    // 2. Fetch Owner Contact with quota enforcement
    setLoading(true);
    const result = await fetchOwnerContact(propertyId);
    setLoading(false);

    if (result.ok && result.whatsappUrl) {
      const remaining = typeof result.contactsRemaining === "number" ? result.contactsRemaining : 0;
      toast.success("Direct Owner Contact Unlocked!", {
        description: `0% Brokerage connection established. ${remaining} free owner contact${remaining === 1 ? "" : "s"} remaining.`,
      });
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
    } else if (
      result.status === 402 ||
      result.error?.includes("CONTACT_SUBSCRIPTION_REQUIRED") ||
      result.error?.includes("all 3 free owner contacts")
    ) {
      toast.error("Free Contact Quota Reached", {
        description: "You have used all 3 free owner contacts. Choose a pass to unlock more.",
      });
      if (onRequireSubscription) {
        onRequireSubscription();
      } else {
        window.dispatchEvent(new CustomEvent("sp:open-customer-plans"));
      }
    } else {
      toast.error(result.error || "Unable to generate WhatsApp contact link.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60 shadow-sm ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="h-4 w-4" />
      )}
      {loading ? "Connecting…" : "Chat on WhatsApp"}
    </button>
  );
}
