import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminAuditLogs } from "@/modules/admin/services/adminFunctions";
import { useEmployeeAccess } from "@/modules/admin/hooks/useEmployeeAccess";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPanel,
});

function UsersPanel() {
  // Fetched in the component, not in `loader`. A route loader runs during SSR,
  // where the Supabase bearer token is attached by a *client* middleware and is
  // therefore absent — every one of these server functions threw "no
  // authorization header" and 500'd the whole /admin document, for signed-in
  // admins and anonymous visitors alike.
  const fetchgetAdminAuditLogs = useServerFn(getAdminAuditLogs);
  const { data: logs = [] } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => fetchgetAdminAuditLogs({}),
  });
  const access = useEmployeeAccess();

  if (access?.role !== "admin" && access?.role !== "ops") {
    return (
      <div className="p-8 text-center text-neutral-400">
        You do not have permission to view the user management panel.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white tracking-tight">User Management (Ops)</h1>
      <p className="text-neutral-400">
        Feature under construction. Recent audit logs are shown below.
      </p>

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
        <h2 className="text-lg font-medium text-white mb-4">Recent Audit Activity</h2>
        <div className="space-y-3 text-sm text-neutral-300">
          {logs.length === 0
            ? "No logs found."
            : logs.map((log) => (
                <div key={log.id} className="p-3 bg-neutral-950 rounded border border-neutral-800">
                  <span className="text-emerald-400 font-medium">[{log.event}]</span> {log.outcome}{" "}
                  on {log.subject_type} {log.subject_id}
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
