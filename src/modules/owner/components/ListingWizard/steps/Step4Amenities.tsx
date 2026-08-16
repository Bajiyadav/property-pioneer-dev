import React from "react";
import { Label } from "@/shared/components/ui/label";

export function Step4Amenities({
  data,
  updateData,
}: {
  data: any;
  updateData: (data: any) => void;
}) {
  const commonAmenities = [
    "Lift",
    "Air Conditioner",
    "Intercom",
    "Internet / Wi-Fi",
    "RO Water System",
    "Piped Gas",
    "Power Backup",
    "Security",
    "Park",
    "Gymnasium",
    "Swimming Pool",
    "Club House",
    "Reserved Parking",
    "Visitor Parking",
    "Vastu Compliant",
  ];

  const toggleAmenity = (amenity: string) => {
    const current = data.amenities || [];
    if (current.includes(amenity)) {
      updateData({ amenities: current.filter((a: string) => a !== amenity) });
    } else {
      updateData({ amenities: [...current, amenity] });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">Amenities & Features</h2>
        <p className="text-sm text-neutral-500">
          Properties with more amenities rent out 2x faster.
        </p>
      </div>

      <div className="space-y-4">
        <Label>Select all that apply</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {commonAmenities.map((amenity) => {
            const isSelected = (data.amenities || []).includes(amenity);
            return (
              <label
                key={amenity}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-brand-50 border-brand-500"
                    : "bg-white border-neutral-200 hover:border-brand-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleAmenity(amenity)}
                  className="w-4 h-4 text-brand-600 rounded border-neutral-300 focus:ring-brand-500 mr-3"
                />
                <span
                  className={`text-sm font-medium ${isSelected ? "text-brand-900" : "text-neutral-700"}`}
                >
                  {amenity}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
