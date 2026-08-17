import React from "react";
import { formatPrice } from "@/modules/property/services/propertyQueries";
import {
  CheckCircle,
  AlertTriangle,
  MapPin,
  Building2,
  IndianRupee,
  Sparkles,
  ShieldCheck,
  Image as ImageIcon,
} from "lucide-react";
import type { ListingFormData } from "../types";

export function Step6Review({ data }: { data: ListingFormData }) {
  const isComplete =
    data.city && (data.locality || data.address) && data.price > 0 && data.area_sqft > 0;

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 6 of 6</span>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Review & Submit Listing
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Review your property details before publishing for moderation. Verified listings go live
          in 2-4 hours.
        </p>
      </div>

      {!isComplete && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Important Information Missing</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Some key fields like Locality, Price, or Area are incomplete. You can still submit,
              but approval might take longer.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Property Details Card */}
        <div className="rounded-2xl border border-border/80 bg-secondary/20 p-5 space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm border-b border-border/60 pb-2.5">
            <Building2 className="h-4 w-4 text-primary" /> Property Details
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <p className="font-bold text-foreground mt-0.5">
                {data.property_type || "Apartment"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">BHK & Baths:</span>
              <p className="font-bold text-foreground mt-0.5">
                {data.bedrooms || 1} BHK, {data.bathrooms || 1} Bath
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Built-up Area:</span>
              <p className="font-bold text-foreground mt-0.5">{data.area_sqft || 0} Sq.Ft</p>
            </div>
            <div>
              <span className="text-muted-foreground">Furnishing:</span>
              <p className="font-bold text-foreground mt-0.5 capitalize">
                {String(data.furnishing_status || "unfurnished").replace("-", " ")}
              </p>
            </div>
          </div>
        </div>

        {/* Location Card */}
        <div className="rounded-2xl border border-border/80 bg-secondary/20 p-5 space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm border-b border-border/60 pb-2.5">
            <MapPin className="h-4 w-4 text-primary" /> Location & City
          </div>
          <div className="text-xs space-y-1.5">
            <div>
              <span className="text-muted-foreground">Locality:</span>
              <p className="font-bold text-foreground text-sm mt-0.5">
                {data.locality || "Locality not specified"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Address:</span>
              <p className="text-muted-foreground font-medium">
                {data.address || "Address pending"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">City:</span>
              <p className="text-foreground font-semibold">{data.city || "Hyderabad"}</p>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="rounded-2xl border border-border/80 bg-secondary/20 p-5 space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm border-b border-border/60 pb-2.5">
            <IndianRupee className="h-4 w-4 text-primary" /> Pricing & Deposit
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Monthly Rent:</span>
              <p className="font-bold text-primary text-sm mt-0.5">
                {formatPrice(data.price || 0, data.listing_type ?? "rent")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Security Deposit:</span>
              <p className="font-bold text-foreground text-sm mt-0.5">
                {formatPrice(data.deposit || 0, "sale")}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Maintenance:</span>
              <p className="font-medium text-foreground mt-0.5">
                {data.maintenance_included
                  ? "Included in Rent"
                  : formatPrice(data.maintenance || 0, "sale")}
              </p>
            </div>
          </div>
        </div>

        {/* Amenities & Photos Card */}
        <div className="rounded-2xl border border-border/80 bg-secondary/20 p-5 space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm border-b border-border/60 pb-2.5">
            <Sparkles className="h-4 w-4 text-primary" /> Amenities & Photos
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amenities Selected:</span>
              <span className="font-bold text-foreground">
                {(data.amenities || []).length} features
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Photos Attached:</span>
              <span className="font-bold text-foreground">{(data.images || []).length} photos</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Platform Brokerage:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ₹0 (Zero Fee)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Moderation Guarantee Notice */}
      <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20 rounded-2xl flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">
            Urban Properties Moderation Guarantee
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Your listing will be verified for genuine ownership and high quality imagery. Once
            approved, you'll receive direct tenant inquiries without intermediary interference.
          </p>
        </div>
      </div>
    </div>
  );
}
