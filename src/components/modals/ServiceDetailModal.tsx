import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, Clock, MapPin, Calendar, Phone, Sparkles } from "lucide-react";

export interface ServiceModalData {
  title: string;
  desc: string;
  status: string;
  badgeColor?: string;
}

export function ServiceDetailModal({
  data,
  onClose,
}: {
  data: ServiceModalData | null;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [booked, setBooked] = useState(false);

  if (!data) return null;

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setBooked(true);
    toast.success(`Booking request received for ${data.title}!`, {
      description: "Our Hyderabad service coordinator will call you within 15 minutes.",
    });
  };

  return (
    <Dialog open={Boolean(data)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-card border-border p-6 rounded-3xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                data.status.includes("Live")
                  ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {data.status}
            </span>
            <span className="text-xs text-muted-foreground">📍 Hyderabad Coverage</span>
          </div>
          <DialogTitle className="text-2xl font-semibold text-foreground mt-2">
            {data.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {data.desc}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {/* Service Features Included */}
          <div className="rounded-2xl border border-border bg-secondary/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground mb-3">
              What's Included
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Verified Technicians
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Damage Guarantee
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Transparent Pricing
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Same-Day Slot Available
              </span>
            </div>
          </div>

          {/* Interactive Booking / Consultation Form */}
          {booked ? (
            <div className="rounded-xl bg-emerald-600/10 p-4 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Request confirmed! We will contact you at {phone}
              .
            </div>
          ) : (
            <form onSubmit={handleBooking} className="space-y-3">
              <p className="text-xs font-semibold text-foreground">
                Request Free Quote / Instant Booking Callback
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-xs outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500 shadow"
                >
                  <Phone className="h-3.5 w-3.5" /> Book Consultation
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
