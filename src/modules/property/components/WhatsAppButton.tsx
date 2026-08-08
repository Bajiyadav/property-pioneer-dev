import { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchOwnerContact } from "@/modules/property/services/propertyQueries";

export function WhatsAppButton({
  propertyId,
  className = "",
}: {
  propertyId: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    const result = await fetchOwnerContact(propertyId);
    setLoading(false);
    if (result.ok && result.whatsappUrl) {
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
    } else {
      toast.error(result.error || "Unable to generate WhatsApp contact link.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60 ${className}`}
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
