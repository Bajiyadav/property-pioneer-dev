import { useState } from "react";
import { X, Lock, Phone, User, Calendar, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logLiveActivity, scheduleCustomerVisit } from "@/lib/leadRouting";

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
  propertyTitle?: string;
  locality?: string;
  actionType?: "contact_owner" | "schedule_visit";
  onSuccess?: () => void;
}

export function LeadCaptureModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle = "Selected Property",
  locality = "Kukatpally",
  actionType = "contact_owner",
  onSuccess,
}: LeadCaptureModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [moveInDateOrQuery, setMoveInDateOrQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Please enter your Full Name and Mobile Number.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Log to live_activities table for real-time lead dispatch
      await logLiveActivity({
        property_id: propertyId,
        locality,
        contact_name: name,
        contact_phone: phone,
        activity_type: actionType === "schedule_visit" ? "schedule_visit" : "enquiry",
        search_query: `Visitor Lead: ${actionType === "schedule_visit" ? "Requested Visit" : "Requested Owner Details"} — ${moveInDateOrQuery || "No specific date"}`,
      });

      // 2. If visit request, save to visit_schedules
      if (actionType === "schedule_visit" && propertyId) {
        await scheduleCustomerVisit({
          property_id: propertyId,
          customer_name: name,
          customer_phone: phone,
          visit_type: "in_person",
          preferred_date: moveInDateOrQuery || new Date().toISOString().split("T")[0],
          preferred_slot: "Morning",
        });
      }

      setSubmitted(true);
      toast.success("Details verified! Lead dispatched to Area Agent.");
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error("Failed to register lead. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Owner Contact Unlocked!</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Thank you, <strong className="text-foreground">{name}</strong>. Our Area Agent for{" "}
              <strong className="text-foreground">{locality}</strong> has been notified to assist
              you with viewing <strong className="text-foreground">{propertyTitle}</strong>.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90"
            >
              Continue Browsing
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary font-bold">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-foreground text-base">
                  {actionType === "schedule_visit"
                    ? "Schedule Site Visit"
                    : "Unlock Owner Direct Contact"}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Connect with owner for{" "}
                  <strong className="text-foreground">{propertyTitle}</strong> ({locality})
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" /> Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary" /> Mobile Number (+91) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 98765 43210"
                  className="w-full p-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Preferred Move-in Date / Inquiry
                  Note
                </label>
                <input
                  type="text"
                  value={moveInDateOrQuery}
                  onChange={(e) => setMoveInDateOrQuery(e.target.value)}
                  placeholder="e.g. Planning to move by 1st of next month"
                  className="w-full p-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-extrabold text-xs shadow-lg hover:bg-primary/90 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  <span>
                    {actionType === "schedule_visit"
                      ? "Confirm Site Visit Request"
                      : "Unlock Owner Contact & Details"}
                  </span>
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                🔒 0% Brokerage Guarantee. Your contact details are shared only with verified owners
                and area agents.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
