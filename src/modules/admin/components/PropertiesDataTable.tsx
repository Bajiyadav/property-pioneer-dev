import React, { useState } from "react";
import { type Property } from "@/modules/property/services/propertyService";
import { formatPrice } from "@/modules/property/services/propertyQueries";
import { Eye, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { PropertyReviewModal } from "./PropertyReviewModal";
import { RejectPropertyDialog } from "./RejectPropertyDialog";
import { useAdminPropertyStore } from "@/modules/admin/stores/adminPropertyStore";

export function PropertiesDataTable({
  properties,
  title,
  showReviewActions = false,
}: {
  properties: Property[];
  title: string;
  showReviewActions?: boolean;
}) {
  const [reviewProperty, setReviewProperty] = useState<Property | null>(null);
  const [rejectProperty, setRejectProperty] = useState<Property | null>(null);

  const deleteProp = useAdminPropertyStore((s) => s.deleteProperty);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
        <div className="text-sm text-neutral-500">{properties.length} items</div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 text-neutral-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Property</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Date Added</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                    No properties found in this category.
                  </td>
                </tr>
              ) : (
                properties.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900 line-clamp-1">{p.title}</div>
                      <div className="text-neutral-500 text-xs mt-0.5">
                        {p.property_type} • {p.bedrooms} BHK
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-neutral-900">{p.locality || p.city}</div>
                      <div className="text-neutral-500 text-xs line-clamp-1">{p.address}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatPrice(p.price, p.listing_type ?? "rent")}
                    </td>
                    <td className="px-6 py-4 text-neutral-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          p.status === "available"
                            ? "bg-green-100 text-green-700"
                            : p.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : p.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {showReviewActions ? (
                          <>
                            <button
                              onClick={() => setReviewProperty(p)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Review"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRejectProperty(p)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
                              title="View/Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm("Are you sure you want to delete this property?")
                                ) {
                                  deleteProp(p.id);
                                }
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reviewProperty && (
        <PropertyReviewModal
          property={reviewProperty}
          onClose={() => setReviewProperty(null)}
          onReject={() => {
            setRejectProperty(reviewProperty);
            setReviewProperty(null);
          }}
        />
      )}

      {rejectProperty && (
        <RejectPropertyDialog property={rejectProperty} onClose={() => setRejectProperty(null)} />
      )}
    </div>
  );
}
