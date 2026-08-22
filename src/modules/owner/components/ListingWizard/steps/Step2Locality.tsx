import React from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { MapPin, Search, Building, Check, Globe, Sparkles, Map, Shield } from "lucide-react";
import type { StepProps } from "../types";

const MAJOR_METROS = [
  "Hyderabad",
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Chennai",
  "Pune",
  "Kolkata",
];

const CITY_LOCALITIES: Record<string, string[]> = {
  Hyderabad: [
    "Gachibowli",
    "Madhapur",
    "Kondapur",
    "Hitech City",
    "Financial District",
    "Kokapet",
    "Jubilee Hills",
    "Banjara Hills",
    "Manikonda",
    "Kukatpally",
  ],
  Bengaluru: [
    "Whitefield",
    "Indiranagar",
    "Koramangala",
    "HSR Layout",
    "Bellandur",
    "Electronic City",
    "JP Nagar",
    "Hebbal",
    "Sarjapur Road",
  ],
  Mumbai: [
    "Andheri West",
    "Bandra West",
    "Powai",
    "Juhu",
    "Worli",
    "Thane West",
    "Kandivali East",
    "Navi Mumbai",
  ],
  "Delhi NCR": [
    "Gurugram DLF",
    "Golf Course Road",
    "Noida Sector 62",
    "South Extension",
    "Vasant Kunj",
    "Dwarka",
  ],
  Chennai: ["OMR", "Adyar", "Anna Nagar", "Velachery", "T. Nagar", "Thiruvanmiyur", "Besant Nagar"],
  Pune: ["Kothrud", "Viman Nagar", "Hinjewadi", "Baner", "Wakad", "Kalyani Nagar", "Hadapsar"],
  Kolkata: ["New Town", "Salt Lake Sector V", "Ballygunge", "Alipore", "Park Street", "Rajarhat"],
};

export function Step2Locality({ data, updateData }: StepProps) {
  const currentCity = data.city || "Hyderabad";
  const popularLocalities = CITY_LOCALITIES[currentCity] || CITY_LOCALITIES["Hyderabad"];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          Locality & Address
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Accurate location details help genuine buyers and tenants discover your listing in local
          searches.
        </p>
      </div>

      {/* Owner Contact Card */}
      <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-7 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-foreground border-b border-border/40 pb-3 flex items-center justify-between">
          <span>Owner Information</span>
          <span className="text-[10px] tracking-wider uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Shield className="w-3 h-3" />
            0% Brokerage · Direct Owner
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="owner_name" className="text-sm font-semibold text-foreground">
              Your Full Name *
            </Label>
            <Input
              id="owner_name"
              placeholder="e.g. Ramesh Reddy"
              className="h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              value={data.owner_name || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateData({ owner_name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="owner_phone" className="text-sm font-semibold text-foreground">
              WhatsApp / Phone Number *
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                +91
              </span>
              <Input
                id="owner_phone"
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile number"
                className="h-11 pl-12 rounded-xl bg-background border-border/80 text-sm font-medium tracking-wide focus:ring-2 focus:ring-primary/20 transition-all"
                value={(data.owner_phone || "").replace(/^\+?91/, "")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const cleaned = e.target.value.replace(/\D/g, "");
                  updateData({ owner_phone: cleaned });
                }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Buyer/tenant visit requests & enquiries are routed directly to this verified number.
            </p>
          </div>
        </div>
      </div>

      {/* City & Locality Selector */}
      <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-7 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-foreground border-b border-border/40 pb-3">
          City & Locality
        </h3>

        {/* City Selector */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">City *</Label>
          <div className="flex flex-wrap gap-2">
            {MAJOR_METROS.map((metro) => {
              const isSelected = (data.city || "Hyderabad") === metro;
              return (
                <button
                  key={metro}
                  type="button"
                  onClick={() => updateData({ city: metro, locality: "" })}
                  className={`px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border/80 bg-background text-foreground hover:bg-secondary"
                  }`}
                >
                  {metro}
                </button>
              );
            })}
          </div>
        </div>

        {/* Locality Input & Quick Chips */}
        <div className="space-y-3 pt-2">
          <Label htmlFor="locality" className="text-sm font-semibold text-foreground">
            Locality / Area *
          </Label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="locality"
              placeholder={`Search locality in ${currentCity}...`}
              className="h-11 pl-10 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              value={data.locality || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateData({ locality: e.target.value })
              }
            />
          </div>

          {/* Popular locality chips */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs text-muted-foreground font-medium">Popular localities:</span>
            <div className="flex flex-wrap gap-1.5">
              {popularLocalities.map((loc) => {
                const isSelected = data.locality === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => updateData({ locality: loc })}
                    className={`px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary/50 bg-primary/10 text-primary font-bold"
                        : "border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Project Name, Landmark & Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-border/40">
          <div className="space-y-2">
            <Label htmlFor="project_name" className="text-sm font-semibold text-foreground">
              Society / Apartment Name{" "}
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="project_name"
              placeholder="e.g. My Home Bhooja, Aparna Sarovar"
              className="h-11 rounded-xl bg-background border-border/80 text-sm"
              value={data.project_name || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateData({ project_name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark" className="text-sm font-semibold text-foreground">
              Nearby Landmark{" "}
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="landmark"
              placeholder="e.g. Near Metro Station / Inorbit Mall"
              className="h-11 rounded-xl bg-background border-border/80 text-sm"
              value={data.landmark || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateData({ landmark: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-semibold text-foreground">
            Street Address *
          </Label>
          <Input
            id="address"
            placeholder="e.g. Flat 302, Block A, Main Road"
            className="h-11 rounded-xl bg-background border-border/80 text-sm"
            value={data.address || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateData({ address: e.target.value })
            }
          />
        </div>
      </div>

      {/* Privacy-First Approximate Location Notice */}
      <div className="bg-secondary/40 rounded-2xl border border-border/60 p-4 sm:p-5 flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
          <Map className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs sm:text-sm">
          <div className="font-bold text-foreground flex items-center gap-1.5">
            <span>Privacy-First Map Protection</span>
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
              Active
            </span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Your exact house/flat coordinates are never exposed publicly. Public property search and
            detail pages display an approximate locality circle (approx. 500m radius) around{" "}
            {data.locality || data.city || "your area"} to protect your privacy while giving tenants
            clear geographic context.
          </p>
        </div>
      </div>
    </div>
  );
}
