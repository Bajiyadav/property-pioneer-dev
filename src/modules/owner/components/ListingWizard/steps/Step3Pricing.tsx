import React from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";

export function Step3Pricing({ data, updateData }: { data: any; updateData: (data: any) => void }) {
  const preferredTenants = ["Family", "Bachelors (Men)", "Bachelors (Women)", "Company Lease"];

  const toggleTenant = (tenant: string) => {
    const current = data.preferred_tenant || [];
    if (current.includes(tenant)) {
      updateData({ preferred_tenant: current.filter((t: string) => t !== tenant) });
    } else {
      updateData({ preferred_tenant: [...current, tenant] });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">Pricing & Preferences</h2>
        <p className="text-sm text-neutral-500">Set your expected rent and tenant preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="price">Expected Rent (₹ / month) *</Label>
            <Input
              id="price"
              type="number"
              placeholder="e.g. 25000"
              value={data.price || ""}
              onChange={(e) => updateData({ price: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit">Security Deposit (₹) *</Label>
            <Input
              id="deposit"
              type="number"
              placeholder="e.g. 50000"
              value={data.deposit || ""}
              onChange={(e) => updateData({ deposit: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="maintenance">Maintenance (₹ / month)</Label>
            <Input
              id="maintenance"
              type="number"
              placeholder="e.g. 2000"
              value={data.maintenance || ""}
              onChange={(e) => updateData({ maintenance: parseInt(e.target.value) || 0 })}
              disabled={data.maintenance_included}
            />
          </div>
          <div className="flex items-center space-x-2 pt-8">
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
              className="w-4 h-4 text-brand-600 rounded border-neutral-300 focus:ring-brand-500"
            />
            <Label htmlFor="maintenance_included" className="cursor-pointer">
              Maintenance included in rent
            </Label>
          </div>
        </div>

        <hr className="border-neutral-200" />

        <div className="space-y-3">
          <Label>Preferred Tenants</Label>
          <div className="flex flex-wrap gap-3">
            {preferredTenants.map((tenant) => {
              const isSelected = (data.preferred_tenant || []).includes(tenant);
              return (
                <button
                  key={tenant}
                  onClick={() => toggleTenant(tenant)}
                  className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors ${
                    isSelected
                      ? "bg-brand-50 border-brand-500 text-brand-700"
                      : "bg-white border-neutral-200 text-neutral-700 hover:border-brand-300 hover:bg-brand-50/50"
                  }`}
                >
                  {tenant}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Food Preference</Label>
          <div className="flex flex-wrap gap-3">
            {["Any", "Veg Only"].map((pref) => (
              <button
                key={pref}
                onClick={() => updateData({ food_preference: pref })}
                className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors ${
                  data.food_preference === pref
                    ? "bg-brand-50 border-brand-500 text-brand-700"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-brand-300 hover:bg-brand-50/50"
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
