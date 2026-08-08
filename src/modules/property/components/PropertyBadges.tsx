import { useEffect, useState } from "react";
import {
  type Property,
  isOwnerVerified,
  isPropertyVerified,
  isNewlyListed,
} from "@/modules/property/services/propertyService";
import { CheckCircle2, ShieldCheck, Tag, Sparkles, Clock, Crown } from "lucide-react";

export function PropertyBadges({
  property,
  size = "md",
}: {
  property: Property;
  size?: "sm" | "md" | "lg";
}) {
  const ownerVerified = isOwnerVerified(property);
  const propertyVerified = isPropertyVerified(property);
  const isZeroBrokerage = property.is_zero_brokerage !== false;
  const isFeatured = property.is_featured;
  const isPremium = Boolean(property.is_premium);

  // `isNewlyListed` reads the wall clock, so evaluating it during render makes
  // the server and client disagree and fails hydration. Resolve it after mount:
  // the first client render then matches the SSR markup exactly.
  const [newlyListed, setNewlyListed] = useState(false);
  useEffect(() => {
    setNewlyListed(isNewlyListed(property));
  }, [property]);

  const textSize =
    size === "sm"
      ? "text-[10px] px-2 py-0.5"
      : size === "lg"
        ? "text-xs px-3 py-1"
        : "text-xs px-2.5 py-0.5";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* 1. Verified Owner Badge */}
      {ownerVerified && (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-600/90 font-semibold uppercase tracking-wide text-white backdrop-blur ${textSize}`}
          title="Owner contact details confirmed at signup"
        >
          <CheckCircle2 className={iconSize} /> Verified Owner
        </span>
      )}

      {/* 2. Verified Property Badge */}
      {propertyVerified && (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-blue-600/90 font-semibold uppercase tracking-wide text-white backdrop-blur ${textSize}`}
          title="Reviewed by a moderator before publication"
        >
          <ShieldCheck className={iconSize} /> Verified Property
        </span>
      )}

      {/* 3. No-commission Badge */}
      {isZeroBrokerage && (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-teal-700/90 font-semibold uppercase tracking-wide text-white backdrop-blur ${textSize}`}
          title="Listed directly by the owner — Urban Properties adds no commission"
        >
          <Tag className={iconSize} /> No commission
        </span>
      )}

      {/* 4. Featured Badge */}
      {isFeatured && (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-primary font-semibold uppercase tracking-wide text-primary-foreground backdrop-blur ${textSize}`}
        >
          <Sparkles className={iconSize} /> Featured
        </span>
      )}

      {/* 5. Newly Listed Badge */}
      {newlyListed && (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-amber-600/90 font-semibold uppercase tracking-wide text-white backdrop-blur ${textSize}`}
        >
          <Clock className={iconSize} /> New
        </span>
      )}

      {/* 6. Premium Listing Badge */}
      {isPremium && (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-purple-600/90 font-semibold uppercase tracking-wide text-white backdrop-blur ${textSize}`}
        >
          <Crown className={iconSize} /> Premium
        </span>
      )}
    </div>
  );
}
