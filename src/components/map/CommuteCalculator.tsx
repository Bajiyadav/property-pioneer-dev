import React, { useState, useEffect } from "react";
import { Car, Briefcase, Train, Plane, Building2, Clock, Navigation, Loader2 } from "lucide-react";
import {
  type CommuteResult,
  getCityCommuteSummary,
} from "@/modules/property/services/commuteService";

interface CommuteCalculatorProps {
  city: string;
  latitude?: number;
  longitude?: number;
  locality?: string;
}

export const CommuteCalculator: React.FC<CommuteCalculatorProps> = ({
  city,
  latitude = 17.4483, // Default Hyderabad Hitec corridor
  longitude = 78.3915,
  locality,
}) => {
  const [commutes, setCommutes] = useState<CommuteResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    async function load() {
      const data = await getCityCommuteSummary(city, latitude, longitude);
      if (mounted) {
        setCommutes(data);
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [city, latitude, longitude]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "IT Park":
        return <Briefcase className="h-4 w-4 text-teal-600" />;
      case "Metro":
      case "Railway":
        return <Train className="h-4 w-4 text-blue-600" />;
      case "Airport":
        return <Plane className="h-4 w-4 text-indigo-600" />;
      default:
        return <Building2 className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Commute Times &amp; Connectivity</h3>
            <p className="text-xs text-slate-500">
              Live estimated drive times from {locality || city}
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
          <Navigation className="h-3 w-3 text-teal-600" />
          <span>Real-time OSRM</span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          <span className="text-xs">Calculating city transit routes...</span>
        </div>
      ) : commutes.length === 0 ? (
        <div className="text-xs text-slate-400 py-4 text-center">
          No landmarks configured for this location yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {commutes.map((c, idx) => {
            const isQuick = c.durationMinutes <= 20;
            const isModerate = c.durationMinutes > 20 && c.durationMinutes <= 40;

            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-teal-50/40 hover:border-teal-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-white shadow-xs flex items-center justify-center shrink-0">
                    {getCategoryIcon(c.category)}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-800 line-clamp-1">
                      {c.landmarkName}
                    </div>
                    <div className="text-[11px] text-slate-500">{c.distanceKm} km away</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isQuick
                        ? "bg-emerald-100 text-emerald-800"
                        : isModerate
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    <span>{c.durationMinutes} min</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
