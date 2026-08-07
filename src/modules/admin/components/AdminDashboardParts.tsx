import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Users } from "lucide-react";
import { formatPrice, type Property } from "@/lib/properties";
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
}: {
  properties: Property[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
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
            <Link
              to="/properties/$id"
              params={{ id: p.id }}
              search={SEARCH_PARAMS}
              className="font-bold text-foreground hover:text-primary"
            >
              {p.title}
            </Link>
          ),
        },
        {
          key: "city",
          header: "City",
          render: (p: Property) => <span className="text-muted-foreground">{p.city}</span>,
        },
        {
          key: "type",
          header: "Type",
          render: (p: Property) => <span className="text-muted-foreground">{p.property_type}</span>,
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
          key: "status",
          header: "Status",
          className: "text-right",
          render: (p: Property) => (
            <StatusPill
              label={p.is_featured ? "Featured" : "Live"}
              tone={p.is_featured ? "info" : "success"}
            />
          ),
        },
      ]}
    />
  );
}
