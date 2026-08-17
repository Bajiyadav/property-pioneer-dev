import { createFileRoute } from "@tanstack/react-router";
import { getAdminOverview } from "@/modules/admin/services/adminFunctions";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  loader: () => getAdminOverview(),
  component: AnalyticsPanel,
});

function AnalyticsPanel() {
  const data = Route.useLoaderData();

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
