import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAdminProperties, updateAdminProperty } from "@/modules/admin/services/adminFunctions";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  MapPin,
  Phone,
  User,
  Image as ImageIcon,
  Check,
  ExternalLink,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  component: ModerationQueue,
});

interface PropertyRecord {
  id: string;
  title: string;
  description?: string | null;
  city: string;
  locality?: string | null;
  address?: string | null;
  region?: string | null;
  property_type?: string | null;
  listing_type: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqft?: number | null;
  status: string;
  price: number;
  images?: string[] | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  owner_verification_status?: string | null;
  property_verification_status?: string | null;
  verification_notes?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
}

const CHECKLIST_ITEMS = [
  { id: "owner", label: "Owner identity & phone format verified" },
  { id: "ownership", label: "Direct owner declaration & 0% brokerage compliance checked" },
  { id: "details", label: "Property specifications (BHK, baths, area) reviewed" },
  { id: "location", label: "City & locality validated with privacy protection" },
  { id: "photos", label: "Real property photos reviewed (no stock/watermark violations)" },
  { id: "duplicates", label: "No obvious duplicate listing in the same locality" },
  { id: "pricing", label: "Transparent rent/price with no hidden charges" },
  { id: "policy", label: "Listing complies with Seedha marketplace guidelines" },
];

