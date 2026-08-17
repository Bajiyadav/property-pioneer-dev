import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { upsertEmployeeAccess, type EmployeeRole } from "../services/adminFunctions";
import { toast } from "sonner";
import { ShieldCheck, Plus, X } from "lucide-react";

export function EmployeeAccessForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<EmployeeRole>("support");
  const [regionInput, setRegionInput] = useState("");
  const [regions, setRegions] = useState<string[]>([]);

  const upsertAccess = useServerFn(upsertEmployeeAccess);

  const mutation = useMutation({
    mutationFn: (vars: { email: string; role: EmployeeRole; regions: string[] }) =>
      upsertAccess({ data: vars }),
    onSuccess: () => {
      toast.success("Employee access updated successfully");
      setEmail("");
      setRole("support");
      setRegions([]);
      setRegionInput("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update employee access");
    },
  });

  const handleAddRegion = () => {
    const r = regionInput.trim();
    if (r && !regions.includes(r)) {
      setRegions([...regions, r]);
    }
    setRegionInput("");
  };

  const handleRemoveRegion = (r: string) => {
    setRegions(regions.filter((reg) => reg !== r));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    mutation.mutate({ email, role, regions });
  };

  return (
    <div className="bg-white rounded-3xl border border-border/80 shadow-sm p-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 text-primary p-2 rounded-xl">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Manage Employee Access</h3>
          <p className="text-xs text-slate-500">
            Elevate a registered user to an employee role and assign regions.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">User Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="agent@example.com"
            className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as EmployeeRole)}
            className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          >
            <option value="support">Support</option>
            <option value="moderator">Moderator</option>
            <option value="analyst">Analyst</option>
            <option value="ops">Field Ops</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Assigned Regions
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={regionInput}
              onChange={(e) => setRegionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddRegion();
                }
              }}
              placeholder="e.g. Mumbai, 400001"
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              type="button"
              onClick={handleAddRegion}
              className="px-3 py-2 bg-secondary text-foreground font-semibold text-xs rounded-xl hover:bg-secondary/80 transition flex items-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {regions.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 bg-primary/5 border border-primary/20 text-primary px-2.5 py-1 rounded-full text-[11px] font-semibold"
              >
                {r}
                <button
                  type="button"
                  onClick={() => handleRemoveRegion(r)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {regions.length === 0 && (
              <span className="text-xs text-slate-400 italic">No regions assigned.</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !email}
          className="w-full mt-4 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-bold shadow-sm hover:opacity-90 disabled:opacity-50 transition"
        >
          {mutation.isPending ? "Assigning..." : "Assign Access"}
        </button>
      </form>
    </div>
  );
}
