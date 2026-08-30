import React, { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  Phone,
  User,
  ShieldCheck,
  CalendarCheck,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { scheduleVisit, VISIT_SLOTS } from "@/modules/property/services/visitService";

/**
 * Resolves a friendly picker label ("Tomorrow", "This Saturday") to an ISO date.
 *
 * The labels used to be sent to the database verbatim, into a `date` column
 * that cannot parse them.
 */
function isoDateForOption(option: string): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  if (option === "Tomorrow") {
    date.setDate(date.getDate() + 1);
  } else if (option === "This Saturday" || option === "This Sunday") {
    const target = option === "This Saturday" ? 6 : 0;
    // 1..7 days ahead, so "this Saturday" on a Saturday means the next one
    // rather than a booking for the hour the visitor is standing in.
    const delta = (target - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + delta);
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: string;
    title: string;
    locality?: string;
    city?: string;
    price: number;
    listing_type?: string;
    owner_name?: string;
    owner_phone?: string;
    bhk_type?: string;
  };
}

export function ScheduleVisitModal({ isOpen, onClose, property }: ScheduleVisitModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>("Tomorrow");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<(typeof VISIT_SLOTS)[number]>(
    VISIT_SLOTS[0],
  );
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  if (!isOpen) return null;

  const dateOptions = [
    { label: "Today", value: "Today" },
    { label: "Tomorrow", value: "Tomorrow" },
    { label: "Saturday", value: "This Saturday" },
    { label: "Sunday", value: "This Sunday" },
  ];

  const timeSlots = [
    { label: "Morning", time: VISIT_SLOTS[0], icon: "🌅" },
    { label: "Afternoon", time: VISIT_SLOTS[1], icon: "☀️" },
    { label: "Evening", time: VISIT_SLOTS[2], icon: "🌆" },
  ];

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tenantName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    const cleanPhone = tenantPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);

    const result = await scheduleVisit({
      propertyId: property.id,
      name: tenantName.trim(),
      phone: cleanPhone,
      preferredDate: isoDateForOption(selectedDate),
      preferredSlot: selectedTimeSlot,
      visitType: "in_person",
      notes: notes || "Requested via Seedha Instant Visit Booking",
    });

    setIsSubmitting(false);

    if (!result.ok) {
      // This used to console.warn the failure and show "scheduled successfully"
      // anyway, so a visitor was told a homeowner had been notified when
      // nothing had been stored at all.
      toast.error(result.error);
      return;
    }

    setIsBooked(true);
    toast.success("Site visit scheduled successfully!", {
      description: "The verified homeowner has been notified to confirm your walkthrough.",
    });
  };

  const handleWhatsAppConfirm = () => {
    const text = encodeURIComponent(
      `Namaste! I have scheduled a site visit for "${property.title}" on ${selectedDate} (${selectedTimeSlot}) via Seedha Properties. Looking forward to meeting you. - ${tenantName}`,
    );
    // No fallback number. This used to default to a hardcoded 919876543210,
    // which sent a stranger's visit details to whoever owns that number.
    const phone = (property.owner_phone ?? "").replace(/\D/g, "");
    if (phone.length < 10) {
      toast.error("This owner has not shared a WhatsApp number. They will call you instead.");
      return;
    }
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-card border border-border/80 shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {isBooked ? (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
              <CalendarCheck className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-foreground">
                Visit Scheduled with Homeowner!
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                Your walkthrough for <strong>{property.title}</strong> is confirmed for{" "}
                <strong className="text-foreground">
                  {selectedDate} ({selectedTimeSlot})
                </strong>
                .
              </p>
            </div>

            <div className="bg-secondary/40 rounded-2xl p-4 border border-border/50 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Property:</span>
                <span className="font-bold text-foreground truncate max-w-[220px]">
                  {property.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-semibold text-foreground">
                  {property.locality || property.city || "Hyderabad"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Brokerage:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹0 (Direct Owner)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleWhatsAppConfirm}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Confirm on WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBooking} className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">
                <ShieldCheck className="h-3.5 w-3.5" /> 100% Free Guided Walkthrough
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
                Schedule a Free Property Visit
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {property.title} • {property.locality || property.city || "Hyderabad"}
              </p>
            </div>

            {/* 1. Pick a Day */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Select Visit Day
              </label>
              <div className="grid grid-cols-4 gap-2">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedDate(opt.value)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border cursor-pointer ${
                      selectedDate === opt.value
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/60"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Pick a Time Slot */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" /> Preferred Time Window
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot.time)}
                    className={`p-2.5 rounded-xl text-left transition border cursor-pointer ${
                      selectedTimeSlot === slot.time
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-secondary/40 hover:bg-secondary border-border/60 text-muted-foreground"
                    }`}
                  >
                    <span className="text-sm block">{slot.icon}</span>
                    <span className="text-xs font-extrabold block text-foreground mt-1">
                      {slot.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {slot.time.split("-")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Tenant Info */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Phone Number (for SMS & WhatsApp Confirmation)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>{isSubmitting ? "Confirming Visit..." : "Schedule Free Site Visit"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
