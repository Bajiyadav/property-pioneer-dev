import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Briefcase,
  Calendar,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { TenantSignUpFlow } from "./TenantSignUpFlow";
import type { TenantProfile as TenantProfileType } from "../types";

export function TenantProfileView() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<TenantProfileType>(() => {
    try {
      const raw = localStorage.getItem("sp_tenant_profile");
      if (raw) return JSON.parse(raw) as TenantProfileType;
    } catch (e) {
      console.debug("No stored tenant profile found:", e);
    }
    return {
      phone_number: "9876543210",
      full_name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
      company_name: "Google India",
      profession: "Senior Software Engineer",
      annual_salary_min: 1500000,
      annual_salary_max: 2800000,
      budget_min: 20000,
      budget_max: 40000,
      preferred_bhk: ["2 BHK", "3 BHK"],
      move_in_date: new Date().toISOString().split("T")[0],
      is_vegetarian: false,
      pets_allowed: true,
      preferred_furnishing: "semi-furnished",
      preferred_building_type: "Gated Apartment",
      special_amenities: ["Lift", "Power Backup", "Gym", "Reserved Parking"],
      primary_city: "Hyderabad",
      primary_locality: "Madhapur",
      secondary_cities: ["Bengaluru", "Pune"],
      office_name: "HITEC City Phase 2",
      max_commute_minutes: 30,
      profile_completeness: 95,
    };
  });

  if (isEditing) {
    return (
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Your Match Profile</h2>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
        <TenantSignUpFlow
          initialData={profile}
          onComplete={(updated) => {
            setProfile(updated);
            setIsEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Header Profile Card */}
      <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-2xl font-black shadow-md">
              {profile.full_name.charAt(0) || "T"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
                  {profile.full_name}
                </h1>
                <span className="text-[11px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Verified Seeker
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {profile.profession} at <strong>{profile.company_name}</strong>
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setIsEditing(true)}
            className="bg-primary text-primary-foreground font-bold rounded-xl"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" /> Edit Profile & Preferences
          </Button>
        </div>

        {/* Profile Completeness Bar */}
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Profile Completeness
            </span>
            <span className="text-primary">{profile.profile_completeness}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500"
              style={{ width: `${profile.profile_completeness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Preferences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location & Commute */}
        <div className="rounded-3xl bg-card border border-border/80 p-6 shadow-md space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Location & Commute
          </h2>
          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Primary Locality:</span>
              <span className="font-bold text-foreground">
                {profile.primary_locality}, {profile.primary_city}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Office Destination:</span>
              <span className="font-bold text-foreground">
                {profile.office_name || "Central Tech Park"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Max Commute Time:</span>
              <span className="font-bold text-foreground">
                Under {profile.max_commute_minutes} minutes
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Secondary Cities:</span>
              <span className="font-bold text-foreground">
                {profile.secondary_cities.join(", ") || "None"}
              </span>
            </div>
          </div>
        </div>

        {/* Budget & Layout Requirements */}
        <div className="rounded-3xl bg-card border border-border/80 p-6 shadow-md space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" /> Budget & Living Preferences
          </h2>
          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Monthly Rent Range:</span>
              <span className="font-extrabold text-primary">
                ₹{profile.budget_min.toLocaleString("en-IN")} – ₹
                {profile.budget_max.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Preferred BHK:</span>
              <span className="font-bold text-foreground">{profile.preferred_bhk.join(", ")}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Furnishing Status:</span>
              <span className="font-bold text-foreground capitalize">
                {profile.preferred_furnishing}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Food / Pets:</span>
              <span className="font-bold text-foreground">
                {profile.is_vegetarian ? "Strict Vegetarian" : "Any"} ·{" "}
                {profile.pets_allowed ? "Pets Allowed" : "No Pets"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA to view matched properties */}
      <div className="text-center pt-4">
        <Link
          to="/tenant/matches"
          search={{
            city: profile.primary_city,
            locality: profile.primary_locality,
            budget_min: profile.budget_min,
            budget_max: profile.budget_max,
          }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0F766E] to-[#115E59] text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
        >
          View Matched Properties ({profile.primary_locality}) <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
