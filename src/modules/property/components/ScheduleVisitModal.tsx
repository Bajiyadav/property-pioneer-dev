import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Calendar, Clock, Video, User, Phone, Mail, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { scheduleCustomerVisit } from "@/lib/leadRouting";
import { useAuthSession } from "@/hooks/useAuthSession";

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  locality: string;
}

export function ScheduleVisitModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  locality,
}: ScheduleVisitModalProps) {
  const { user } = useAuthSession();
  const [visitType, setVisitType] = useState<"in_person" | "video_call">("in_person");
  const [customerName, setCustomerName] = useState(user?.user_metadata?.full_name || "");
  const [customerPhone, setCustomerPhone] = useState(user?.user_metadata?.phone?.replace("+91", "") || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [preferredDate, setPreferredDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [preferredSlot, setPreferredSlot] = useState("Morning (9 AM - 12 PM)");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !preferredDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await scheduleCustomerVisit({
        property_id: propertyId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        visit_type: visitType,
        preferred_date: preferredDate,
        preferred_slot: preferredSlot,
        locality: locality || "Kukatpally",
        notes,
      });

      setSuccess(true);
      toast.success("Visit scheduled successfully! Area agent will confirm your appointment.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not schedule visit.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Schedule Property Visit
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Book an in-person or live video tour for <strong className="text-foreground">{propertyTitle}</strong> ({locality})
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-600/10 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Visit Request Received!</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Your request for a <strong className="text-foreground">{visitType === "video_call" ? "Video Tour" : "In-Person Visit"}</strong> on <strong className="text-foreground">{preferredDate}</strong> ({preferredSlot}) has been logged.
                The assigned <strong className="text-foreground">{locality} Area Agent</strong> will contact you shortly.
              </p>
            </div>
            <button
              onClick={resetAndClose}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-2xl text-xs shadow-md transition hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Visit Type Toggle */}
            <div>
              <Label className="text-xs font-bold text-foreground mb-1.5 block">Visit Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisitType("in_person")}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                    visitType === "in_person"
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  <User className="h-4 w-4" /> In-Person Visit
                </button>
                <button
                  type="button"
                  onClick={() => setVisitType("video_call")}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                    visitType === "video_call"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  <Video className="h-4 w-4" /> Live Video Tour
                </button>
              </div>
            </div>

            {/* Date & Time Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date" className="text-xs font-bold text-foreground mb-1 block">
                  Preferred Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="rounded-xl bg-background border-border text-xs h-10"
                />
              </div>

              <div>
                <Label htmlFor="slot" className="text-xs font-bold text-foreground mb-1 block">
                  Time Slot *
                </Label>
                <select
                  id="slot"
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 h-10 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                  <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                  <option value="Evening (4 PM - 7 PM)">Evening (4 PM - 7 PM)</option>
                </select>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 pt-1">
              <div>
                <Label className="text-xs font-bold text-foreground mb-1 block">Your Name *</Label>
                <Input
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="rounded-xl bg-background border-border text-xs h-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-foreground mb-1 block">Mobile Number *</Label>
                  <Input
                    required
                    type="tel"
                    placeholder="9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="rounded-xl bg-background border-border text-xs h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-foreground mb-1 block">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="you@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="rounded-xl bg-background border-border text-xs h-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground mb-1 block">Special Notes</Label>
              <Textarea
                placeholder="Any specific questions or preferred meeting point?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl bg-background border-border text-xs min-h-[70px]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary text-primary-foreground font-black rounded-2xl text-xs shadow-lg transition hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Confirm & Request Visit
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
