import React from "react";
import { formatPrice } from "@/modules/property/services/propertyQueries";
import { CheckCircle, AlertTriangle } from "lucide-react";

export function Step6Review({ data }: { data: any }) {
  // A simple validation to see if core fields are filled
  const isComplete = data.city && data.address && data.price > 0 && data.area_sqft > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">Review & Submit</h2>
        <p className="text-sm text-neutral-500">
          Check your details before submitting for moderation.
        </p>
      </div>

      {!isComplete && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-900">Missing Information</h4>
            <p className="text-sm text-amber-700 mt-1">
              Some important fields like City, Address, Price, or Area are missing. You can still
              submit, but approval might be delayed.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
              Property Details
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-neutral-500">Property Type:</span>
                <span className="font-medium text-neutral-900">{data.property_type}</span>

                <span className="text-neutral-500">Configuration:</span>
                <span className="font-medium text-neutral-900">
                  {data.bedrooms} BHK, {data.bathrooms} Bath
                </span>

                <span className="text-neutral-500">Built-up Area:</span>
                <span className="font-medium text-neutral-900">{data.area_sqft} sq.ft.</span>

                <span className="text-neutral-500">Furnishing:</span>
                <span className="font-medium text-neutral-900 capitalize">
                  {data.furnishing_status?.replace("-", " ")}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
              Location
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div className="text-sm space-y-1">
                <p className="font-medium text-neutral-900">
                  {data.locality || "Locality not set"}
                </p>
                <p className="text-neutral-600">{data.address || "Address not set"}</p>
                <p className="text-neutral-600">{data.city || "City not set"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
              Pricing
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-neutral-500">Expected Rent:</span>
                <span className="font-medium text-neutral-900">
                  {formatPrice(data.price || 0)}/mo
                </span>

                <span className="text-neutral-500">Deposit:</span>
                <span className="font-medium text-neutral-900">
                  {formatPrice(data.deposit || 0)}
                </span>

                <span className="text-neutral-500">Maintenance:</span>
                <span className="font-medium text-neutral-900">
                  {data.maintenance_included ? "Included" : formatPrice(data.maintenance || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-brand-50 border border-brand-100 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-brand-900">What happens next?</h4>
              <p className="text-sm text-brand-700 mt-1">
                Once you submit, our team will review the details. Verified listings go live within
                2-4 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
