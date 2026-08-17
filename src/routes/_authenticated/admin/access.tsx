import { createFileRoute } from "@tanstack/react-router";
import { upsertEmployeeAccess } from "@/modules/admin/services/adminFunctions";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/access")({
  component: AccessManagement,
});

const HYDERABAD_LOCALITIES = [
  "Madhapur",
  "Gachibowli",
  "Kondapur",
  "Hitech City",
  "Financial District",
  "Miyapur",
  "Jubilee Hills",
  "Kokapet",
  "Raidurg",
];

function AccessManagement() {
  const { access } = Route.useRouteContext();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"support" | "moderator" | "analyst" | "ops" | "admin">(
    "moderator",
  );
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const mutation = useMutation({
    mutationFn: () => upsertEmployeeAccess({ data: { email, role, regions: selectedRegions } }),
    onSuccess: () => {
      setSuccessMsg(`Successfully updated access for ${email}`);
      setErrorMsg("");
      setEmail("");
      setSelectedRegions([]);
    },
    onError: (err: unknown) => {
      setErrorMsg(err instanceof Error ? err.message : String(err) || "Failed to update access");
      setSuccessMsg("");
    },
  });

  if (access.role !== "admin") {
    return (
      <div className="p-8 text-center text-neutral-400">
        Only admins can manage employee access.
      </div>
    );
  }

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Email is required");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-white tracking-tight">Access Management</h1>
      <p className="text-neutral-400">
        Assign roles and location scopes to employees. Location scopes determine which properties
        and enquiries the employee can see.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 space-y-6"
      >
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-sm">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-sm">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Employee Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-neutral-600"
              placeholder="employee@urbanproperties.com"
            />
            <p className="text-xs text-neutral-500 mt-1">
              User must have an existing registered account.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "support" | "moderator" | "analyst" | "ops" | "admin")
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-neutral-600"
            >
              <option value="moderator">Moderator (Approve/Reject Properties)</option>
              <option value="support">Support (Read Enquiries & Properties)</option>
              <option value="analyst">Analyst (Read Properties Only)</option>
              <option value="ops">Ops (Manage Users/Roles)</option>
              <option value="admin">Admin (Full Access, Global Scope)</option>
            </select>
          </div>

          {role !== "admin" && role !== "ops" && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Location Scope (Regions)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {HYDERABAD_LOCALITIES.map((loc) => (
                  <label
                    key={loc}
                    className={`flex items-center space-x-2 p-3 border rounded cursor-pointer transition-colors ${
                      selectedRegions.includes(loc)
                        ? "bg-indigo-600/20 border-indigo-500 text-white"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedRegions.includes(loc)}
                      onChange={() => toggleRegion(loc)}
                    />
                    <span className="text-sm font-medium">{loc}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Leave all unchecked to give global scope (not recommended for regional employees).
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-neutral-800 flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? "Saving..." : "Assign Access"}
          </button>
        </div>
      </form>
    </div>
  );
}
