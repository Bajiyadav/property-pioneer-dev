import React from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Building2, Home, Castle, Sparkles, Building, Layers } from "lucide-react";
import type { StepProps } from "../types";

export function Step2Details({ data, updateData }: StepProps) {
  const propertyTypes = [
    { value: "Apartment", label: "Apartment", icon: Building2 },
    { value: "Independent House", label: "Independent House", icon: Home },
    { value: "Duplex", label: "Duplex", icon: Layers },
    { value: "Independent Floor", label: "Independent Floor", icon: Layers },
    { value: "Villa", label: "Villa", icon: Castle },
    { value: "Penthouse", label: "Penthouse", icon: Sparkles },
    { value: "Studio", label: "Studio", icon: Building },
    { value: "Farm House", label: "Farm House", icon: Home },
  ];

  const bhkTypes = ["1 RK", "1 BHK", "1.5 BHK", "2 BHK", "3+ BHK"];
  const bathroomOptions = [1, 2, 3, 4];
  const areaUnitOptions = [
    "Sq.ft",
    "Sq.yards",
    "Sq.m",
    "Acres",
    "Bigha",
    "Hectare",
    "Marla",
    "Kanal",
    "Biswa",
  ];
  const furnishingTypes = [
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
    { value: "unfurnished", label: "Unfurnished", desc: "Basic fixtures and fittings only" },
  ] as const;

  const propertyAgeOptions = [
    "Under Construction",
    "0-1 Years",
    "1-5 Years",
    "5-10 Years",
    "10+ Years",
  ];
  const facingOptions = [
    "North",
    "East",
    "West",
    "South",
    "North-East",
    "North-West",
    "South-East",
    "South-West",
  ];

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 2 of 6</span>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" /> Tell us about your property
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Specify the layout, dimensions, and furnishings to match with verified tenants.
        </p>
      </div>

      <div className="space-y-7">
        {/* Visual Property Type Cards */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">Property Type *</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {propertyTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = data.property_type === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => updateData({ property_type: type.value })}
                  className={`group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3.5 text-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-sm scale-[1.02]"
                      : "border-border/80 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl ${isSelected ? "bg-primary text-white" : "bg-secondary text-muted-foreground group-hover:text-primary"}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold leading-tight">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Configuration (BHK & Bathrooms) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <Label className="text-sm font-semibold text-foreground">BHK Configuration *</Label>
            <div className="flex flex-wrap gap-2">
              {bhkTypes.map((bhk) => {
                const isSelected = data.bhk_type === bhk;
                return (
                  <button
                    key={bhk}
                    type="button"
                    onClick={() => updateData({ bhk_type: bhk })}
                    className={`h-11 px-3.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                        : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {bhk}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5">
            <Label className="text-sm font-semibold text-foreground">Bathrooms *</Label>
            <div className="flex flex-wrap gap-2">
              {bathroomOptions.map((bath) => {
                const isSelected = data.bathrooms === bath;
                return (
                  <button
                    key={bath}
                    type="button"
                    onClick={() => updateData({ bathrooms: bath })}
                    className={`h-11 min-w-[52px] px-3.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                        : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {bath} {bath === 4 ? "Baths+" : "Bath"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Space & Floor Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="area" className="text-sm font-semibold text-foreground">
                Built-up Area *
              </Label>
            </div>
            <div className="flex gap-2">
              <Input
                id="area"
                type="number"
                placeholder="e.g. 1250"
                value={data.area_sqft || ""}
                className="h-11 flex-1 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 font-medium"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateData({ area_sqft: parseInt(e.target.value) || 0 })
                }
              />
              <select
                className="h-11 rounded-xl border border-border/80 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer w-[120px]"
                value={data.area_unit || "Sq.ft"}
                onChange={(e) => updateData({ area_unit: e.target.value })}
              >
                {areaUnitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2.5">
            <Label className="text-sm font-semibold text-foreground">Floor Details *</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Exact Floor"
                value={data.exact_floor || ""}
                className="h-11 flex-1 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 font-medium"
                onChange={(e) => updateData({ exact_floor: parseInt(e.target.value) || 0 })}
              />
              <span className="flex items-center text-sm text-muted-foreground">of</span>
              <Input
                type="number"
                placeholder="Total Floors"
                value={data.total_floors || ""}
                className="h-11 flex-1 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 font-medium"
                onChange={(e) => updateData({ total_floors: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Critical Property Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2.5">
            <Label className="text-sm font-semibold text-foreground">Property Age</Label>
            <select
              className="flex h-11 w-full items-center justify-between rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              value={data.property_age || "0-1 Years"}
              onChange={(e) => updateData({ property_age: e.target.value })}
            >
              {propertyAgeOptions.map((age) => (
                <option key={age} value={age}>
                  {age}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2.5">
            <Label className="text-sm font-semibold text-foreground">Facing (Vastu)</Label>
            <select
              className="flex h-11 w-full items-center justify-between rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              value={data.facing || "East"}
              onChange={(e) => updateData({ facing: e.target.value })}
            >
              {facingOptions.map((face) => (
                <option key={face} value={face}>
                  {face}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2.5">
            <Label className="text-sm font-semibold text-foreground">Balconies</Label>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 2"
              value={data.balconies !== undefined ? data.balconies : ""}
              className="h-11 w-full rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 font-medium"
              onChange={(e) => updateData({ balconies: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2.5">
            <Label className="text-sm font-semibold text-foreground">Covered Parking</Label>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 1"
              value={data.parking_covered !== undefined ? data.parking_covered : ""}
              className="h-11 w-full rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 font-medium"
              onChange={(e) => updateData({ parking_covered: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2.5">
            <Label className="text-sm font-semibold text-foreground">Open Parking</Label>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 0"
              value={data.parking_open !== undefined ? data.parking_open : ""}
              className="h-11 w-full rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 font-medium"
              onChange={(e) => updateData({ parking_open: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Furnishing Status Cards */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">Furnishing Status *</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {furnishingTypes.map((type) => {
              const isSelected = data.furnishing_status === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => updateData({ furnishing_status: type.value })}
                  className={`flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm scale-[1.01]"
                      : "border-border/80 bg-background/50 hover:border-primary/40"
                  }`}
                >
                  <span
                    className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground"}`}
                  >
                    {type.label}
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{type.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
