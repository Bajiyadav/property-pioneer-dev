import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminOverview } from "@/modules/admin/services/adminFunctions";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsPanel,
});

function AnalyticsPanel() {
  // Fetched in the component, not in `loader`. A route loader runs during SSR,
  // where the Supabase bearer token is attached by a *client* middleware and is
  // therefore absent — every one of these server functions threw "no
  // authorization header" and 500'd the whole /admin document, for signed-in
  // admins and anonymous visitors alike.
  const fetchgetAdminOverview = useServerFn(getAdminOverview);
  const { data: data } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => fetchgetAdminOverview({}),
  });

  // Overview is an object; render a loading state rather than dereferencing it.
  if (!data) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white tracking-tight">Analytics Dashboard</h1>
      <p className="text-neutral-400">Aggregated statistics based on your assigned regions.</p>

      <div className="bg-neutral-900 p-8 rounded-xl border border-neutral-800 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="text-5xl font-bold text-white mb-2">{data.totalEnquiries}</div>
          <div className="text-neutral-400 font-medium uppercase text-sm tracking-wider">
            Total Enquiries Serviced
          </div>

          <div className="mt-8 pt-8 border-t border-neutral-800 grid grid-cols-2 gap-12">
            <div>
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {data.approvedProperties}
              </div>
              <div className="text-neutral-400 text-sm">Active Listings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-400 mb-1">{data.pendingProperties}</div>
              <div className="text-neutral-400 text-sm">In Queue</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
