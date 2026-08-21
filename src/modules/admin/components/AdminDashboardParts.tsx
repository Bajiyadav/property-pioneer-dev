/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Building2, Users, Star, Download, Upload, CheckCircle2 } from "lucide-react";
import { formatPrice, type Property } from "@/modules/property/services/propertyQueries";
import {
  DataTable,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  StatusPill,
} from "@/modules/dashboard/components/DashboardKit";
import type { PlatformUser } from "@/modules/admin/services/adminFunctions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEFAULT_SEARCH_PARAMS = {
  q: "",
  city: "Hyderabad",
  listing: "rent",
  minPrice: 0,
  maxPrice: 0,
  beds: 0,
} as const;

export function UserTable({ users }: { users: PlatformUser[] }) {
  return (
    <DataTable
      rows={users}
      getKey={(u) => u.id}
      empty={
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No accounts match"
          hint="Try a different role filter or search term."
        />
      }
      columns={[
        {
          key: "name",
          header: "User & Details",
          render: (u: PlatformUser) => (
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-foreground">{u.name}</p>
                {u.role === "Owner" && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 border border-emerald-500/20">
                    Verified Owner
                  </span>
                )}
                {u.role === "Agent" && (
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-600 border border-blue-500/20">
                    RERA Agent
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{u.email}</p>
            </div>
          ),
        },
        {
          key: "role",
          header: "Role Category",
          render: (u: PlatformUser) => (
            <StatusPill
              label={u.role}
              tone={
                u.role === "Admin"
                  ? "danger"
                  : u.role === "Owner"
                    ? "success"
                    : u.role === "Agent"
                      ? "info"
                      : "neutral"
              }
            />
          ),
        },
        {
          key: "joined",
          header: "Joined Date",
          render: (u: PlatformUser) => (
            <span className="whitespace-nowrap text-muted-foreground text-xs">{u.joined}</span>
          ),
        },
        {
          key: "status",
          header: "Account Status",
          className: "text-right",
          render: (u: PlatformUser) => (
            <StatusPill
              label={u.status}
              tone={
                u.status === "Active" ? "success" : u.status === "Pending" ? "warning" : "danger"
              }
            />
          ),
        },
      ]}
    />
  );
}

export function PropertyTable({
  properties,
  isLoading,
  isError,
  onRetry,
}: {
  properties: Property[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const [featuredStates, setFeaturedStates] = useState<Record<string, boolean>>({});

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (isError) return <ErrorState onRetry={onRetry} />;

  const toggleHighlight = async (propertyId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setFeaturedStates((prev) => ({ ...prev, [propertyId]: newStatus }));

    try {
      const { error } = await (supabase.from as any)("properties")
        .update({ is_featured: newStatus })
        .eq("id", propertyId);

      if (error) {
        toast.error("Could not update feature status on Supabase.");
        return;
      }

      toast.success(
        newStatus
          ? "Property Highlighted! Now featured on Home Page Hero."
          : "Property unhighlighted.",
      );
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleDownloadMedia = (p: Property) => {
    const urls = p.images || [];
    if (urls.length === 0) {
      toast.error("No uploaded media found for this listing.");
      return;
    }
    urls.forEach((url, i) => {
      window.open(url, "_blank");
    });
    toast.success(`Opened ${urls.length} media file(s) for download.`);
  };

  return (
    <DataTable
      rows={properties}
      getKey={(p) => p.id}
      empty={
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No properties found"
          hint="Listings appear here once owners publish them."
        />
      }
      columns={[
        {
          key: "title",
          header: "Listing Details",
          render: (p: Property) => (
            <div>
              <Link
                to="/properties/$id"
                params={{ id: p.id }}
                search={DEFAULT_SEARCH_PARAMS}
                className="font-bold text-foreground hover:text-primary flex items-center gap-1.5"
              >
                <span>{p.title}</span>
                {(featuredStates[p.id] ?? p.is_featured) && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-extrabold text-amber-600">
                    <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> Featured
                  </span>
                )}
              </Link>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {p.locality}, {p.city} • {(p as any).bhk_type || "2 BHK"}
              </p>
            </div>
          ),
        },
        {
          key: "price",
          header: "Price / Rent",
          render: (p: Property) => (
            <span className="whitespace-nowrap font-bold text-foreground text-xs">
              {formatPrice(p.price, p.listing_type)}
            </span>
          ),
        },
        {
          key: "media",
          header: "Media & Access",
          render: (p: Property) => (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadMedia(p)}
                className="inline-flex items-center gap-1 rounded-xl bg-card border border-border/80 px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-secondary cursor-pointer shadow-xs"
              >
                <Download className="h-3 w-3 text-emerald-600" /> Media ({p.images?.length || 0})
              </button>
            </div>
          ),
        },
        {
          key: "actions",
          header: "Admin Actions",
          className: "text-right",
          render: (p: Property) => {
            const isFeat = featuredStates[p.id] ?? p.is_featured;
            return (
              <button
                type="button"
                onClick={() => toggleHighlight(p.id, Boolean(isFeat))}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                  isFeat
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/20"
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${isFeat ? "fill-white" : ""}`} />
                <span>{isFeat ? "Highlighted" : "Highlight Property"}</span>
              </button>
            );
          },
        },
      ]}
    />
  );
}
