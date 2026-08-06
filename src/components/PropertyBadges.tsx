import { type Property, formatPrice } from "@/lib/properties";
import { CheckCircle2, ShieldCheck, Tag, Sparkles, Clock, Crown } from "lucide-react";

export function PropertyBadges({
  property,
  size = "md",
}: {
  property: Property;
  size?: "sm" | "md" | "lg";
}) {
  const isOwnerVerified = property.owner_verification_status === "verified";
  const isPropertyVerified = property.property_verification_status === "verified";
  const isZeroBrokerage = property.is_zero_brokerage !== false;
  const isFeatured = property.is_featured;
  const isPremium = Boolean(property.is_premium);

  const daysOld = Math.floor(
    (Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isNewlyListed = daysOld <= 7;

  const textSize = size === "sm" ? "text-[10px] px-2 py-0.5" : size === "lg" ? "text-xs px-3 py-1" : "text-xs px-2.5 py-0.5";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* 1. Verified Owner Badge */}
      {isOwnerVerified && (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-600/90 font-semibold uppercase tracking-wide text-white backdrop-blur ${textSize}`}
          title="Owner identity and documents verified"
        >
          <CheckCircle2 className={iconSize} /> Verified Owner
        </span>
      )}

      {/* 2. Verified Property Badge */}
      {isPropertyVerified && (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-blue-600/90 font-semibold uppercase tracking-wide text-white backdrop-blur ${textSize}`}
          title="Physical address and property registry verified"
        >
          <ShieldCheck className={iconSize} /> Verified Property
        </span>
      )}

      {/* 3. Zero Brokerage Badge */}
      {isZeroBrokerage && (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-teal-700/90 font-semibold uppercase tracking-wide text-white backdrop-blur ${textSize}`}
          title="Direct listing — 0% brokerage fee"
        >
          <Tag className={iconSize} /> 0% Brokerage
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
      {isNewlyListed && (
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
