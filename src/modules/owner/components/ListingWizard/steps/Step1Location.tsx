import React from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { MapPin, Search, Building, Check, Globe, Sparkles, Map } from "lucide-react";
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

export function Step1Location({ data, updateData }: StepProps) {
  const currentCity = data.city || "Hyderabad";
  const popularLocalities = CITY_LOCALITIES[currentCity] || CITY_LOCALITIES["Hyderabad"];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mt-1 flex items-center gap-2">
          Where is your property located?
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Accurate location details help genuine buyers and tenants discover your listing
          immediately.
        </p>
      </div>

      {/* Owner Details Card */}
      <div className="bg-card rounded-2xl border border-border/60 p-5 sm:p-7 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-foreground border-b border-border/40 pb-3 flex items-center justify-between">
          <span>Owner Details</span>
          <span className="text-[10px] tracking-wider uppercase font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            Private
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="owner_name" className="text-sm font-semibold text-foreground">
              Your Name *
            </Label>
            <Input
              id="owner_name"
              placeholder="Enter your full name"
              className="h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              value={data.owner_name || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateData({ owner_name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="owner_phone" className="text-sm font-semibold text-foreground">
              WhatsApp Number *
            </Label>
            <div className="flex gap-2">
              <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-secondary/50 text-sm font-semibold text-foreground">
                +91
              </div>
              <div className="relative flex-1">
                <Input
                  id="owner_phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  className="h-11 w-full rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 pr-10 transition-all"
                  value={data.owner_phone || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateData({ owner_phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                  }
                />
                {data.owner_phone?.length === 10 && (
                  <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500 animate-in zoom-in duration-300" />
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
              Tenants and buyers reach you on this number. It is never shown publicly on the
              listing.
            </p>
          </div>
        </div>
      </div>

      {/* Property Location Card */}
      <div className="bg-card rounded-2xl border border-border/60 p-5 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <h3 className="text-base font-bold text-foreground">Property Location</h3>
          <button
            type="button"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 transition-colors duration-200"
          >
            <Sparkles className="w-3.5 h-3.5" /> Ask Seedha AI
          </button>
        </div>

        <div className="space-y-6">
          {/* City & Pincode Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <div className="space-y-2.5">
              <Label htmlFor="city" className="text-sm font-semibold text-foreground">
                City *
              </Label>
              <Input
                id="city"
                placeholder="e.g. Hyderabad"
                className="h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                value={data.city || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateData({ city: e.target.value })
                }
              />
              {/* Quick Metro Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground font-medium mr-1 flex items-center gap-1">
                  <Globe className="h-3 w-3 text-primary" /> Metros:
                </span>
                {MAJOR_METROS.map((metro) => (
                  <button
                    key={metro}
                    type="button"
                    onClick={() => updateData({ city: metro, locality: "" })}
                    className={`text-[10px] rounded-md px-2 py-0.5 font-semibold transition border cursor-pointer ${
                      (data.city || "Hyderabad") === metro
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary border-border/60"
                    }`}
                  >
                    {metro}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="pincode" className="text-sm font-semibold text-foreground">
                Pin / Postal Code *
              </Label>
              <Input
                id="pincode"
                placeholder="e.g. 500081"
                className="h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                value={data.pincode || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateData({ pincode: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Locality Input & Quick Chips */}
            <div className="space-y-2.5">
              <Label htmlFor="locality" className="text-sm font-semibold text-foreground">
                Locality / Area Name *
              </Label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="locality"
                  placeholder="e.g. Madhapur, Gachibowli..."
                  className="pl-10 h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  value={data.locality}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateData({ locality: e.target.value })
                  }
                />
              </div>

              {/* Quick Locality Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground font-medium mr-1">
                  Suggested:
                </span>
                {popularLocalities.slice(0, 4).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => updateData({ locality: loc })}
                    className="text-[10px] rounded-md bg-secondary/50 px-2 py-0.5 text-muted-foreground hover:text-primary hover:bg-secondary transition border border-border/40 cursor-pointer"
                  >
                    {loc}
                  </button>
                ))}
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
                  placeholder="e.g. Prestige High Fields"
                  className="pl-10 h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  value={data.project_name || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateData({ project_name: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Full Address */}
            <div className="space-y-2.5">
              <Label htmlFor="address" className="text-sm font-semibold text-foreground">
                Full Address / Building Name *
              </Label>
              <Input
                id="address"
                placeholder="Flat No, Wing, Street / Road"
                className="h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
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
                placeholder="e.g. Opposite Cyber Towers"
                className="h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                value={data.landmark}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateData({ landmark: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Map Preview Area */}
        <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-muted/30 relative h-32 flex items-center justify-center">
          {/* Faux map background pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23000000\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
            }}
          ></div>

          <div className="z-10 flex flex-col items-center gap-2 p-4 text-center">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
              <MapPin className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Location Detected</p>
              <p className="text-xs text-muted-foreground max-w-xs mt-0.5">
                We've mapped your address to {data.city || "Hyderabad"} for accurate buyer search
                results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
