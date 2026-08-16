import React from "react";
import { type Property } from "@/modules/property/services/propertyService";
import { formatPrice } from "@/modules/property/services/propertyQueries";
import { X, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useAdminPropertyStore } from "@/shared/stores/adminPropertyStore";

export function PropertyReviewModal({
  property,
  onClose,
  onReject,
}: {
  property: Property;
  onClose: () => void;
  onReject: () => void;
}) {
  const approveProp = useAdminPropertyStore((s) => s.approveProperty);

  const handleApprove = () => {
    approveProp(property.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Review Listing</h2>
            <p className="text-sm text-neutral-500 mt-1">ID: {property.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-neutral-900 text-lg">{property.title}</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {property.images?.slice(0, 4).map((img, i) => (
                <div key={i} className="aspect-video bg-neutral-100 rounded-lg overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            <div className="bg-neutral-50 p-4 rounded-lg text-sm text-neutral-700 whitespace-pre-wrap">
              {property.description}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-medium text-neutral-900 border-b pb-2">Core Details</h4>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-neutral-500">Property Type</dt>
                <dd className="font-medium text-neutral-900">{property.property_type}</dd>

                <dt className="text-neutral-500">Configuration</dt>
                <dd className="font-medium text-neutral-900">
                  {property.bedrooms} BHK, {property.bathrooms} Bath
                </dd>

                <dt className="text-neutral-500">Area</dt>
                <dd className="font-medium text-neutral-900">{property.area_sqft} sq.ft.</dd>

                <dt className="text-neutral-500">Furnishing</dt>
                <dd className="font-medium text-neutral-900 capitalize">
                  {property.furnishing_status?.replace("-", " ")}
                </dd>

                <dt className="text-neutral-500">Address</dt>
                <dd className="font-medium text-neutral-900">
                  {property.address}, {property.locality}, {property.city}
                </dd>
              </dl>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-neutral-900 border-b pb-2">Pricing & Preferences</h4>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-neutral-500">Expected Rent</dt>
                <dd className="font-medium text-brand-700">{formatPrice(property.price)}/mo</dd>

                <dt className="text-neutral-500">Deposit</dt>
                <dd className="font-medium text-neutral-900">
                  {formatPrice(property.deposit || 0)}
                </dd>

                <dt className="text-neutral-500">Maintenance</dt>
                <dd className="font-medium text-neutral-900">
                  {property.maintenance_included
                    ? "Included"
                    : formatPrice(property.maintenance || 0)}
                </dd>

                <dt className="text-neutral-500">Preferred Tenants</dt>
                <dd className="font-medium text-neutral-900">
                  {property.preferred_tenant?.join(", ") || "Any"}
                </dd>
              </dl>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-neutral-900 border-b pb-2">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {property.amenities?.map((a) => (
                <span
                  key={a}
                  className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium"
                >
                  {a}
                </span>
              ))}
              {(!property.amenities || property.amenities.length === 0) && (
                <span className="text-neutral-500 text-sm italic">No amenities listed.</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={onReject}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject Listing
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve Listing
          </Button>
        </div>
      </div>
    </div>
  );
}
