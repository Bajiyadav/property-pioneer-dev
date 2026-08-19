import React from "react";
import { Sparkles, MapPin, IndianRupee, Home, Phone, RefreshCcw, CheckCircle2 } from "lucide-react";
import type { ExtractedTenantPreferences } from "@/modules/interactions/services/geminiService";

export interface PropertyMatchResultsProps {
  preferences: ExtractedTenantPreferences;
  onReset: () => void;
}

export const PropertyMatchResults: React.FC<PropertyMatchResultsProps> = ({
  preferences,
  onReset,
}) => {
  // Generate some mock properties based on preferences
  const mockProperties = [
    {
      id: "p1",
      title: `${preferences.bhk || "2 BHK"} Apartment in ${preferences.locality || "Madhapur"}`,
      price: preferences.budget_max ? preferences.budget_max - 2000 : 25000,
      location: preferences.locality || "Madhapur",
      bhk: preferences.bhk || "2 BHK",
      furnishing: "Semi-Furnished",
      matchScore: 98,
      commute: "15 mins to Mindspace",
      image:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: "p2",
      title: `${preferences.bhk || "2 BHK"} Flat near Metro`,
      price: preferences.budget_max ? preferences.budget_max + 1000 : 28000,
      location: preferences.locality || "Madhapur",
      bhk: preferences.bhk || "2 BHK",
      furnishing: "Fully Furnished",
      matchScore: 92,
      commute: "5 mins walk to Metro",
      image:
        "https://images.unsplash.com/photo-1502672260266-1c1de2d9d000?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: "p3",
      title: `Cozy ${preferences.bhk || "2 BHK"} with Balcony`,
      price: preferences.budget_max ? preferences.budget_max - 5000 : 22000,
      location: `${preferences.locality || "Madhapur"} border`,
      bhk: preferences.bhk || "2 BHK",
      furnishing: "Unfurnished",
      matchScore: 85,
      commute: "20 mins to Hitech City",
      image:
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=400",
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto h-[600px] border border-teal-100 rounded-3xl overflow-hidden shadow-xl bg-slate-50 flex flex-col relative animate-in zoom-in-95 duration-300">
      <div className="bg-gradient-to-r from-teal-800 to-teal-700 p-6 text-white shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-300" />
              Your Matches Found
            </h2>
            <p className="text-teal-100 text-sm mt-1">Based on your chat with Seedha AI</p>
          </div>
          <button
            onClick={onReset}
            className="h-9 px-3 rounded-full bg-teal-900/40 hover:bg-teal-900/80 text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <RefreshCcw className="h-4 w-4" />
            Start Over
          </button>
        </div>

        {/* Profile Summary Cards */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="bg-teal-900/40 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-teal-300" />
            <span>
              {preferences.locality}, {preferences.city}
            </span>
          </div>
          <div className="bg-teal-900/40 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm">
            <IndianRupee className="h-4 w-4 text-teal-300" />
            <span>Upto {preferences.budget_max?.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-teal-900/40 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm">
            <Home className="h-4 w-4 text-teal-300" />
            <span>{preferences.bhk}</span>
          </div>
          <div className="bg-teal-900/40 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-teal-300" />
            <span>{preferences.phone}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mockProperties.map((prop, idx) => (
          <div
            key={prop.id}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex gap-4"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="w-32 h-32 rounded-xl overflow-hidden shrink-0">
              <img src={prop.image} alt={prop.title} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 line-clamp-1">{prop.title}</h3>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    {prop.matchScore}% Match
                  </span>
                </div>
                <div className="text-xl font-bold text-teal-700 mt-1">
                  ₹{prop.price.toLocaleString("en-IN")}/mo
                </div>
                <div className="text-sm text-slate-500 mt-1 space-x-3">
                  <span>{prop.furnishing}</span>
                  <span>•</span>
                  <span>{prop.commute}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  Contact Owner
                </button>
                <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg py-2 text-sm font-medium transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="text-center text-slate-500 text-sm py-4">
          Showing top 3 direct-owner matches.
        </div>
      </div>
    </div>
  );
};