function ModerationQueue() {
  const fetchGetAdminProperties = useServerFn(getAdminProperties);
  const {
    data: properties = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin", "properties"],
    queryFn: () => fetchGetAdminProperties({}),
  });

  const [selectedProperty, setSelectedProperty] = useState<PropertyRecord | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const mutation = useMutation({
    mutationFn: (args: {
      id: string;
      is_approved?: boolean;
      is_featured?: boolean;
      status?: "available" | "rented" | "sold" | "rejected" | "pending" | "draft";
      verification_status?: "pending" | "verified" | "rejected";
      verification_notes?: string;
      video_status?: "pending" | "approved" | "rejected";
      verified_at?: string;
      verified_by?: string;
    }) => updateAdminProperty({ data: args }),
    onSuccess: () => {
      refetch();
      setSelectedProperty(null);
      setRejectModalOpen(false);
      setRejectReason("");
      setCheckedItems({});
    },
  });

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApprove = (prop: PropertyRecord) => {
    mutation.mutate({
      id: prop.id,
      is_approved: true,
      status: "available",
      verification_status: "verified",
      verified_at: new Date().toISOString(),
    });
    toast.success(`Listing approved and published with Verified Badge!`);
  };

  const handleReject = () => {
    if (!selectedProperty) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejecting this listing.");
      return;
    }
    mutation.mutate({
      id: selectedProperty.id,
      is_approved: false,
      status: "rejected",
      verification_status: "rejected",
      verification_notes: rejectReason.trim(),
    });
    toast.info(`Listing marked as rejected with feedback sent to owner.`);
  };

  const propertyList = (properties as unknown as PropertyRecord[]) || [];
  const filteredProperties = propertyList.filter((p) => {
    if (filter === "pending") return !p.is_approved && p.status !== "rejected";
    if (filter === "approved") return p.is_approved;
    if (filter === "rejected")
      return p.status === "rejected" || p.property_verification_status === "rejected";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            <span>Listing Verification & Moderation Queue</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Review owner property submissions against Seedha trust and 0% brokerage standards before
            publishing.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-xl border border-neutral-800 self-start">
          {[
            { id: "all", label: "All Listings" },
            { id: "pending", label: "Under Review" },
            { id: "approved", label: "Approved" },
            { id: "rejected", label: "Rejected" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as "all" | "pending" | "approved" | "rejected")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === f.id
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-neutral-950/60 text-neutral-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-semibold">Property & Locality</th>
              <th className="px-6 py-4 font-semibold">Owner Info</th>
              <th className="px-6 py-4 font-semibold">Type & Rent/Price</th>
              <th className="px-6 py-4 font-semibold">Photos</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                  Loading listings queue...
                </td>
              </tr>
            ) : filteredProperties.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                  No property listings found in this queue.
                </td>
              </tr>
            ) : (
              filteredProperties.map((p) => {
                const photosCount = (p.images || []).length;
                const isVerified = p.is_approved;
                const isRejected =
                  p.status === "rejected" || p.property_verification_status === "rejected";

                return (
                  <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-base">{p.title}</div>
                      <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {p.locality || p.region || "Area"}, {p.city}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-white">
                        {p.owner_name || "Direct Owner"}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-neutral-500" />
                        <span>{p.owner_phone || "Not specified"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-emerald-400 text-sm">
                        ₹{(p.price || 0).toLocaleString("en-IN")}
                        <span className="text-xs text-neutral-400 font-normal">
                          {p.listing_type === "sale" ? "" : " / mo"}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 capitalize mt-0.5">
                        {p.property_type || "Property"} · For {p.listing_type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center gap-1.5 w-fit">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                        {photosCount} photo(s)
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isVerified ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : isRejected ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" />
                          Under Review
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProperty(p);
                            setCheckedItems({});
                          }}
                          className="text-xs border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Review</span>
                        </Button>

                        {!isVerified && (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(p)}
                            disabled={mutation.isPending}
                            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Verification & Inspection Modal */}
      {selectedProperty && (
        <Dialog
          open={!!selectedProperty}
          onOpenChange={(open) => !open && setSelectedProperty(null)}
        >
          <DialogContent className="max-w-3xl bg-neutral-900 border-neutral-800 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  Direct Owner Review
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  ID: {selectedProperty.id.slice(0, 8)}...
                </span>
              </div>
              <DialogTitle className="text-xl font-bold text-white mt-2">
                {selectedProperty.title}
              </DialogTitle>
              <DialogDescription className="text-neutral-400 text-xs">
                Review property specifications, real photos, owner details, and check against
                moderation criteria.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-3">
              {/* Specs & Pricing Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 text-xs">
                <div>
                  <span className="text-neutral-500 block">Locality</span>
                  <span className="font-bold text-white mt-0.5 block truncate">
                    {selectedProperty.locality || "N/A"}, {selectedProperty.city}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Price / Rent</span>
                  <span className="font-bold text-emerald-400 mt-0.5 block">
                    ₹{(selectedProperty.price || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Type & BHK</span>
                  <span className="font-bold text-white mt-0.5 block">
                    {selectedProperty.bedrooms || 2} BHK{" "}
                    {selectedProperty.property_type || "Apartment"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Built-up Area</span>
                  <span className="font-bold text-white mt-0.5 block">
                    {selectedProperty.area_sqft || 0} sq.ft.
                  </span>
                </div>
              </div>

              {/* Owner Info */}
              <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 space-y-2 text-xs">
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-400" /> Owner Contact
                </h4>
                <div className="grid grid-cols-2 gap-3 text-neutral-300">
                  <div>
                    <span className="text-neutral-500">Name:</span>{" "}
                    {selectedProperty.owner_name || "Direct Owner"}
                  </div>
                  <div>
                    <span className="text-neutral-500">Phone:</span>{" "}
                    {selectedProperty.owner_phone || "Not specified"}
                  </div>
                  {selectedProperty.address && (
                    <div className="col-span-2">
                      <span className="text-neutral-500">Address:</span> {selectedProperty.address}
                    </div>
                  )}
                </div>
              </div>

              {/* Photos Gallery Preview */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    Real Storage Photos ({(selectedProperty.images || []).length})
                  </span>
                </h4>
                {(selectedProperty.images || []).length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {selectedProperty.images?.map((url, i) => (
                      <a
                        key={url + i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative rounded-lg overflow-hidden border border-neutral-700 aspect-4/3 bg-neutral-950 block"
                      >
                        <img
                          src={url}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
                    ⚠️ No property photos attached to this listing.
                  </div>
                )}
              </div>

              {/* 8-Point Verification Checklist */}
              <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center justify-between">
                  <span>Verification Checklist</span>
                  <span className="text-xs text-emerald-400 font-normal">
                    {Object.values(checkedItems).filter(Boolean).length} / {CHECKLIST_ITEMS.length}{" "}
                    Checked
                  </span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {CHECKLIST_ITEMS.map((item) => {
                    const isChecked = !!checkedItems[item.id];
                    return (
                      <label
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border transition cursor-pointer ${
                          isChecked
                            ? "border-emerald-500/40 bg-emerald-500/10 text-white"
                            : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500/20"
                        />
                        <span className="truncate">{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setRejectModalOpen(true)}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Listing</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProperty(null)}
                    className="border-neutral-700 text-neutral-300 rounded-xl text-xs"
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(selectedProperty)}
                    disabled={mutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs gap-1.5 px-4"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Publish</span>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>Reject Listing Submission</span>
            </DialogTitle>
            <DialogDescription className="text-neutral-400 text-xs">
              Provide feedback for the owner explaining why this listing could not be approved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap gap-1.5">
              {[
                "Missing real property photos",
                "Incorrect pricing or hidden charges",
                "Invalid location/locality details",
                "Duplicate listing detected",
                "Direct owner authorization required",
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className="text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1 rounded-md border border-neutral-700 cursor-pointer"
                >
                  {reason}
                </button>
              ))}
            </div>

            <Textarea
              rows={3}
              placeholder="Enter detailed feedback for owner..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="bg-neutral-950 border-neutral-800 text-white text-xs rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
              className="border-neutral-700 text-neutral-300 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={mutation.isPending}
              className="text-xs font-bold rounded-xl"
            >
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
