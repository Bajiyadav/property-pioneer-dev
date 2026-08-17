import React from "react";
import { Label } from "@/shared/components/ui/label";
import {
  Sparkles,
  Wifi,
  Shield,
  Car,
  Dumbbell,
  Waves,
  Zap,
  Building,
  TreePine,
  Flame,
  Droplets,
  PhoneCall,
  Compass,
  AirVent,
  Check,
} from "lucide-react";
import type { StepProps } from "../types";

export function Step4Amenities({ data, updateData }: StepProps) {
  const commonAmenities = [
    { name: "Lift", icon: Building },
    { name: "Power Backup", icon: Zap },
    { name: "24x7 Security", icon: Shield },
    { name: "Reserved Parking", icon: Car },
    { name: "Internet / Wi-Fi", icon: Wifi },
    { name: "Air Conditioner", icon: AirVent },
    { name: "Gymnasium", icon: Dumbbell },
    { name: "Swimming Pool", icon: Waves },
    { name: "Park / Garden", icon: TreePine },
    { name: "Piped Gas", icon: Flame },
    { name: "RO Water System", icon: Droplets },
    { name: "Intercom Facility", icon: PhoneCall },
    { name: "Visitor Parking", icon: Car },
    { name: "Vastu Compliant", icon: Compass },
    { name: "Club House", icon: Sparkles },
  ];

  const toggleAmenity = (amenityName: string) => {
    const current = data.amenities || [];
    if (current.includes(amenityName)) {
      updateData({ amenities: current.filter((a: string) => a !== amenityName) });
    } else {
      updateData({ amenities: [...current, amenityName] });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 4 of 6</span>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Amenities & Facilities
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Select all amenities available at your property. High-amenity listings get up to 3x more
          views.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {commonAmenities.map((item) => {
            const Icon = item.icon;
            const isSelected = (data.amenities || []).includes(item.name);
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => toggleAmenity(item.name)}
                className={`group flex items-center justify-between p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-xs"
                    : "border-border/80 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground group-hover:text-primary"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`text-xs font-semibold truncate ${isSelected ? "text-foreground font-bold" : ""}`}
                  >
                    {item.name}
                  </span>
                </div>
                {isSelected && (
                  <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 ml-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
