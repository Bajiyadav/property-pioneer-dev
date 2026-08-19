import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Phone,
  ShieldCheck,
  User,
  Mail,
  Building,
  Briefcase,
  Calendar,
  MapPin,
  Clock,
  Home,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { LocationSelector } from "@/shared/components/listing/LocationSelector";
import type { TenantProfile } from "../types";
import { saveTenantProfile } from "../services/tenantFunctions";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/modules/authentication/context/AuthContext";

const BHK_OPTIONS = ["1 RK", "1 BHK", "2 BHK", "3 BHK", "4+ BHK"];
const FURNISHING_OPTIONS = [
  { value: "fully-furnished", label: "Fully Furnished" },
  { value: "semi-furnished", label: "Semi Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
  { value: "any", label: "Any" },
] as const;

const POPULAR_AMENITIES = [
  "Lift",
  "Power Backup",
  "Security",
  "Reserved Parking",
  "Gym",
  "Swimming Pool",
  "Club House",
  "Gated Society",
  "Gas Pipeline",
  "High Speed Internet",
];

export function TenantSignUpFlow({
  initialData,
  onComplete,
}: {
  initialData?: Partial<TenantProfile>;
  onComplete?: (profile: TenantProfile) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const saveProfileFn = useServerFn(saveTenantProfile);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [formData, setFormData] = useState<TenantProfile>({
    phone_number: initialData?.phone_number || "9876543210",
    full_name: initialData?.full_name || user?.user_metadata?.full_name || "",
    email: initialData?.email || user?.email || "",
    company_name: initialData?.company_name || "",
    profession: initialData?.profession || "Software Engineer",
    annual_salary_min: initialData?.annual_salary_min || 800000,
    annual_salary_max: initialData?.annual_salary_max || 1800000,
    budget_min: initialData?.budget_min || 15000,
    budget_max: initialData?.budget_max || 35000,
    preferred_bhk: initialData?.preferred_bhk || ["2 BHK", "3 BHK"],
    move_in_date:
      initialData?.move_in_date || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
    is_vegetarian: initialData?.is_vegetarian ?? false,
    pets_allowed: initialData?.pets_allowed ?? false,
    preferred_furnishing: initialData?.preferred_furnishing || "semi-furnished",
    preferred_building_type: initialData?.preferred_building_type || "Apartment",
    special_amenities: initialData?.special_amenities || ["Lift", "Power Backup", "Security"],
    primary_city: initialData?.primary_city || "Hyderabad",
    primary_locality: initialData?.primary_locality || "Madhapur",
    secondary_cities: initialData?.secondary_cities || ["Bengaluru"],
    office_name: initialData?.office_name || "HITEC City Phase 2",
    max_commute_minutes: initialData?.max_commute_minutes || 30,
    profile_completeness: 85,
  });

  const updateForm = (data: Partial<TenantProfile>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Step 1: Phone OTP Handlers
  const handleSendOtp = () => {
    if (!/^[6-9]\d{9}$/.test(formData.phone_number.replace(/\D/g, ""))) {
      toast.error("Please enter a valid 10-digit Indian phone number.");
      return;
    }
    setOtpSent(true);
    setOtpCode("123456"); // Demo pre-fill for seamless user testing
    toast.success("OTP sent to " + formData.phone_number, {
      description: "Use demo code 123456 to verify.",
    });
  };

  const handleVerifyOtp = () => {
    if (otpCode.trim() !== "123456" && otpCode.trim().length !== 6) {
      toast.error("Invalid verification code. Please enter 123456.");
      return;
    }
    setPhoneVerified(true);
    toast.success("Phone number verified successfully!");
    setStep(2);
  };

  // Step 2: Basic Profile Validation
  const handleStep2Next = () => {
    if (!formData.full_name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setStep(3);
  };

  // Step 3: Location Preferences Validation (MANDATORY)
  const handleStep3Next = () => {
    if (!formData.primary_city.trim()) {
      toast.error("Primary city is mandatory.");
      return;
    }
    if (!formData.primary_locality.trim()) {
      toast.error("Primary locality is mandatory.");
      return;
    }
    setStep(4);
  };

  // Step 4: Final Submission
  const handleCompleteRegistration = async () => {
    setIsLoading(true);
    try {
      // Save locally to localStorage so it works immediately across app
      localStorage.setItem("sp_tenant_profile", JSON.stringify(formData));

      // Attempt server save
      try {
        await saveProfileFn({ data: formData });
      } catch (e) {
        console.warn("Server profile save note:", e);
      }

      toast.success("🎉 Tenant Profile Completed!", {
        description: `Finding verified 0% brokerage properties in ${formData.primary_locality}, ${formData.primary_city}...`,
      });

      if (onComplete) {
        onComplete(formData);
      } else {
        navigate({
          to: "/tenant/matches",
          search: {
            city: formData.primary_city,
            locality: formData.primary_locality,
            budget_min: formData.budget_min,
            budget_max: formData.budget_max,
          },
        });
      }
    } catch (err) {
      toast.error("Failed to complete profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Step Indicator Header */}
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
          <Sparkles className="h-3.5 w-3.5" /> Tenant Match Profile · Step {step} of 4
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2">
          {step === 1 && "Verify Your Mobile Number"}
          {step === 2 && "Tell Us About Yourself"}
          {step === 3 && "Where Do You Want to Rent?"}
          {step === 4 && "Fine-Tune Your Rental Preferences"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {step === 1 &&
            "Direct owner connect requires a verified phone number for WhatsApp and visit scheduling."}
          {step === 2 && "Professional details help owners pre-approve your visit faster."}
          {step === 3 &&
            "Mandatory location setup helps our AI match properties with accurate commute times."}
          {step === 4 &&
            "Set your exact budget, BHK layouts, and amenities for tailored recommendations."}
        </p>

        {/* Visual Progress Line */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary mt-6">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0F766E] to-[#0D9488] transition-all duration-300 shadow-xs"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Form Box */}
      <div className="bg-card rounded-3xl border border-border/80 p-6 sm:p-10 shadow-xl backdrop-blur-sm">
        {/* ================= PAGE 1: PHONE & OTP ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Mobile Number *</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground font-bold text-sm">
                  +91
                </div>
                <Input
                  type="tel"
                  maxLength={10}
                  value={formData.phone_number}
                  onChange={(e) => updateForm({ phone_number: e.target.value.replace(/\D/g, "") })}
                  placeholder="98765 43210"
                  className="pl-14 text-base font-semibold"
                />
              </div>
            </div>

            {!otpSent ? (
              <Button
                type="button"
                onClick={handleSendOtp}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-md hover:bg-primary/90"
              >
                Send Verification OTP <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Enter 6-Digit OTP *
                  </Label>
                  <Input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="text-center tracking-widest text-lg font-mono font-bold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Demo OTP is <strong className="text-primary font-bold">123456</strong>
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOtpSent(false)}
                    className="flex-1"
                  >
                    Change Number
                  </Button>
                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Verify & Continue <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= PAGE 2: BASIC PROFILE ================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => updateForm({ full_name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                    placeholder="rahul.sharma@example.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Current Company *</Label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => updateForm({ company_name: e.target.value })}
                    placeholder="e.g. Google / Microsoft / Startup"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Profession *</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={formData.profession}
                    onChange={(e) => updateForm({ profession: e.target.value })}
                    placeholder="e.g. Software Engineer / Consultant"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Annual Salary (CTC)</Label>
                <Input
                  type="text"
                  value={
                    formData.annual_salary_max
                      ? `₹${(formData.annual_salary_max / 100000).toFixed(1)} Lakhs/yr`
                      : "₹12 Lakhs/yr"
                  }
                  onChange={(e) => {
                    const num = parseInt(e.target.value.replace(/\D/g, ""), 10);
                    if (!isNaN(num)) updateForm({ annual_salary_max: num });
                  }}
                  placeholder="e.g. ₹15,00,000"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Expected Move-in Date *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={formData.move_in_date}
                    onChange={(e) => updateForm({ move_in_date: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                type="button"
                onClick={handleStep2Next}
                className="bg-primary text-primary-foreground font-bold"
              >
                Continue to Location <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================= PAGE 3: MANDATORY LOCATION ================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-700/50 p-3.5 text-xs text-emerald-900 dark:text-emerald-200">
              <strong>Mandatory Location:</strong> All listings and match scores are strictly
              computed against your primary city and locality.
            </div>

            {/* Location Selector Component */}
            <LocationSelector
              selectedCity={formData.primary_city}
              selectedLocality={formData.primary_locality}
              onCityChange={(city) => updateForm({ primary_city: city })}
              onLocalityChange={(locality) => updateForm({ primary_locality: locality })}
            />

            {/* Commute Preferences */}
            <div className="space-y-4 pt-4 border-t border-border/60">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Daily Office Commute Preferences
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Office / Tech Park Name
                  </Label>
                  <Input
                    type="text"
                    value={formData.office_name}
                    onChange={(e) => updateForm({ office_name: e.target.value })}
                    placeholder="e.g. HITEC City / DLF Cyber City / EGL"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Max Commute Time
                  </Label>
                  <select
                    value={formData.max_commute_minutes}
                    onChange={(e) =>
                      updateForm({ max_commute_minutes: parseInt(e.target.value, 10) })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium"
                  >
                    <option value={15}>Under 15 minutes</option>
                    <option value={30}>Under 30 minutes</option>
                    <option value={45}>Under 45 minutes</option>
                    <option value={60}>Under 60 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                type="button"
                onClick={handleStep3Next}
                className="bg-primary text-primary-foreground font-bold"
              >
                Continue to Preferences <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================= PAGE 4: PREFERENCES & BUDGET ================= */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Preferred BHK Multi-Select */}
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold text-foreground">
                Preferred BHK Layouts *
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {BHK_OPTIONS.map((bhk) => {
                  const isSelected = formData.preferred_bhk.includes(bhk);
                  return (
                    <button
                      key={bhk}
                      type="button"
                      onClick={() => {
                        const next = isSelected
                          ? formData.preferred_bhk.filter((b) => b !== bhk)
                          : [...formData.preferred_bhk, bhk];
                        updateForm({ preferred_bhk: next.length > 0 ? next : [bhk] });
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                          : "bg-background border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {bhk}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monthly Budget Range */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold text-foreground">
                  Monthly Rent Budget *
                </Label>
                <span className="text-xs font-extrabold text-primary">
                  ₹{formData.budget_min.toLocaleString("en-IN")} – ₹
                  {formData.budget_max.toLocaleString("en-IN")}/mo
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Min Rent (₹)</Label>
                  <Input
                    type="number"
                    step={1000}
                    value={formData.budget_min}
                    onChange={(e) =>
                      updateForm({ budget_min: parseInt(e.target.value, 10) || 5000 })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max Rent (₹)</Label>
                  <Input
                    type="number"
                    step={1000}
                    value={formData.budget_max}
                    onChange={(e) =>
                      updateForm({ budget_max: parseInt(e.target.value, 10) || 50000 })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Furnishing Preference */}
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold text-foreground">Furnishing Status</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {FURNISHING_OPTIONS.map((f) => {
                  const isSelected = formData.preferred_furnishing === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => updateForm({ preferred_furnishing: f.value })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vegetarian & Pets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-background">
                <div>
                  <p className="text-xs font-bold text-foreground">Vegetarian Only Preference</p>
                  <p className="text-[11px] text-muted-foreground">Strict veg landlord matching</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_vegetarian}
                  onChange={(e) => updateForm({ is_vegetarian: e.target.checked })}
                  className="h-5 w-5 rounded accent-teal-600"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-background">
                <div>
                  <p className="text-xs font-bold text-foreground">Pet Friendly Homes</p>
                  <p className="text-[11px] text-muted-foreground">Allows dogs/cats</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.pets_allowed}
                  onChange={(e) => updateForm({ pets_allowed: e.target.checked })}
                  className="h-5 w-5 rounded accent-teal-600"
                />
              </div>
            </div>

            {/* Amenities Checklist */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                Must-Have Amenities
              </Label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_AMENITIES.map((amenity) => {
                  const isChecked = formData.special_amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => {
                        const next = isChecked
                          ? formData.special_amenities.filter((a) => a !== amenity)
                          : [...formData.special_amenities, amenity];
                        updateForm({ special_amenities: next });
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        isChecked
                          ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                          : "bg-background border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isChecked ? `✓ ${amenity}` : `+ ${amenity}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                type="button"
                disabled={isLoading}
                onClick={handleCompleteRegistration}
                className="bg-gradient-to-r from-[#0F766E] to-[#115E59] text-white font-extrabold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
              >
                {isLoading ? "Matching Properties..." : "Complete Profile & View Matches 🚀"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
