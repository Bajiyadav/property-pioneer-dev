import React from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { IndianRupee, Users, Sparkles, Check, Info } from "lucide-react";
import type { StepProps } from "../types";

export function Step3Pricing({ data, updateData }: StepProps) {
  const preferredTenants = [
    "Family",
    "Bachelors (Men)",
    "Bachelors (Women)",
    "Company Lease",
    "Any",
  ];
  const foodPreferences = ["Any (Non-Veg OK)", "Veg Only"];

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

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 3 of 6</span>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
          <IndianRupee className="h-6 w-6 text-primary" /> Pricing & Preferences
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Set transparent pricing with no hidden charges. Urban Properties charges zero platform
          fee.
        </p>
      </div>

      <div className="space-y-7">
        {/* Pricing Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <Label htmlFor="price" className="text-sm font-semibold text-foreground">
              Expected Monthly Rent (₹) *
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="price"
                type="number"
                placeholder="e.g. 25000"
                value={data.price || ""}
                className="pl-10 h-11 rounded-xl bg-background border-border/80 text-base font-bold focus:ring-2 focus:ring-primary/20"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateData({ price: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              ₹{(data.price || 0).toLocaleString("en-IN")}/month
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
                placeholder="e.g. 50000"
                value={data.deposit || ""}
                className="pl-10 h-11 rounded-xl bg-background border-border/80 text-base font-bold focus:ring-2 focus:ring-primary/20"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateData({ deposit: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              ₹{(data.deposit || 0).toLocaleString("en-IN")} refundable deposit
            </p>
          </div>
        </div>

        {/* Maintenance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-secondary/30 rounded-2xl border border-border/60">
          <div className="space-y-2.5">
            <Label htmlFor="maintenance" className="text-sm font-semibold text-foreground">
              Monthly Maintenance (₹)
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="maintenance"
                type="number"
                placeholder="e.g. 2500"
                value={data.maintenance || ""}
                disabled={data.maintenance_included}
                className="pl-10 h-11 rounded-xl bg-background border-border/80 text-sm font-medium focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateData({ maintenance: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-6 sm:pt-7">
            <input
              type="checkbox"
              id="maintenance_included"
              checked={data.maintenance_included || false}
              onChange={(e) =>
                updateData({
                  maintenance_included: e.target.checked,
                  maintenance: e.target.checked ? 0 : data.maintenance,
                })
              }
              className="w-5 h-5 text-primary rounded border-border focus:ring-primary/20 cursor-pointer"
            />
            <Label
              htmlFor="maintenance_included"
              className="cursor-pointer text-sm font-medium text-foreground"
            >
              Maintenance is already included in rent
            </Label>
          </div>
        </div>

        {/* Preferred Tenants */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" /> Preferred Tenants
          </Label>
          <div className="flex flex-wrap gap-2.5">
            {preferredTenants.map((tenant) => {
              const isSelected = (data.preferred_tenant || []).includes(tenant);
              return (
                <button
                  key={tenant}
                  type="button"
                  onClick={() => toggleTenant(tenant)}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold border rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                      : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {tenant}
                </button>
              );
            })}
          </div>
        </div>

        {/* Food Preference */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">Food Preference</Label>
          <div className="flex flex-wrap gap-2.5">
            {foodPreferences.map((pref) => {
              const isSelected = data.food_preference === pref;
              return (
                <button
                  key={pref}
                  type="button"
                  onClick={() => updateData({ food_preference: pref })}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold border rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                      : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {pref}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
