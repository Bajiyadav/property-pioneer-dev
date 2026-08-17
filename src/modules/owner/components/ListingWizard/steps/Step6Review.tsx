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

      {/*
        What happens after Submit.

        Stated plainly and in order, because the step immediately before the one
        irreversible action is where an owner most needs to know what they are
        agreeing to. It also sets an honest expectation about the wait: the
        previous copy promised a "Moderation Guarantee" and that listings "go
        live in 2-4 hours" without qualifying that a moderator has to act first,
        so a listing sitting in a queue overnight read as the platform failing.

        Each stage below describes something the platform actually does. Nothing
        here promises ownership verification, which is not performed.
      */}
      <div className="rounded-2xl border border-border/80 bg-secondary/20 p-5">
        <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> What happens after you submit
        </h4>
        <ol className="mt-4 space-y-4">
          {[
            {
              title: "Submitted",
              detail: "Your listing is saved to your account. You can edit or remove it any time.",
              now: true,
            },
            {
              title: "Moderator review",
              detail:
                "A person checks the details and photos for accuracy. Most listings are reviewed the same working day.",
            },
            {
              title: "Live on the site",
              detail:
                "Once approved it appears in search for renters and buyers. Until then only you can see it.",
            },
            {
              title: "Enquiries reach you directly",
              detail:
                "Interested tenants message you on WhatsApp at the number you gave in step 1. No agent sits in between, and we charge no commission.",
            },
          ].map((stage, i) => (
            <li key={stage.title} className="flex gap-3.5">
              <span
                aria-hidden="true"
                className={`mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full text-[11px] font-extrabold ${
                  stage.now
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">
                  {stage.title}
                  {stage.now ? (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      This step
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {stage.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
