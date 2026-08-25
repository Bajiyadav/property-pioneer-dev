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
