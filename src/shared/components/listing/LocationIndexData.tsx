import React, { useState, useEffect } from "react";
import {
  MapPin,
  TrendingUp,
  Train,
  Briefcase,
  GraduationCap,
  HeartPulse,
  IndianRupee,
  Building,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  getLocalityIndexedData,
  type LocalityData,
} from "@/modules/property/services/localityService";

export interface LocationIndexDataProps {
  city: string;
  locality: string;
  className?: string;
  onProceed?: () => void;
}

export const LocationIndexData: React.FC<LocationIndexDataProps> = ({
  city,
  locality,
  className = "",
  onProceed,
}) => {
  const [data, setData] = useState<LocalityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getLocalityIndexedData(city, locality).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [city, locality]);

  if (loading) {
    return (
      <div
        className={`p-6 rounded-2xl bg-secondary/30 border border-border flex items-center justify-center gap-3 ${className}`}
      >
        <Loader2 className="h-5 w-5 animate-spin text-[#0F766E]" />
        <span className="text-sm font-medium text-muted-foreground">
          Fetching live indexed data for {locality || city}...
        </span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className={`rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-4 sm:p-5 space-y-4 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border/60 pb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0F766E]/10 text-[#0F766E] dark:text-[#14B8A6] text-[11px] font-bold">
            <Sparkles className="h-3 w-3" /> Indexed Market Intelligence
          </div>
          <h4 className="text-base font-extrabold text-foreground mt-1 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-[#0F766E]" />
            {data.locality_name}, {data.city}
          </h4>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {data.properties_count}+ Listings
          </span>
          <p className="text-[10px] text-muted-foreground">High Seeker Demand</p>
        </div>
      </div>

      {/* 1. Market Rates Matrix */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5 text-[#0F766E]" /> Average Market Rates
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-secondary/60 border border-border/60 text-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">
              1 BHK Rent
            </span>
            <span className="text-xs font-extrabold text-foreground">
              ₹{data.average_rent_1bhk.toLocaleString("en-IN")}/m
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0F766E]/10 border border-[#0F766E]/30 text-center">
            <span className="text-[10px] font-bold text-[#0F766E] dark:text-[#14B8A6] uppercase block">
              2 BHK Rent
            </span>
            <span className="text-xs font-extrabold text-foreground">
              ₹{data.average_rent_2bhk.toLocaleString("en-IN")}/m
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/60 border border-border/60 text-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">
              3 BHK Rent
            </span>
            <span className="text-xs font-extrabold text-foreground">
              ₹{data.average_rent_3bhk.toLocaleString("en-IN")}/m
            </span>
          </div>
        </div>
      </div>

      {/* 2. Key Locality Highlights & Amenities */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Building className="h-3.5 w-3.5 text-[#0F766E]" /> Locality Highlights & Transit
        </p>
        <div className="space-y-1.5 text-xs text-foreground/90">
          {data.nearby_metro_station && (
            <div className="flex items-center gap-2 bg-secondary/40 p-2 rounded-lg">
              <Train className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span className="truncate">
                <strong className="text-foreground font-semibold">Metro:</strong>{" "}
                {data.nearby_metro_station}
              </span>
            </div>
          )}

          {data.nearby_tech_parks && data.nearby_tech_parks.length > 0 && (
            <div className="flex items-center gap-2 bg-secondary/40 p-2 rounded-lg">
              <Briefcase className="h-3.5 w-3.5 text-purple-500 shrink-0" />
              <span className="truncate">
                <strong className="text-foreground font-semibold">IT Corridors:</strong>{" "}
                {data.nearby_tech_parks.map((t) => `${t.name} (${t.distance_km} km)`).join(", ")}
              </span>
            </div>
          )}

          {data.nearby_hospitals && data.nearby_hospitals.length > 0 && (
            <div className="flex items-center gap-2 bg-secondary/40 p-2 rounded-lg">
              <HeartPulse className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span className="truncate">
                <strong className="text-foreground font-semibold">Healthcare:</strong>{" "}
                {data.nearby_hospitals.map((h) => `${h.name} (${h.distance_km} km)`).join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Trust & Guarantee Pill */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
          <ShieldCheck className="h-3.5 w-3.5" /> 100% Direct Owner Listings
        </span>
        <span>Avg {data.furnished_percentage}% Furnished</span>
      </div>
    </div>
  );
};

export default LocationIndexData;
