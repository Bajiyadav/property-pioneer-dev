import React, { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Home,
  IndianRupee,
  MapPin,
  Briefcase,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// This would typically come from an API, we'll mock it based on localStorage for now
export function TenantProfile() {
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    bhk: "",
    budget: "",
    company: "",
    moveInDate: "",
    city: "",
    locality: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Load from local storage mocks
    try {
      const basic = JSON.parse(localStorage.getItem("sp_tenant_profile") || "{}");
      const prefs = JSON.parse(localStorage.getItem("sp_tenant_prefs") || "{}");
      const loc = JSON.parse(localStorage.getItem("sp_tenant_location") || "{}");

      const loadedProfile = {
        name: basic.name || "",
        phone: basic.phone || "",
        bhk: prefs.bhk || "",
        budget: prefs.budget || "",
        company: "",
        moveInDate: "",
        city: loc.city || "",
        locality: loc.locality || "",
      };

      setProfile(loadedProfile);
      calculateProgress(loadedProfile);
    } catch (e) {
      // ignore
    }
  }, []);

  const calculateProgress = (data: Record<string, string>) => {
    const fields = Object.values(data);
    const filled = fields.filter((v) => v !== "").length;
    setProgress(Math.round((filled / fields.length) * 100));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Simulate API call
    setTimeout(() => {
      try {
        localStorage.setItem(
          "sp_tenant_profile",
          JSON.stringify({ name: profile.name, phone: profile.phone }),
        );
        localStorage.setItem(
          "sp_tenant_prefs",
          JSON.stringify({ bhk: profile.bhk, budget: profile.budget }),
        );
        localStorage.setItem(
          "sp_tenant_location",
          JSON.stringify({ city: profile.city, locality: profile.locality }),
        );

        toast.success("Profile updated successfully!");
        calculateProgress(profile);
      } catch (err) {
        toast.error("Failed to save profile");
      } finally {
        setIsSaving(false);
      }
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground tracking-tight">Your Tenant Profile</h1>
        <p className="text-muted-foreground mt-2">
          Complete your profile to get priority matches and direct owner contacts.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-8">
        {/* Main Form */}
        <div className="bg-card border border-border/60 rounded-3xl p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSave} className="space-y-8">
            {/* Section 1: Basic Info */}
            <div>
              <h2 className="text-lg font-bold border-b border-border/50 pb-2 mb-4">
                Basic Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Full Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="e.g. Rahul Kumar"
                    className="h-11 bg-secondary/50 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Phone Number</label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="h-11 bg-secondary/50 rounded-xl"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">Phone number is verified</p>
                </div>
              </div>
            </div>

            {/* Section 2: Preferences */}
            <div>
              <h2 className="text-lg font-bold border-b border-border/50 pb-2 mb-4">
                Rental Preferences
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-1.5">
                    <Home className="h-4 w-4 text-emerald-600" /> Preferred BHK
                  </label>
                  <select
                    value={profile.bhk}
                    onChange={(e) => setProfile({ ...profile, bhk: e.target.value })}
                    className="w-full h-11 bg-secondary/50 rounded-xl border border-border/60 px-3 text-sm outline-none cursor-pointer"
                  >
                    <option value="">Any</option>
                    <option value="1">1 BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4+">4+ BHK</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-1.5">
                    <IndianRupee className="h-4 w-4 text-emerald-600" /> Budget Range
                  </label>
                  <select
                    value={profile.budget}
                    onChange={(e) => setProfile({ ...profile, budget: e.target.value })}
                    className="w-full h-11 bg-secondary/50 rounded-xl border border-border/60 px-3 text-sm outline-none cursor-pointer"
                  >
                    <option value="">Any Budget</option>
                    <option value="Under 20k">Under ₹20,000</option>
                    <option value="20k-40k">₹20,000 - ₹40,000</option>
                    <option value="40k-80k">₹40,000 - ₹80,000</option>
                    <option value="80k+">Above ₹80,000</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Location */}
            <div>
              <h2 className="text-lg font-bold border-b border-border/50 pb-2 mb-4">Location</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-600" /> City
                  </label>
                  <Input
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    placeholder="e.g. Hyderabad"
                    className="h-11 bg-secondary/50 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-600" /> Preferred Locality
                  </label>
                  <Input
                    value={profile.locality}
                    onChange={(e) => setProfile({ ...profile, locality: e.target.value })}
                    placeholder="e.g. Madhapur"
                    className="h-11 bg-secondary/50 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Additional Details */}
            <div>
              <h2 className="text-lg font-bold border-b border-border/50 pb-2 mb-4">
                Verification Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-emerald-600" /> Company / Profession
                  </label>
                  <Input
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    placeholder="e.g. Software Engineer at Google"
                    className="h-11 bg-secondary/50 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-600" /> Move-in Date
                  </label>
                  <Input
                    type="date"
                    value={profile.moveInDate}
                    onChange={(e) => setProfile({ ...profile, moveInDate: e.target.value })}
                    className="h-11 bg-secondary/50 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-8 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-base shadow-lg"
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl p-6 border border-emerald-500/20">
            <h3 className="font-bold text-lg mb-4 text-foreground flex items-center gap-2">
              Profile Strength
            </h3>

            <div className="mb-2 flex justify-between text-sm font-bold">
              <span className="text-emerald-700 dark:text-emerald-400">{progress}% Complete</span>
            </div>

            <div className="h-2.5 w-full bg-emerald-200 dark:bg-emerald-900 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-emerald-600 transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                {profile.name && profile.phone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-bold">Basic Contact</p>
                  <p className="text-xs text-muted-foreground">Allows owners to reach you.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                {profile.bhk && profile.budget && profile.city ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-bold">Preferences</p>
                  <p className="text-xs text-muted-foreground">
                    Helps us match you with the right homes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                {profile.company ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-bold">Verification Details</p>
                  <p className="text-xs text-muted-foreground">
                    Increases your chances of owners accepting your requests by 3x.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-3xl p-6 border border-border/60 shadow-sm text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-base mb-2">Ready to search?</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Your profile is automatically used to highlight the best matches when you browse.
            </p>
            <Button variant="outline" className="w-full rounded-xl h-10 border-border/80">
              Browse Homes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
