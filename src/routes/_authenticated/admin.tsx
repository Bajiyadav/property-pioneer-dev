import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Building2,
  Inbox,
  ScrollText,
  ShieldAlert,
  Sparkles,
  LogOut,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/BrandMark";
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
  checkIsAdmin,
  getAdminAuditLogs,
  getAdminEnquiries,
  getAdminOverview,
  getAdminProperties,
  updateAdminProperty,
} from "@/lib/admin.functions";

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
  component: AdminDashboard,
  errorComponent: ({ error }) => (
    <AdminShell>
      <p role="alert" className="text-sm text-muted-foreground">
        {error.message}
      </p>
    </AdminShell>
  ),
});

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

function AdminShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <BrandMark size="sm" />
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground">
            Admin dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Listings, leads, and platform activity in one place.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function AdminDashboard() {
  const check = useServerFn(checkIsAdmin);
  const { data, isPending } = useQuery({
    queryKey: ["admin", "access"],
    queryFn: () => check({}),
  });

  if (isPending) {
    return (
      <AdminShell>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </AdminShell>
    );
  }

  if (!data?.isAdmin) {
    return (
      <AdminShell>
        <Card className="flex flex-col items-start gap-3 p-6">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Admin access required
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            You're signed in, but this account doesn't have the admin role yet. Ask a
            platform administrator to grant it, then reload this page.
          </p>
        </Card>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <MetricsPanel />
      <Tabs defaultValue="listings" className="mt-10">
        <TabsList>
          <TabsTrigger value="listings" className="gap-1.5">
            <Building2 className="h-4 w-4" /> Listings
          </TabsTrigger>
          <TabsTrigger value="enquiries" className="gap-1.5">
            <Inbox className="h-4 w-4" /> Enquiries
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <ScrollText className="h-4 w-4" /> Activity
          </TabsTrigger>
        </TabsList>
        <TabsContent value="listings" className="mt-6">
          <ListingsPanel />
        </TabsContent>
        <TabsContent value="enquiries" className="mt-6">
          <EnquiriesPanel />
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <AuditPanel />
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
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
  if (!data?.length)
    return <p className="text-sm text-muted-foreground">No listings yet.</p>;

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
  if (!data?.length)
    return <p className="text-sm text-muted-foreground">No enquiries yet.</p>;

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