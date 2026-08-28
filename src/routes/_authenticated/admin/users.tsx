import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminUsers, PlatformUser } from "@/modules/admin/services/adminFunctions";
import { useEmployeeAccess } from "@/modules/admin/hooks/useEmployeeAccess";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShieldCheck,
  Building,
  User,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPanel,
});

function UsersPanel() {
  const fetchAdminUsers = useServerFn(getAdminUsers);
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => fetchAdminUsers({}),
  });

  const access = useEmployeeAccess();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  if (access?.role !== "admin" && access?.role !== "ops") {
    return (
      <div className="p-8 text-center text-neutral-400">
        You do not have permission to view the user management panel.
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const nameMatch = (u.name || "").toLowerCase().includes(q);
    const emailMatch = (u.email || "").toLowerCase().includes(q);
    const phoneMatch = (u.phone || "").includes(q);
    const roleMatch = roleFilter === "all" || u.role.toLowerCase() === roleFilter.toLowerCase();
    return (!q || nameMatch || emailMatch || phoneMatch) && roleMatch;
  });

  const roleColors: Record<string, string> = {
    Admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Owner: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Agent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Customer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Registered Users ({users.length})
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Real registered platform accounts, contact numbers, and login timestamps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
            {["all", "owner", "customer", "admin"].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                  roleFilter === r
                    ? "bg-neutral-800 text-white shadow"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-neutral-400">Loading user directory...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No Users Found</h3>
          <p className="text-neutral-400 text-sm mt-1">
            Try adjusting your search keywords or role filter.
          </p>
        </div>
      ) : (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-neutral-950/60 border-b border-neutral-800 text-xs uppercase text-neutral-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">User Details</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Phone / WhatsApp</th>
                  <th className="px-6 py-4 font-semibold">Joined Date</th>
                  <th className="px-6 py-4 font-semibold">Last Active</th>
                  <th className="px-6 py-4 font-semibold text-right">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredUsers.map((user) => {
                  const purePhone = (user.phone || "").replace(/\D/g, "");
                  const whatsappNumber = purePhone.length === 10 ? `91${purePhone}` : purePhone;

                  return (
                    <tr key={user.id} className="hover:bg-neutral-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{user.name}</div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
                          <Mail className="h-3 w-3" />
                          <a
                            href={`mailto:${user.email}`}
                            className="hover:underline hover:text-neutral-200"
                          >
                            {user.email}
                          </a>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            roleColors[user.role] ||
                            "bg-neutral-800 text-neutral-300 border-neutral-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {user.phone && user.phone !== "Not provided" ? (
                          <span className="font-medium text-xs text-emerald-400">{user.phone}</span>
                        ) : (
                          <span className="text-xs text-neutral-500">Not provided</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-neutral-400">
                        {new Date(user.joined).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-6 py-4 text-xs text-neutral-400">
                        {user.lastSignIn ? (
                          new Date(user.lastSignIn).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        ) : (
                          <span className="text-neutral-500">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {purePhone && purePhone.length >= 10 && (
                            <a
                              href={`https://wa.me/${whatsappNumber}?text=Namaste%20${encodeURIComponent(user.name)}%2C%20welcome%20to%20Seedha%20Properties.`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-lg bg-emerald-600/20 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition"
                            >
                              WhatsApp
                            </a>
                          )}
                          {user.email && user.email !== "No email" && (
                            <a
                              href={`mailto:${user.email}`}
                              className="inline-flex items-center rounded-lg bg-neutral-800 px-2.5 py-1 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 transition"
                            >
                              Email
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
