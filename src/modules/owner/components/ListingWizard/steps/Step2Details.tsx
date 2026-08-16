import React from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";

export function Step2Details({ data, updateData }: { data: any; updateData: (data: any) => void }) {
  const propertyTypes = ["Apartment", "Independent House", "Villa", "Gated Society", "Studio"];
  const bBhkTypes = [1, 2, 3, 4];
  const furnishingTypes = [
    { value: "fully-furnished", label: "Fully Furnished" },
    { value: "semi-furnished", label: "Semi Furnished" },
    { value: "unfurnished", label: "Unfurnished" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">Tell us about your property</h2>
        <p className="text-sm text-neutral-500">
          Provide basic details about the space to attract the right tenants.
        </p>
      </div>

      <div className="space-y-6">
        {/* Property Type */}
        <div className="space-y-3">
          <Label>Property Type *</Label>
          <div className="flex flex-wrap gap-3">
            {propertyTypes.map((type) => (
              <button
                key={type}
                onClick={() => updateData({ property_type: type })}
                className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors ${
                  data.property_type === type
                    ? "bg-brand-50 border-brand-500 text-brand-700"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-brand-300 hover:bg-brand-50/50"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>BHK Type *</Label>
            <div className="flex flex-wrap gap-2">
              {bBhkTypes.map((bhk) => (
                <button
                  key={bhk}
                  onClick={() => updateData({ bedrooms: bhk })}
                  className={`w-12 h-10 flex items-center justify-center text-sm font-medium border rounded-md transition-colors ${
                    data.bedrooms === bhk
                      ? "bg-brand-50 border-brand-500 text-brand-700"
                      : "bg-white border-neutral-200 text-neutral-700 hover:border-brand-300"
                  }`}
                >
                  {bhk}
                </button>
              ))}
              <button
                onClick={() => updateData({ bedrooms: 5 })}
                className={`px-3 h-10 flex items-center justify-center text-sm font-medium border rounded-md transition-colors ${
                  data.bedrooms >= 5
                    ? "bg-brand-50 border-brand-500 text-brand-700"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-brand-300"
                }`}
              >
                5+
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Bathrooms *</Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((bath) => (
                <button
                  key={bath}
                  onClick={() => updateData({ bathrooms: bath })}
                  className={`w-12 h-10 flex items-center justify-center text-sm font-medium border rounded-md transition-colors ${
                    data.bathrooms === bath
                      ? "bg-brand-50 border-brand-500 text-brand-700"
                      : "bg-white border-neutral-200 text-neutral-700 hover:border-brand-300"
                  }`}
                >
                  {bath}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="area">Built-up Area (Sq.Ft) *</Label>
            <Input
              id="area"
              type="number"
              placeholder="e.g. 1200"
              value={data.area_sqft || ""}
              onChange={(e) => updateData({ area_sqft: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="floor">Floor *</Label>
            <select
              id="floor"
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={data.floor_number}
              onChange={(e) => updateData({ floor_number: e.target.value })}
            >
              <option value="Ground">Ground</option>
              <option value="1-3">1 to 3</option>
              <option value="4-6">4 to 6</option>
              <option value="7-9">7 to 9</option>
              <option value="10+">10+</option>
            </select>
          </div>
        </div>

        {/* Furnishing */}
        <div className="space-y-3">
          <Label>Furnishing Status *</Label>
          <div className="flex flex-wrap gap-3">
            {furnishingTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => updateData({ furnishing_status: type.value })}
                className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors ${
                  data.furnishing_status === type.value
                    ? "bg-brand-50 border-brand-500 text-brand-700"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-brand-300 hover:bg-brand-50/50"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
