import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { IndianRupee, Users, Sparkles, Check, Info, ShieldCheck, Tag } from "lucide-react";
import type { StepProps, ListingFormData } from "../types";

export function Step3Pricing({ data, updateData }: StepProps) {
  const isSale = data.listing_type === "sale";
  const preferredTenants = [
    "Family",
    "Bachelors (Men)",
    "Bachelors (Women)",
    "Company Lease",
    "Any",
  ];
  const foodPreferences = ["Any (Non-Veg OK)", "Veg Only"];
  const ownershipOptions = [
    "Freehold",
    "Leasehold",
    "Power of Attorney",
    "Co-operative Society",
  ] as const;

  const toggleTenant = (tenant: string) => {
    const current = data.preferred_tenant || [];
    if (tenant === "Any") {
      updateData({ preferred_tenant: ["Any"] });
      return;
    }
    const filtered = current.filter((t: string) => t !== "Any");
    if (filtered.includes(tenant)) {
      updateData({ preferred_tenant: filtered.filter((t: string) => t !== tenant) });
    } else {
      updateData({ preferred_tenant: [...filtered, tenant] });
    }
  };

  const setDepositMultiplier = (multiplier: number) => {
    const rent = Number(data.price) || 0;
    updateData({ deposit: rent * multiplier });
  };

  const pricePerSqFt =
    data.area_sqft && data.price ? Math.round(Number(data.price) / Number(data.area_sqft)) : null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          {isSale ? "Sale Pricing & Ownership" : "Rental Pricing & Terms"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set transparent pricing with direct owner connection. Seedha Properties charges 0%
          brokerage.
        </p>
      </div>

      {/* 0% Brokerage Guarantee Callout */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500 text-white font-black text-sm">0%</div>
          <div>
            <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-300">
              Direct Owner Listing · Zero Brokerage
            </h3>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-400">
              No hidden fees, no broker commissions for you or the prospective{" "}
              {isSale ? "buyer" : "tenant"}.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full">
          Verified Direct
        </span>
      </div>

      {isSale ? (
        /* SALE PRICING SECTION */
        <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-7 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-foreground border-b border-border/40 pb-3">
            Expected Sale Price
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label htmlFor="sale_price" className="text-sm font-semibold text-foreground">
                Total Expected Price (₹) *
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="sale_price"
                  type="number"
                  placeholder="e.g. 7500000"
                  value={data.price || ""}
                  className="pl-10 h-11 rounded-xl bg-background border-border/80 text-base font-bold focus:ring-2 focus:ring-primary/20"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateData({ price: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                ₹{(data.price || 0).toLocaleString("en-IN")}
                {pricePerSqFt && (
                  <span className="ml-2 text-primary font-semibold">
                    (₹{pricePerSqFt.toLocaleString("en-IN")} / sq.ft.)
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-2.5">
              <Label className="text-sm font-semibold text-foreground">Ownership Status</Label>
              <select
                value={data.ownership_status || "Freehold"}
                onChange={(e) =>
                  updateData({
                    ownership_status: e.target.value as ListingFormData["ownership_status"],
                  })
                }
                className="h-11 w-full rounded-xl bg-background border border-border/80 px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20"
              >
                {ownershipOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={data.rent_negotiable || false}
                onChange={(e) => updateData({ rent_negotiable: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
              />
              <span>Price is negotiable</span>
            </label>
          </div>
        </div>
      ) : (
        /* RENT PRICING SECTION */
        <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-7 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-foreground border-b border-border/40 pb-3">
            Rent & Deposit
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label htmlFor="rent_price" className="text-sm font-semibold text-foreground">
                Expected Monthly Rent (₹) *
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="rent_price"
                  type="number"
                  placeholder="e.g. 35000"
                  value={data.price || ""}
                  className="pl-10 h-11 rounded-xl bg-background border-border/80 text-base font-bold focus:ring-2 focus:ring-primary/20"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateData({ price: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                ₹{(data.price || 0).toLocaleString("en-IN")} / month
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="deposit" className="text-sm font-semibold text-foreground">
                  Security Deposit (₹) *
                </Label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setDepositMultiplier(2)}
                    className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded hover:bg-primary/20 transition cursor-pointer"
                  >
                    2x Rent
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositMultiplier(3)}
                    className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded hover:bg-primary/20 transition cursor-pointer"
                  >
                    3x Rent
                  </button>
                </div>
              </div>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="deposit"
                  type="number"
                  placeholder="e.g. 70000"
                  value={data.deposit || ""}
                  className="pl-10 h-11 rounded-xl bg-background border-border/80 text-base font-bold focus:ring-2 focus:ring-primary/20"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateData({ deposit: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                ₹{(data.deposit || 0).toLocaleString("en-IN")} refundable deposit
              </p>
            </div>
          </div>

          {/* Maintenance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border/40">
            <div className="space-y-2.5">
              <Label htmlFor="maintenance" className="text-sm font-semibold text-foreground">
                Monthly Maintenance (₹)
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="maintenance"
                  type="number"
                  placeholder="e.g. 3000"
                  value={data.maintenance || ""}
                  className="pl-10 h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateData({ maintenance: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col justify-end space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={data.maintenance_included || false}
                  onChange={(e) => updateData({ maintenance_included: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                />
                <span>Maintenance is included in rent</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={data.rent_negotiable || false}
                  onChange={(e) => updateData({ rent_negotiable: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                />
                <span>Rent is negotiable</span>
              </label>
            </div>
          </div>

          {/* Tenant Preferences */}
          <div className="space-y-3 pt-3 border-t border-border/40">
            <Label className="text-sm font-semibold text-foreground">Preferred Tenant Type</Label>
            <div className="flex flex-wrap gap-2">
              {preferredTenants.map((tenant) => {
                const isSelected = (data.preferred_tenant || []).includes(tenant);
                return (
                  <button
                    key={tenant}
                    type="button"
                    onClick={() => toggleTenant(tenant)}
                    className={`px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border/80 bg-background text-foreground hover:bg-secondary"
                    }`}
                  >
                    {tenant}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Food Preference */}
          <div className="space-y-3 pt-2">
            <Label className="text-sm font-semibold text-foreground">Food Preference</Label>
            <div className="flex gap-3">
              {foodPreferences.map((food) => {
                const isSelected = (data.food_preference || "Any (Non-Veg OK)") === food;
                return (
                  <button
                    key={food}
                    type="button"
                    onClick={() => updateData({ food_preference: food })}
                    className={`flex-1 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border/80 bg-background text-foreground hover:bg-secondary"
                    }`}
                  >
                    {food}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
