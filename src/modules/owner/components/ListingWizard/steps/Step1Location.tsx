import React from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { MapPin, Search, Navigation, Building, Check } from "lucide-react";
import type { StepProps } from "../types";

export function Step1Location({ data, updateData }: StepProps) {
  const cities = ["Hyderabad", "Bangalore", "Mumbai", "Pune", "Chennai", "Delhi"];
  const popularLocalities = [
    "Gachibowli",
    "Madhapur",
    "Kondapur",
    "Hitech City",
    "Financial District",
    "Kokapet",
    "Jubilee Hills",
    "Banjara Hills",
  ];

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 1 of 6</span>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" /> Where is your property located?
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Accurate location details help genuine buyers and tenants discover your listing
          immediately.
        </p>
      </div>

      <div className="space-y-6">
        {/* Your Name */}
        <div className="space-y-2.5">
          <Label htmlFor="owner_name" className="text-sm font-semibold text-foreground">
            Your Name *
          </Label>
          <Input
            id="owner_name"
            placeholder="Enter your full name"
            className="h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20"
            value={data.owner_name || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateData({ owner_name: e.target.value })
            }
          />
        </div>

        {/* City Selection Pills */}
        <div className="space-y-2.5">
          <Label className="text-sm font-semibold text-foreground">Select City *</Label>
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => {
              const isSelected = data.city === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => updateData({ city })}
                  className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                      : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        {/* Building / Project / Society */}
        <div className="space-y-2.5">
          <Label htmlFor="project_name" className="text-sm font-semibold text-foreground">
            Building/Project/Society{" "}
            <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
          </Label>
          <div className="relative">
            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="project_name"
              placeholder="e.g. Prestige High Fields, My Home Bhooja"
              className="pl-10 h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20"
              value={data.project_name || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateData({ project_name: e.target.value })
              }
            />
          </div>
        </div>

        {/* Locality Input & Quick Chips */}
        <div className="space-y-2.5">
          <Label htmlFor="locality" className="text-sm font-semibold text-foreground">
            Locality / Area Name *
          </Label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="locality"
              placeholder="e.g. Madhapur, Gachibowli, Financial District"
              className="pl-10 h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20"
              value={data.locality}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateData({ locality: e.target.value })
              }
            />
          </div>

          {/* Quick Locality Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-muted-foreground font-medium mr-1">Suggested:</span>
            {popularLocalities.slice(0, 5).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => updateData({ locality: loc })}
                className="text-[11px] rounded-lg bg-secondary/50 px-2 py-1 text-muted-foreground hover:text-primary hover:bg-secondary transition border border-border/40 cursor-pointer"
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Full Address */}
        <div className="space-y-2.5">
          <Label htmlFor="address" className="text-sm font-semibold text-foreground">
            Full Address / Building Name *
          </Label>
          <Input
            id="address"
            placeholder="Flat No, Wing / Floor, Apartment or Building Name, Street / Road"
            className="h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20"
            value={data.address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateData({ address: e.target.value })
            }
          />
        </div>

        {/* Landmark */}
        <div className="space-y-2.5">
          <Label htmlFor="landmark" className="text-sm font-semibold text-foreground">
            Prominent Landmark{" "}
            <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
          </Label>
          <Input
            id="landmark"
            placeholder="e.g. Opposite Cyber Towers, Near Apollo Cradle Hospital"
            className="h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20"
            value={data.landmark}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateData({ landmark: e.target.value })
            }
          />
        </div>
      </div>

      {/* Google Map Pin Confirmation Card */}
      <div className="p-5 bg-gradient-to-br from-primary/5 via-secondary/20 to-transparent border border-border/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Google Map Geolocation Sync</h4>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
              Listing addresses in {data.city || "Hyderabad"} are automatically geocoded with
              satellite coordinates and nearby metro & transit hubs.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
          <Check className="h-3.5 w-3.5" /> Auto-Geocoded
        </div>
      </div>
    </div>
  );
}
