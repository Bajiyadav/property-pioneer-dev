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
  Calendar,
  Clock,
  Shield,
  FileCheck2,
} from "lucide-react";
import type { ListingFormData } from "../types";

export function Step7Review({
  data,
  updateData,
}: {
  data: ListingFormData;
  updateData?: (data: Partial<ListingFormData>) => void;
}) {
  const isSale = data.listing_type === "sale";
  const isComplete =
    data.city && (data.locality || data.address) && data.price > 0 && data.area_sqft > 0;

  const images = data.images || [];
  const coverImage = images[data.cover_image_index ?? 0] || images[0];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Review & Submit Listing
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review your property summary before submitting for moderation. Verified listings go live
          within 2-4 hours.
        </p>
      </div>

      {/* 0% Brokerage & Direct Owner Assurance Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500 text-white font-black text-sm">0%</div>
          <div>
            <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-300">
              Seedha Properties — 0% Brokerage
            </h3>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-400">
              You are listing directly as the owner. No broker fees will ever be charged.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full">
          Direct Owner
        </span>
      </div>

      {!isComplete && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <h4 className="font-bold">Required Details Incomplete</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Please ensure locality, pricing, and built-up area are provided before submitting.
            </p>
          </div>
        </div>
      )}

      {/* Structured Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Property Details */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm border-b border-border/40 pb-2.5">
            <Building2 className="h-4 w-4 text-primary" />
            <span>Property Specifications</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Category:</span>
              <p className="font-bold text-foreground mt-0.5">
                {data.property_type || "Apartment"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Purpose:</span>
              <p className="font-bold text-foreground mt-0.5 capitalize">
                For {data.listing_type === "sale" ? "Sale" : "Rent"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">BHK & Baths:</span>
              <p className="font-bold text-foreground mt-0.5">
                {data.bhk_type || `${data.bedrooms || 2} BHK`} · {data.bathrooms || 2} Baths
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Built-up Area:</span>
              <p className="font-bold text-foreground mt-0.5">
                {data.area_sqft || 0} {data.area_unit || "Sq.ft"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Floor / Total:</span>
              <p className="font-bold text-foreground mt-0.5">
                Floor {data.exact_floor ?? "N/A"} of {data.total_floors ?? "N/A"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Furnishing:</span>
              <p className="font-bold text-foreground mt-0.5 capitalize">
                {String(data.furnishing_status || "unfurnished").replace("-", " ")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Facing & Age:</span>
              <p className="font-bold text-foreground mt-0.5">
                {data.facing || "East"} · {data.property_age || "0-1 Years"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Parking:</span>
              <p className="font-bold text-foreground mt-0.5">
                {data.parking_covered || 0} Covered slots
              </p>
            </div>
          </div>
        </div>

        {/* 2. Location */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm border-b border-border/40 pb-2.5">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Location & Locality</span>
          </div>
          <div className="text-xs space-y-2">
            <div>
              <span className="text-muted-foreground">City & Locality:</span>
              <p className="font-bold text-foreground text-sm mt-0.5">
                {data.locality || "Locality not specified"}, {data.city || "Hyderabad"}
              </p>
            </div>
            {data.project_name && (
              <div>
                <span className="text-muted-foreground">Society / Project:</span>
                <p className="font-semibold text-foreground mt-0.5">{data.project_name}</p>
              </div>
            )}
            {data.landmark && (
              <div>
                <span className="text-muted-foreground">Landmark:</span>
                <p className="font-medium text-foreground mt-0.5">{data.landmark}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Privacy Protection:</span>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Approximate ~500m radius circle displayed publicly
              </p>
            </div>
          </div>
        </div>

        {/* 3. Pricing */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm border-b border-border/40 pb-2.5">
            <IndianRupee className="h-4 w-4 text-primary" />
            <span>Pricing & Financials</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">
                {isSale ? "Expected Price:" : "Monthly Rent:"}
              </span>
              <p className="font-extrabold text-foreground text-base text-primary mt-0.5">
                ₹{(data.price || 0).toLocaleString("en-IN")} {isSale ? "" : "/ mo"}
              </p>
            </div>
            {!isSale && (
              <div>
                <span className="text-muted-foreground">Security Deposit:</span>
                <p className="font-bold text-foreground mt-0.5">
                  ₹{(data.deposit || 0).toLocaleString("en-IN")}
                </p>
              </div>
            )}
            {!isSale && data.maintenance ? (
              <div>
                <span className="text-muted-foreground">Maintenance:</span>
                <p className="font-semibold text-foreground mt-0.5">
                  ₹{(data.maintenance || 0).toLocaleString("en-IN")} / mo
                  {data.maintenance_included ? " (Included in rent)" : ""}
                </p>
              </div>
            ) : null}
            <div>
              <span className="text-muted-foreground">Negotiable:</span>
              <p className="font-semibold text-foreground mt-0.5">
                {data.rent_negotiable ? "Yes, negotiable" : "Fixed price"}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Photos & Schedule */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm border-b border-border/40 pb-2.5">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Photos & Visit Schedule</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Real Photos:</span>
              <p className="font-bold text-foreground mt-0.5 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                {images.length} photo(s) uploaded
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Availability:</span>
              <p className="font-bold text-foreground mt-0.5">
                {data.visit_availability || "Immediate"}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Visit Days & Slots:</span>
              <p className="font-semibold text-foreground mt-0.5">
                {(data.visit_days || ["All Days"]).join(", ")} ·{" "}
                {(data.visit_time_slots || ["Morning", "Evening"]).join(", ")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Amenities Pills */}
      {(data.amenities || []).length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm border-b border-border/40 pb-2.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Selected Amenities ({data.amenities.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.amenities.map((item) => (
              <span
                key={item}
                className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-semibold"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Moderation Workflow Notice */}
      <div className="bg-secondary/30 rounded-2xl border border-border/60 p-5 space-y-3">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-primary" />
          <span>Moderation & Publishing Process</span>
        </h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground overflow-x-auto py-1">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Submit</span>
          </div>
          <span className="text-muted-foreground/40">→</span>
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Admin Review</span>
          </div>
          <span className="text-muted-foreground/40">→</span>
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Verified Badge</span>
          </div>
          <span className="text-muted-foreground/40">→</span>
          <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
              ✓
            </span>
            <span>Live Published</span>
          </div>
        </div>
      </div>

      {/* Owner Declaration Checkbox */}
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 shadow-xs">
        <label className="flex items-start gap-3.5 cursor-pointer">
          <input
            type="checkbox"
            checked={data.owner_declaration || false}
            onChange={(e) => updateData?.({ owner_declaration: e.target.checked })}
            className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer shrink-0"
          />
          <div className="text-xs sm:text-sm space-y-1">
            <span className="font-bold text-foreground block">Owner Declaration *</span>
            <span className="text-muted-foreground leading-relaxed block">
              "I confirm that I am the genuine owner or authorized person for this property and that
              all the specifications, pricing, and real photos submitted are authentic and
              truthful."
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
