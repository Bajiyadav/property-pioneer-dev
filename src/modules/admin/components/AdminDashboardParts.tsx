import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Users } from "lucide-react";
import { formatPrice, type Property } from "@/modules/property/services/propertyQueries";
import {
  DataTable,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  StatusPill,
} from "@/modules/dashboard/components/DashboardKit";
import { SEARCH_PARAMS, type PlatformUser } from "@/modules/admin/fixtures";

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
          header: "User",
          render: (u: PlatformUser) => (
            <div>
              <p className="font-bold text-foreground">{u.name}</p>
              <p className="text-[11px] text-muted-foreground">{u.email}</p>
            </div>
          ),
        },
        {
          key: "role",
          header: "Role",
          render: (u: PlatformUser) => <StatusPill label={u.role} tone="info" />,
        },
        {
          key: "joined",
          header: "Joined",
          render: (u: PlatformUser) => (
            <span className="whitespace-nowrap text-muted-foreground">{u.joined}</span>
          ),
        },
        {
          key: "status",
          header: "Status",
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
  onManageMedia,
  onTogglePromotion,
}: {
  properties: Property[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onManageMedia?: (property: Property) => void;
  onTogglePromotion?: (property: Property, updates: { is_featured?: boolean; promo_badge?: string; priority_rank?: number }) => void;
}) {
  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (isError) return <ErrorState onRetry={onRetry} />;

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
          header: "Listing",
          render: (p: Property) => (
            <div>
              <Link
                to="/properties/$id"
                params={{ id: p.id }}
                search={SEARCH_PARAMS}
                className="font-bold text-foreground hover:text-primary block"
              >
                {p.title}
              </Link>
              <span className="text-[10px] text-muted-foreground">{p.locality || p.city}</span>
            </div>
          ),
        },
        {
          key: "city",
          header: "City",
          render: (p: Property) => <span className="text-muted-foreground">{p.city}</span>,
        },
        {
          key: "price",
          header: "Price",
          render: (p: Property) => (
            <span className="whitespace-nowrap font-bold text-foreground">
              {formatPrice(p.price, p.listing_type)}
            </span>
          ),
        },
        {
          key: "media",
          header: "Media Status",
          render: (p: Property) => {
            const mStatus = (p as any).media_status || "pending_review";
            return (
              <StatusPill
                label={mStatus === "verified" ? "Media Verified" : mStatus === "needs_reshoot" ? "Re-Shoot Req" : "Pending Review"}
                tone={mStatus === "verified" ? "success" : mStatus === "needs_reshoot" ? "danger" : "warning"}
              />
            );
          },
        },
        {
          key: "promotion",
          header: "Ad & Rank Controls",
          render: (p: Property) => {
            const isFeatured = Boolean(p.is_featured);
            const promoBadge = (p as any).promo_badge || (isFeatured ? "Featured" : "None");
            const priorityRank = (p as any).priority_rank || 1;

            return (
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() =>
                    onTogglePromotion?.(p, {
                      is_featured: !isFeatured,
                      promo_badge: !isFeatured ? "Featured" : undefined,
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    isFeatured ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {isFeatured ? "★ Featured" : "+ Promote"}
                </button>
                <select
                  value={promoBadge}
                  onChange={(e) =>
                    onTogglePromotion?.(p, { is_featured: e.target.value !== "None", promo_badge: e.target.value })
                  }
                  className="p-1 rounded-lg bg-background border border-border text-[11px] font-semibold text-foreground focus:outline-none"
                >
                  <option value="None">No Badge</option>
                  <option value="Featured">Featured</option>
                  <option value="Hot Offer">Hot Offer</option>
                  <option value="New Launch">New Launch</option>
                  <option value="Verified Top Pick">Top Pick</option>
                </select>
                <select
                  value={priorityRank}
                  onChange={(e) =>
                    onTogglePromotion?.(p, { priority_rank: Number(e.target.value) })
                  }
                  title="Homepage Sorting Rank (10 = Highest)"
                  className="p-1 rounded-lg bg-background border border-border text-[11px] font-extrabold text-primary focus:outline-none"
                >
                  {Array.from({ length: 10 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Rank {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            );
          },
        },
        {
          key: "action",
          header: "Actions",
          className: "text-right",
          render: (p: Property) => (
            <button
              onClick={() => onManageMedia?.(p)}
              className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition cursor-pointer"
            >
              Manage Media
            </button>
          ),
        },
      ]}
    />
  );
}
