import React from "react";
import { Label } from "@/components/ui/label";
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
  Video,
  Cctv,
  Activity,
  Baby,
} from "lucide-react";
import type { StepProps } from "../types";

export function Step4Amenities({ data, updateData }: StepProps) {
  const amenityCategories = [
    {
      title: "Building & Security",
      items: [
        { name: "Lift", icon: Building },
        { name: "Power Backup", icon: Zap },
        { name: "24x7 Security", icon: Shield },
        { name: "CCTV Surveillance", icon: Cctv || Shield },
        { name: "Intercom Facility", icon: PhoneCall },
        { name: "Fire Safety", icon: Shield },
      ],
    },
    {
      title: "Parking & Utilities",
      items: [
        { name: "Reserved Parking", icon: Car },
        { name: "Visitor Parking", icon: Car },
        { name: "Piped Gas", icon: Flame },
        { name: "24x7 Water Supply", icon: Droplets },
        { name: "Internet / Wi-Fi", icon: Wifi },
      ],
    },
    {
      title: "Lifestyle & Recreation",
      items: [
        { name: "Gymnasium", icon: Dumbbell },
        { name: "Swimming Pool", icon: Waves },
        { name: "Club House", icon: Sparkles },
        { name: "Park / Garden", icon: TreePine },
        { name: "Children's Play Area", icon: Baby || Sparkles },
        { name: "Air Conditioner", icon: AirVent },
        { name: "Vastu Compliant", icon: Compass },
      ],
    },
  ];

  const toggleAmenity = (amenityName: string) => {
    const current = data.amenities || [];
    if (current.includes(amenityName)) {
      updateData({ amenities: current.filter((a: string) => a !== amenityName) });
    } else {
      updateData({ amenities: [...current, amenityName] });
    }
  };

  const selectAll = () => {
    const all = amenityCategories.flatMap((cat) => cat.items.map((i) => i.name));
    updateData({ amenities: Array.from(new Set([...(data.amenities || []), ...all])) });
  };

  const clearAll = () => {
    updateData({ amenities: [] });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Amenities & Facilities
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select all amenities available at your property. Properties with complete amenities
            receive up to 3x more visit requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-semibold text-primary hover:underline px-2 py-1"
          >
            Select All
          </button>
          <span className="text-muted-foreground text-xs">·</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {amenityCategories.map((cat) => (
          <div
            key={cat.title}
            className="bg-card rounded-2xl border border-border/70 p-5 sm:p-6 shadow-sm space-y-4"
          >
            <h3 className="text-sm font-bold text-foreground flex items-center justify-between">
              <span>{cat.title}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {cat.items.filter((i) => (data.amenities || []).includes(i.name)).length} /{" "}
                {cat.items.length} selected
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cat.items.map((item) => {
                const Icon = item.icon;
                const isSelected = (data.amenities || []).includes(item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => toggleAmenity(item.name)}
                    className={`group flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/20"
                        : "border-border/80 bg-background text-muted-foreground hover:border-border hover:text-foreground hover:bg-secondary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold truncate">{item.name}</span>
                    </div>
                    {isSelected && (
                      <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 ml-1">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
