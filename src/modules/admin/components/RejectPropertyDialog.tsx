import React, { useState } from "react";
import { type Property } from "@/modules/property/services/propertyService";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPropertyStore } from "@/modules/admin/stores/adminPropertyStore";

export function RejectPropertyDialog({
  property,
  onClose,
}: {
  property: Property;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const rejectProp = useAdminPropertyStore((s) => s.rejectProperty);

  const handleReject = () => {
    if (!reason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    rejectProp(property.id, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-neutral-100 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 pt-1">
            <h2 className="text-lg font-bold text-neutral-900">Reject Property Listing</h2>
            <p className="text-sm text-neutral-500 mt-1">
              You are about to reject the listing <strong>"{property.title}"</strong>.
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-md -mt-1 -mr-1">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-900">Reason for Rejection *</label>
            <Textarea
              placeholder="e.g. Inappropriate images, duplicate listing, suspicious pricing..."
              className="h-32 resize-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-neutral-500">This reason will be logged in the system.</p>
          </div>
        </div>

        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleReject}
            disabled={!reason.trim()}
          >
            Confirm Rejection
          </Button>
        </div>
      </div>
    </div>
  );
}
