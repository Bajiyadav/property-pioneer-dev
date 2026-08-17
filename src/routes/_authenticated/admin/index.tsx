import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminOverview } from "@/modules/admin/services/adminFunctions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEmployeeAccess } from "@/modules/admin/hooks/useEmployeeAccess";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
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

  const access = useEmployeeAccess();

  // After every hook: an early return above `useEmployeeAccess` changed the
  // hook order between renders, which React rejects.
  if (!data) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
        <p className="text-neutral-400 text-sm mt-1">
          {access?.role === "admin"
            ? "Global statistics across all regions."
            : `Statistics restricted to your assigned regions.`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Properties" value={data.totalProperties} />
        <StatCard
          title="Pending Approval"
          value={data.pendingProperties}
          alert={data.pendingProperties > 0}
        />
        <StatCard title="Approved Properties" value={data.approvedProperties} />
        <StatCard title="Featured Properties" value={data.featuredProperties} />
        <StatCard title="For Rent" value={data.forRent} />
        <StatCard title="For Sale" value={data.forSale} />
        <StatCard title="Total Enquiries" value={data.totalEnquiries} />
        <StatCard title="New Enquiries (7d)" value={data.enquiriesLast7Days} />
      </div>

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Top Cities (In Scope)</h2>
        {data.cities.length === 0 ? (
          <p className="text-neutral-400 text-sm">No property data available in your scope.</p>
        ) : (
          <div className="space-y-4">
            {data.cities.map((cityData) => (
              <div key={cityData.city} className="flex items-center justify-between">
                <span className="text-neutral-300 font-medium">{cityData.city}</span>
                <span className="text-neutral-400 bg-neutral-800 px-2 py-1 rounded text-sm">
                  {cityData.count} properties
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, alert }: { title: string; value: number; alert?: boolean }) {
  return (
    <div
      className={`bg-neutral-900 rounded-xl border p-5 ${alert ? "border-amber-500/50" : "border-neutral-800"}`}
    >
      <div className="text-sm font-medium text-neutral-400">{title}</div>
      <div className={`text-3xl font-bold mt-2 ${alert ? "text-amber-400" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
