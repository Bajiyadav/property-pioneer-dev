import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  MapPin,
  Building2,
  Phone,
  MessageSquare,
  SlidersHorizontal,
  ChevronRight,
  UserCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { PropertyMatchingScore } from "./PropertyMatchingScore";
import type { TenantProfile, MatchedProperty } from "../types";
import { getMatchedPropertiesForTenant } from "../services/tenantFunctions";
import { useServerFn } from "@tanstack/react-start";

export function TenantSearch({ initialProfile }: { initialProfile?: Partial<TenantProfile> }) {
  const getMatchesFn = useServerFn(getMatchedPropertiesForTenant);
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [matches, setMatches] = useState<MatchedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBhk, setSelectedBhk] = useState<string>("all");
  const [selectedFurnishing, setSelectedFurnishing] = useState<string>("all");

  // Load tenant profile from localStorage or props
  useEffect(() => {
    let activeProfile: TenantProfile;
    try {
      const raw = localStorage.getItem("sp_tenant_profile");
      if (raw) {
        activeProfile = JSON.parse(raw);
      } else {
        activeProfile = {
          phone_number: "9876543210",
          full_name: "Rahul Sharma",
          email: "rahul.sharma@example.com",
          company_name: "Google India",
          profession: "Software Engineer",
          budget_min: 15000,
          budget_max: 35000,
          preferred_bhk: ["2 BHK", "3 BHK"],
          move_in_date: new Date().toISOString().split("T")[0],
          is_vegetarian: false,
          pets_allowed: false,
          preferred_furnishing: "semi-furnished",
          preferred_building_type: "Apartment",
          special_amenities: ["Lift", "Power Backup", "Security"],
          primary_city: "Hyderabad",
          primary_locality: "Madhapur",
          secondary_cities: ["Bengaluru"],
          office_name: "HITEC City Phase 2",
          max_commute_minutes: 30,
          profile_completeness: 90,
          ...initialProfile,
        };
      }
    } catch {
      activeProfile = {
        phone_number: "9876543210",
        full_name: "Rahul Sharma",
        email: "rahul.sharma@example.com",
        company_name: "Tech Corp",
        profession: "Engineer",
        budget_min: 15000,
        budget_max: 35000,
        preferred_bhk: ["2 BHK", "3 BHK"],
        move_in_date: new Date().toISOString().split("T")[0],
        is_vegetarian: false,
        pets_allowed: false,
        preferred_furnishing: "semi-furnished",
        preferred_building_type: "Apartment",
        special_amenities: [],
        primary_city: "Hyderabad",
        primary_locality: "Madhapur",
        secondary_cities: [],
        office_name: "HITEC City",
        max_commute_minutes: 30,
        profile_completeness: 85,
      };
    }

    setProfile(activeProfile);

    // Fetch and rank properties
    async function fetchMatches() {
      setIsLoading(true);
      try {
        const res = await getMatchesFn({ data: activeProfile });
        setMatches(res);
      } catch (err) {
        console.warn("Failed fetching matches:", err);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchMatches();
  }, [initialProfile, getMatchesFn]);

  // Filter matches locally
  const filteredMatches = matches.filter((p) => {
    if (selectedBhk !== "all" && !p.bhk_type.toLowerCase().includes(selectedBhk.toLowerCase())) {
      return false;
    }
    if (selectedFurnishing !== "all" && p.furnishing_status !== selectedFurnishing) {
      return false;
    }
    return true;
  });

  const handleWhatsAppContact = (property: MatchedProperty) => {
    const text = encodeURIComponent(
      `Hello! I saw your direct-owner listing on Seedha Properties for ${property.title} in ${property.locality}, ${property.city} (Rent: ₹${property.price.toLocaleString("en-IN")}/mo). I'd like to schedule a visit!`,
    );
    window.open(`https://wa.me/918905552222?text=${text}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header Profile Summary Bar */}
      {profile && (
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
                <Sparkles className="h-3 w-3" /> AI Smart Matching Active
              </span>
              <span className="text-xs text-slate-300">
                Logged in as <strong>{profile.full_name}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Properties Matching {profile.primary_locality}, {profile.primary_city}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Target: <strong>{profile.preferred_bhk.join(", ")}</strong> · Budget:{" "}
              <strong>
                ₹{profile.budget_min.toLocaleString("en-IN")} – ₹
                {profile.budget_max.toLocaleString("en-IN")}/mo
              </strong>{" "}
              · Office: <strong>{profile.office_name || "Central Hub"}</strong>
            </p>
          </div>

          <Link
            to="/tenant/onboarding"
            className="shrink-0 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Edit Preferences
          </Link>
        </div>
      )}

      {/* Filter Options Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground mr-1">BHK:</span>
          {["all", "1 BHK", "2 BHK", "3 BHK"].map((bhk) => (
            <button
              key={bhk}
              type="button"
              onClick={() => setSelectedBhk(bhk)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedBhk === bhk
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {bhk === "all" ? "All Layouts" : bhk}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground mr-1">Furnishing:</span>
          {["all", "fully-furnished", "semi-furnished", "unfurnished"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setSelectedFurnishing(f)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedFurnishing === f
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all"
                ? "Any"
                : f === "fully-furnished"
                  ? "Furnished"
                  : f === "semi-furnished"
                    ? "Semi"
                    : "Unfurnished"}
            </button>
          ))}
        </div>
      </div>

      {/* Property Results List */}
      {isLoading ? (
        <div className="space-y-4 py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-bold text-muted-foreground">
            Calculating match scores & commute times...
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-4">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <h3 className="text-lg font-bold text-foreground">
            No Exact Matches in this Price Range
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Try broadening your budget bounds or selecting all layout options to see more
            direct-owner listings.
          </p>
          <Button
            type="button"
            onClick={() => {
              setSelectedBhk("all");
              setSelectedFurnishing("all");
            }}
            variant="outline"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((property) => (
            <div
              key={property.id}
              className="group flex flex-col justify-between rounded-3xl bg-card border border-border/80 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div>
                {/* Photo & Match Score Overlay */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={
                      property.images[0] ||
                      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"
                    }
                    alt={property.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <PropertyMatchingScore
                      score={property.matchScore}
                      breakdown={property.matchBreakdown}
                      size="md"
                    />
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-emerald-400" /> {property.locality}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-extrabold text-foreground">
                        ₹{property.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium"> / month</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      0% Brokerage
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {property.title}
                  </h3>

                  {/* Commute Time Badge */}
                  {property.commuteLabel && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 px-2.5 py-1 rounded-lg">
                      <Clock className="h-3.5 w-3.5 text-teal-600" /> {property.commuteLabel}
                    </div>
                  )}

                  {/* Spec Pills */}
                  <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                    <span className="bg-secondary px-2 py-0.5 rounded-md font-semibold">
                      {property.bhk_type}
                    </span>
                    <span className="bg-secondary px-2 py-0.5 rounded-md">
                      {property.area_sqft} sq.ft
                    </span>
                    <span className="bg-secondary px-2 py-0.5 rounded-md capitalize">
                      {property.furnishing_status}
                    </span>
                  </div>

                  {/* Amenities Highlights */}
                  {property.highlights && property.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {property.highlights.map((h) => (
                        <span
                          key={h}
                          className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded"
                        >
                          ✓ {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 border-t border-border/50 mt-4 flex gap-2">
                <Button
                  type="button"
                  onClick={() => handleWhatsAppContact(property)}
                  className="flex-1 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs py-2.5 rounded-xl shadow-xs"
                >
                  <MessageSquare className="mr-1.5 h-4 w-4" /> WhatsApp Owner
                </Button>
                <Link
                  to="/properties/$id"
                  params={{ id: property.id }}
                  className="px-3 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 flex items-center justify-center"
                >
                  Details <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
