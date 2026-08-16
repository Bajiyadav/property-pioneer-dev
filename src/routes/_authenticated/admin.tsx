import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Building2, Inbox, ScrollText, Sparkles, LogOut } from "lucide-react";

import { useAuthSession } from "@/hooks/useAuthSession";
import { BrandMark } from "@/shared/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminAuditLogs,
  getAdminEnquiries,
  getAdminOverview,
  getAdminProperties,
  updateAdminProperty,
} from "@/modules/admin/services/adminFunctions";
import { RequireRole } from "@/modules/dashboard/components/RequireRole";

/**
 * Authorization for this route is a component guard, not a `beforeLoad`.
 *
 * `beforeLoad` cannot do the job here. The Supabase session lives in
 * localStorage and the bearer token is attached by a *client* middleware, so
 * during SSR the check has no credentials to work with: it failed with "no
 * authorization header" for everyone, real admins included, which is why
 * opening /admin directly used to bounce straight back out. Skipping it on the
 * server is no better — `beforeLoad` does not re-run on hydration, so the admin
 * shell would be server-rendered for whoever asked for the URL.
 *
 * `RequireRole` resolves the role from the RLS-protected `user_roles` table and
 * renders nothing but a checking state until that answer arrives, so no admin
 * chrome reaches a non-admin at any point. Every server function behind the
 * panels still runs its own `assertAdmin`, so the data is guarded independently
 * of this component.
 */
export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — Urban Rental Flats" },
      {
        name: "description",
        content: "Manage listings, enquiries, and platform activity on Urban Rental Flats.",
      },
      { property: "og:title", content: "Admin dashboard — Urban Rental Flats" },
      {
        property: "og:description",
        content: "Manage listings, enquiries, and platform activity on Urban Rental Flats.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GuardedAdminDashboard,
  errorComponent: ({ error }) => (
    <RequireRole role="admin">
      {() => (
        <AdminShell>
          <p role="alert" className="text-sm text-muted-foreground">
            {error.message}
          </p>
        </AdminShell>
      )}
    </RequireRole>
  ),
});

