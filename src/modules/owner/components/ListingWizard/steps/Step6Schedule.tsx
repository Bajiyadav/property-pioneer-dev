import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Phone, MessageSquare, ShieldCheck, Check, Sparkles } from "lucide-react";
import type { StepProps, ListingFormData } from "../types";

export function Step6Schedule({ data, updateData }: StepProps) {
  const availabilityOptions = [
    "Immediate",
    "Within 15 Days",
    "Within 30 Days",
    "After Specific Date",
  ] as const;

  const dayOptions = [
    { value: "All Days", label: "All Days (Mon - Sun)" },
    { value: "Weekdays", label: "Weekdays Only (Mon - Fri)" },
    { value: "Weekends", label: "Weekends Only (Sat - Sun)" },
    { value: "Saturday", label: "Saturday" },
    { value: "Sunday", label: "Sunday" },
  ];

  const timeSlotOptions = [
    {
      id: "Morning",
      label: "Morning",
      time: "9:00 AM – 12:00 PM",
      desc: "Good for daylight viewing",
    },
    {
      id: "Afternoon",
      label: "Afternoon",
      time: "12:00 PM – 4:00 PM",
      desc: "Flexible daytime slots",
    },
    {
      id: "Evening",
      label: "Evening",
      time: "4:00 PM – 7:30 PM",
      desc: "Convenient after work hours",
    },
    {
      id: "Any Time",
      label: "Any Time",
      time: "With Prior Confirmation",
      desc: "Available on call",
    },
  ];

  const toggleDay = (day: string) => {
    const current = data.visit_days || ["All Days"];
    if (day === "All Days") {
      updateData({ visit_days: ["All Days"] });
      return;
    }
    const filtered = current.filter((d) => d !== "All Days");
    if (filtered.includes(day)) {
      const next = filtered.filter((d) => d !== day);
      updateData({ visit_days: next.length === 0 ? ["All Days"] : next });
    } else {
      updateData({ visit_days: [...filtered, day] });
    }
  };

  const toggleSlot = (slot: string) => {
    const current = data.visit_time_slots || ["Morning", "Evening"];
    if (slot === "Any Time") {
      updateData({ visit_time_slots: ["Any Time"] });
      return;
    }
    const filtered = current.filter((s) => s !== "Any Time");
    if (filtered.includes(slot)) {
      const next = filtered.filter((s) => s !== slot);
      updateData({ visit_time_slots: next.length === 0 ? ["Any Time"] : next });
    } else {
      updateData({ visit_time_slots: [...filtered, slot] });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" /> Visit Schedule & Availability
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Specify when prospective tenants/buyers can schedule visits. Visit requests are delivered
          directly to your WhatsApp.
        </p>
      </div>

      {/* Property Move-In / Possession Availability */}
      <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-7 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-foreground border-b border-border/40 pb-3">
          Property Availability
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {availabilityOptions.map((opt) => {
            const isSelected = (data.visit_availability || "Immediate") === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => updateData({ visit_availability: opt })}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/30"
                    : "border-border/80 bg-background text-foreground hover:bg-secondary/50"
                }`}
              >
                <div className="text-xs sm:text-sm font-semibold">{opt}</div>
              </button>
            );
          })}
        </div>

        <div className="space-y-2 pt-2">
          <Label htmlFor="available_from" className="text-sm font-semibold text-foreground">
            Available From Date
          </Label>
          <Input
            id="available_from"
            type="date"
            className="h-11 w-full sm:w-1/2 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20"
            value={data.available_from || ""}
            onChange={(e) => updateData({ available_from: e.target.value })}
          />
        </div>
      </div>

      {/* Preferred Visit Days */}
      <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-7 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground border-b border-border/40 pb-3">
          Preferred Visit Days
        </h3>

        <div className="flex flex-wrap gap-2.5">
          {dayOptions.map((day) => {
            const isSelected = (data.visit_days || ["All Days"]).includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border/80 bg-background text-foreground hover:bg-secondary"
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred Visit Time Slots */}
      <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-7 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground border-b border-border/40 pb-3">
          Preferred Visit Time Slots
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {timeSlotOptions.map((slot) => {
            const isSelected = (data.visit_time_slots || ["Morning", "Evening"]).includes(slot.id);
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => toggleSlot(slot.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary/20"
                    : "border-border/80 bg-background text-muted-foreground hover:border-border hover:bg-secondary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{slot.label}</span>
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <div className="text-xs font-semibold text-primary mt-1">{slot.time}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{slot.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Direct Contact Preference */}
      <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-7 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground border-b border-border/40 pb-3">
          Contact Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: "all", label: "WhatsApp & Phone Call", icon: MessageSquare },
            { value: "whatsapp_only", label: "WhatsApp Only", icon: MessageSquare },
            { value: "call_only", label: "Phone Call Only", icon: Phone },
          ].map((item) => {
            const isSelected = (data.contact_preference || "all") === item.value;
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  updateData({
                    contact_preference: item.value as ListingFormData["contact_preference"],
                  })
                }
                className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/20"
                    : "border-border/80 bg-background text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Verified Owner Contact Details (Step 5 of flow) */}
      <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Owner & Contact Details</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Automatically linked to your verified Seedha Properties account.
            </p>
          </div>
          <span className="text-[10px] tracking-wider uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
            0% Brokerage
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="owner_name" className="text-xs font-semibold text-foreground">
              Owner Full Name *
            </Label>
            <Input
              id="owner_name"
              placeholder="e.g. Ramesh Reddy"
              className="h-11 rounded-xl bg-background border-border/80 text-sm"
              value={data.owner_name || ""}
              onChange={(e) => updateData({ owner_name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="owner_phone" className="text-xs font-semibold text-foreground">
                WhatsApp Contact Number *
              </Label>
              {/^[6-9]\d{9}$/.test((data.owner_phone || "").replace(/\D/g, "")) && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Valid WhatsApp
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                +91
              </span>
              <Input
                id="owner_phone"
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile number"
                className="h-11 pl-12 rounded-xl bg-background border-border/80 text-sm font-medium"
                value={(data.owner_phone || "").replace(/^\+?91/, "")}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "");
                  updateData({ owner_phone: cleaned });
                }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Genuine tenant and buyer enquiries and visit notifications will be sent directly to
              this number.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
