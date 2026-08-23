import React from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import {
  Building2,
  Home,
  Castle,
  Sparkles,
  Building,
  Layers,
  MapPin,
  Compass,
  Check,
  ShieldCheck,
} from "lucide-react";
import type { StepProps } from "../types";

export function Step1PropertyDetails({ data, updateData }: StepProps) {
  const categories = [
    { value: "Apartment", label: "Apartment", icon: Building2 },
    { value: "Independent House", label: "Independent House", icon: Home },
    { value: "Villa", label: "Villa", icon: Castle },
    { value: "Builder Floor", label: "Builder Floor", icon: Layers },
    { value: "Studio", label: "Studio", icon: Building },
    { value: "Plot", label: "Plot / Land", icon: MapPin },
    { value: "PG", label: "PG / Co-Living", icon: Home },
    { value: "Commercial", label: "Commercial", icon: Building2 },
  ];

  const bhkOptions = ["1 RK", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5+ BHK"];
  const bathroomOptions = [1, 2, 3, 4, 5];
  const balconyOptions = [0, 1, 2, 3, 4];
  const propertyAgeOptions = [
    "Under Construction",
    "0-1 Years",
    "1-5 Years",
    "5-10 Years",
    "10+ Years",
  ];
  const facingOptions = [
    "East",
    "North",
    "West",
    "South",
    "North-East",
    "North-West",
    "South-East",
    "South-West",
  ];
  const furnishingOptions = [
    {
      value: "fully-furnished",
      label: "Fully Furnished",
      desc: "Sofa, TV, Beds, AC, Fridge, Wardrobes",
    },
    {
      value: "semi-furnished",
      label: "Semi Furnished",
      desc: "Wardrobes, Modular Kitchen, Fans & Lights",
    },
    {
      value: "unfurnished",
      label: "Unfurnished",
      desc: "Basic fixtures and fittings only",
    },
  ] as const;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Direct Owner Listing · 0% Brokerage</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          Property Details
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Specify your property type, layout, dimensions, and construction specs to match with
          genuine buyers and tenants.
        </p>
      </div>

      {/* Purpose: Rent vs Sell */}
      <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-6 shadow-sm space-y-4">
        <Label className="text-sm font-bold text-foreground">Looking to Rent or Sell? *</Label>
        <div
          className="grid grid-cols-2 gap-3 sm:gap-4"
          role="radiogroup"
          aria-label="Listing Intent"
        >
          <button
            type="button"
            role="radio"
            aria-checked={data.listing_type !== "sale"}
            onClick={() => updateData({ listing_type: "rent" })}
            className={`p-4 sm:p-5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer relative ${
              data.listing_type !== "sale"
                ? "border-primary bg-primary/10 text-primary font-bold shadow-sm ring-2 ring-primary/20"
                : "border-border/80 bg-background text-muted-foreground hover:border-border hover:bg-secondary/40 font-medium"
            }`}
          >
            {data.listing_type !== "sale" && (
              <div className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
            <span className="text-base sm:text-lg font-extrabold text-foreground">For Rent</span>
            <span className="text-xs text-muted-foreground font-medium">Monthly rental income</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={data.listing_type === "sale"}
            onClick={() => updateData({ listing_type: "sale" })}
            className={`p-4 sm:p-5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer relative ${
              data.listing_type === "sale"
                ? "border-primary bg-primary/10 text-primary font-bold shadow-sm ring-2 ring-primary/20"
                : "border-border/80 bg-background text-muted-foreground hover:border-border hover:bg-secondary/40 font-medium"
            }`}
          >
            {data.listing_type === "sale" && (
              <div className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
            <span className="text-base sm:text-lg font-extrabold text-foreground">For Sale</span>
            <span className="text-xs text-muted-foreground font-medium">
              Sell directly at 0% brokerage
            </span>
          </button>
        </div>
      </div>

      {/* Property Category */}
      <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-6 shadow-sm space-y-4">
        <Label className="text-sm font-bold text-foreground">Property Category *</Label>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5"
          role="radiogroup"
          aria-label="Property Category"
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = data.property_type === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => updateData({ property_type: cat.value })}
                className={`p-3 sm:p-3.5 min-h-[56px] rounded-xl border transition-all text-left flex items-center gap-2.5 sm:gap-3 cursor-pointer relative ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                    : "border-border/80 bg-background text-foreground hover:bg-secondary/50 hover:border-border"
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold leading-snug break-words hyphens-none flex-1">
                  {cat.label}
                </span>
                {isSelected && <Check className="h-4 w-4 text-primary shrink-0 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Configuration & BHK */}
      {data.property_type !== "Plot" && (
        <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-6 shadow-sm space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold text-foreground">BHK Configuration *</Label>
            <div className="flex flex-wrap gap-2.5">
              {bhkOptions.map((bhk) => {
                const isSelected = data.bhk_type === bhk;
                return (
                  <button
                    key={bhk}
                    type="button"
                    onClick={() => {
                      const beds = parseInt(bhk) || (bhk.includes("1 RK") ? 1 : 1);
                      updateData({ bhk_type: bhk, bedrooms: beds });
                    }}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border/80 bg-background text-foreground hover:bg-secondary hover:border-border"
                    }`}
                  >
                    {bhk}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-border/40">
            {/* Bathrooms */}
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold text-foreground">Bathrooms *</Label>
              <div className="flex gap-2">
                {bathroomOptions.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => updateData({ bathrooms: num })}
                    className={`flex-1 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      data.bathrooms === num
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/80 bg-background text-foreground hover:bg-secondary"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Balconies */}
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold text-foreground">Balconies</Label>
              <div className="flex gap-2">
                {balconyOptions.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => updateData({ balconies: num })}
                    className={`flex-1 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      (data.balconies ?? 1) === num
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/80 bg-background text-foreground hover:bg-secondary"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dimensions & Areas */}
      <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-foreground">Area & Dimensions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="area_sqft" className="text-sm font-semibold text-foreground">
              Built-up Area (sq.ft.) *
            </Label>
            <Input
              id="area_sqft"
              type="number"
              min="100"
              placeholder="e.g. 1250"
              className="h-11 rounded-xl bg-background border-border/80 text-sm"
              value={data.area_sqft || ""}
              onChange={(e) => updateData({ area_sqft: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="carpet_area_sqft" className="text-sm font-semibold text-foreground">
              Carpet Area (sq.ft.){" "}
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="carpet_area_sqft"
              type="number"
              min="50"
              placeholder="e.g. 1000"
              className="h-11 rounded-xl bg-background border-border/80 text-sm"
              value={data.carpet_area_sqft || ""}
              onChange={(e) => updateData({ carpet_area_sqft: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Floor & Building Details */}
      {data.property_type !== "Plot" && (
        <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-foreground">Floor & Structure Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label htmlFor="exact_floor" className="text-sm font-semibold text-foreground">
                Property on Floor
              </Label>
              <Input
                id="exact_floor"
                type="number"
                min="0"
                placeholder="e.g. 3 (0 for Ground)"
                className="h-11 rounded-xl bg-background border-border/80 text-sm"
                value={data.exact_floor ?? ""}
                onChange={(e) => updateData({ exact_floor: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_floors" className="text-sm font-semibold text-foreground">
                Total Floors in Building
              </Label>
              <Input
                id="total_floors"
                type="number"
                min="1"
                placeholder="e.g. 10"
                className="h-11 rounded-xl bg-background border-border/80 text-sm"
                value={data.total_floors ?? ""}
                onChange={(e) => updateData({ total_floors: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Property Age</Label>
              <select
                value={data.property_age || "0-1 Years"}
                onChange={(e) => updateData({ property_age: e.target.value })}
                className="h-11 w-full rounded-xl bg-background border border-border/80 px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20"
              >
                {propertyAgeOptions.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-border/40">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-muted-foreground" />
                <span>Facing Direction</span>
              </Label>
              <select
                value={data.facing || "East"}
                onChange={(e) => updateData({ facing: e.target.value })}
                className="h-11 w-full rounded-xl bg-background border border-border/80 px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20"
              >
                {facingOptions.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Covered Parking Slots</Label>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => updateData({ parking_covered: slot })}
                    className={`flex-1 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      (data.parking_covered ?? 1) === slot
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/80 bg-background text-foreground hover:bg-secondary"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Furnishing Status */}
      {data.property_type !== "Plot" && (
        <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-6 shadow-sm space-y-4">
          <Label className="text-sm font-bold text-foreground">Furnishing Status *</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {furnishingOptions.map((furn) => {
              const isSelected = data.furnishing_status === furn.value;
              return (
                <button
                  key={furn.value}
                  type="button"
                  onClick={() => updateData({ furnishing_status: furn.value })}
                  className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary/20"
                      : "border-border/80 bg-background text-muted-foreground hover:border-border hover:bg-secondary/40"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <div className="font-bold text-sm text-foreground">{furn.label}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">{furn.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