function GuardedAdminDashboard() {
  return <RequireRole role="admin">{() => <AdminDashboard />}</RequireRole>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

import { AdminSidebar } from "@/modules/admin/components/AdminSidebar";
import { DashboardAnalytics } from "@/modules/admin/components/DashboardAnalytics";
import { PropertiesDataTable } from "@/modules/admin/components/PropertiesDataTable";
import { useAdminPropertyStore } from "@/shared/stores/adminPropertyStore";

function AdminShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { signOut } = useAuthSession();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate({ to: "/auth", replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col pt-16">
      {/*
        Sign-out lives here because the admin portal has no other exit: it does
        not use DashboardLayout, so the sidebar sign-out button that every other
        dashboard gets is not present. `handleSignOut` was defined but never
        rendered, which left admins with no way to end their session from this
        page at all.
      */}
      <div className="flex w-full max-w-[1600px] mx-auto items-center justify-end px-8 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={signingOut}
          data-testid="sidebar-signout"
          aria-label="Sign out"
          className="gap-2"
        >
          <LogOut className="h-4 w-4" /> {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto">{children}</div>
    </div>
  );
}

function AdminDashboard() {
  const [currentView, setCurrentView] = useState("dashboard");

  const pending = useAdminPropertyStore((s) => s.getPendingProperties());
  const active = useAdminPropertyStore((s) => s.getActiveProperties());
  const rejected = useAdminPropertyStore((s) => s.getRejectedProperties());
  const expired = useAdminPropertyStore((s) => s.getExpiredProperties());

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardAnalytics />;
      case "pending":
        return (
          <PropertiesDataTable
            properties={pending}
            title="Pending Approvals"
            showReviewActions={true}
          />
        );
      case "active":
        return (
          <PropertiesDataTable
            properties={active}
            title="Active Listings"
            showReviewActions={false}
          />
        );
      case "rejected":
        return (
          <PropertiesDataTable
            properties={rejected}
            title="Rejected Listings"
            showReviewActions={false}
          />
        );
      case "expired":
        return (
          <PropertiesDataTable
            properties={expired}
            title="Expired & Archived"
            showReviewActions={false}
          />
        );
      default:
        return <DashboardAnalytics />;
    }
  };

  return (
    <AdminShell>
      <AdminSidebar currentView={currentView} setView={setCurrentView} />
      <div className="flex-1 p-8">{renderContent()}</div>
    </AdminShell>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

function MetricsPanel() {
  const fetchOverview = useServerFn(getAdminOverview);
  const { data, isPending } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => fetchOverview({}),
  });

  if (isPending || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Listings"
          value={String(data.totalProperties)}
          hint={`${data.forRent} to rent · ${data.forSale} for sale`}
        />
        <Metric
          label="Approved"
          value={String(data.approvedProperties)}
          hint={`${data.pendingProperties} awaiting approval`}
        />
        <Metric
          label="Featured"
          value={String(data.featuredProperties)}
          hint="Shown on the homepage"
        />
        <Metric
          label="Enquiries"
          value={String(data.totalEnquiries)}
          hint={`${data.enquiriesLast7Days} in the last 7 days`}
        />
      </div>
      {data.cities.length > 0 && (
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Coverage by city
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.cities.map((c) => (
              <Badge key={c.city} variant="secondary">
                {c.city} · {c.count}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ListingsPanel() {
  const fetchProperties = useServerFn(getAdminProperties);
  const update = useServerFn(updateAdminProperty);
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["admin", "properties"],
    queryFn: () => fetchProperties({}),
  });

  const mutation = useMutation({
    mutationFn: (vars: {
      id: string;
      is_approved?: boolean;
      is_featured?: boolean;
      status?: "available" | "rented" | "sold";
    }) => update({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      toast.success("Listing updated");
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => setBusyId(null),
  });

  if (isPending) return <Skeleton className="h-64 rounded-xl" />;
  if (!data?.length) return <p className="text-sm text-muted-foreground">No listings yet.</p>;

  return (
    <Card className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Listing</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <span className="font-medium text-foreground">{p.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {p.city} · {p.listing_type}
                </span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {p.owner_name}
                <span className="block">{p.owner_phone}</span>
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatMoney(Number(p.price))}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={p.is_approved ? "default" : "outline"}>
                    {p.is_approved ? "Approved" : "Pending"}
                  </Badge>
                  {p.is_featured && (
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" /> Featured
                    </Badge>
                  )}
                  <Badge variant="outline">{p.status}</Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === p.id}
                    onClick={() => {
                      setBusyId(p.id);
                      mutation.mutate({ id: p.id, is_approved: !p.is_approved });
                    }}
                    className="gap-1"
                  >
                    <BadgeCheck className="h-4 w-4" />
                    {p.is_approved ? "Unapprove" : "Approve"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === p.id}
                    onClick={() => {
                      setBusyId(p.id);
                      mutation.mutate({ id: p.id, is_featured: !p.is_featured });
                    }}
                    className="gap-1"
                  >
                    <Sparkles className="h-4 w-4" />
                    {p.is_featured ? "Unfeature" : "Feature"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function EnquiriesPanel() {
  const fetchEnquiries = useServerFn(getAdminEnquiries);
  const { data, isPending } = useQuery({
    queryKey: ["admin", "enquiries"],
    queryFn: () => fetchEnquiries({}),
  });

  if (isPending) return <Skeleton className="h-64 rounded-xl" />;
  if (!data?.length) return <p className="text-sm text-muted-foreground">No enquiries yet.</p>;

  return (
    <div className="space-y-3">
      {data.map((e) => (
        <Card key={e.id} className="p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium text-foreground">{e.name}</p>
            <p className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {e.phone} · {e.propertyTitle} ({e.propertyCity})
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{e.message}</p>
        </Card>
      ))}
    </div>
  );
}

function AuditPanel() {
  const fetchLogs = useServerFn(getAdminAuditLogs);
  const { data, isPending } = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => fetchLogs({}),
  });

  if (isPending) return <Skeleton className="h-64 rounded-xl" />;
  if (!data?.length)
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;

  return (
    <Card className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium text-foreground">{log.event}</TableCell>
              <TableCell>
                <Badge variant={log.outcome === "success" ? "secondary" : "outline"}>
                  {log.outcome}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {log.subject_type ?? "—"}
                <span className="block">{log.subject_id ?? ""}</span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {log.ip_address ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(log.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
