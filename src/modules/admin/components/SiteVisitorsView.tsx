import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DataTable,
  SectionHeader,
  LoadingSkeleton,
  ErrorState,
} from "@/modules/dashboard/components/DashboardKit";

export function SiteVisitorsView() {
  const {
    data: visitors,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin_site_visitors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_visitors" as any)
        .select(
          `
          id,
          ip_address,
          city,
          region,
          country,
          platform,
          visited_at,
          user_id
        `,
        )
        .order("visited_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const columns = [
    {
      key: "location",
      header: "Location",
      render: (row: any) => {
        const parts = [row.city, row.region, row.country].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "Unknown";
      },
    },
    { key: "ip", header: "IP Address", render: (row: any) => row.ip_address || "Unknown" },
    { key: "platform", header: "Platform", render: (row: any) => row.platform || "Web" },
    {
      key: "visited",
      header: "Visited At",
      render: (row: any) => new Date(row.visited_at).toLocaleString(),
    },
  ];

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <ErrorState message="Failed to load visitors" onRetry={() => window.location.reload()} />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Site Visitors" subtitle="Recent visitors to the platform." />

      <DataTable columns={columns} rows={visitors || []} getKey={(row: any) => row.id} />
    </div>
  );
}
