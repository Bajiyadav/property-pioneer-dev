import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminProperties, updateAdminProperty } from "@/modules/admin/services/adminFunctions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  component: ModerationQueue,
});

function ModerationQueue() {
  // Fetched in the component, not in `loader`. A route loader runs during SSR,
  // where the Supabase bearer token is attached by a *client* middleware and is
  // therefore absent — every one of these server functions threw "no
  // authorization header" and 500'd the whole /admin document, for signed-in
  // admins and anonymous visitors alike.
  const fetchgetAdminProperties = useServerFn(getAdminProperties);
  const { data: properties = [] } = useQuery({
    queryKey: ["admin", "properties"],
    queryFn: () => fetchgetAdminProperties({}),
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (args: { id: string; is_approved: boolean }) => updateAdminProperty({ data: args }),
    onSuccess: () => {
      // Invalidate the router loader or react-query cache if integrated
      window.location.reload(); // Simple refresh for now to avoid setting up full invalidation
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white tracking-tight">Moderation Queue</h1>

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-neutral-950/50 text-neutral-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-medium">Title & Location</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {properties.map((p) => (
              <tr key={p.id} className="hover:bg-neutral-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{p.title}</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {p.locality || p.region}, {p.city}
                  </div>
                </td>
                <td className="px-6 py-4 capitalize">{p.listing_type}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      p.is_approved
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {p.is_approved ? "Approved" : "Pending"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {!p.is_approved ? (
                    <button
                      onClick={() => mutation.mutate({ id: p.id, is_approved: true })}
                      disabled={mutation.isPending}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => mutation.mutate({ id: p.id, is_approved: false })}
                      disabled={mutation.isPending}
                      className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded font-medium text-xs transition-colors disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {properties.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                  No properties found in your assigned regions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
