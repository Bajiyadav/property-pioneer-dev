import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminVisitors, SiteVisitorRecord } from "@/modules/admin/services/adminFunctions";
import {
  Globe,
  Search,
  MapPin,
  Laptop,
  Smartphone,
  UserCheck,
  User,
  Clock,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/visitors")({
  component: AdminVisitorsPage,
});

function AdminVisitorsPage() {
  const fetchVisitors = useServerFn(getAdminVisitors);
  const { data: visitors = [], isLoading } = useQuery({
    queryKey: ["admin", "visitors"],
    queryFn: () => fetchVisitors({}),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "signed-in" | "guests">("all");

  const filteredVisitors = visitors.filter((v) => {
    const q = searchTerm.toLowerCase();
    const locMatch = `${v.city || ""} ${v.region || ""} ${v.country || ""}`
      .toLowerCase()
      .includes(q);
    const ipMatch = (v.ip_address || "").includes(q);
    const userMatch = (v.user_name || "").toLowerCase().includes(q);
    const emailMatch = (v.user_email || "").toLowerCase().includes(q);

    const matchesSearch = !q || locMatch || ipMatch || userMatch || emailMatch;

    if (filterType === "signed-in") {
      return matchesSearch && Boolean(v.user_id || v.user_email);
    }
    if (filterType === "guests") {
      return matchesSearch && !v.user_id && !v.user_email;
    }
    return matchesSearch;
  });

  const signedInCount = visitors.filter((v) => Boolean(v.user_id || v.user_email)).length;
  const guestCount = visitors.length - signedInCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Website Visitors & Traffic ({visitors.length})
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Real-time audit log of visitors, geographic locations, devices, and signed-in accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by city, email, IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === "all"
                  ? "bg-neutral-800 text-white shadow"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              All ({visitors.length})
            </button>
            <button
              onClick={() => setFilterType("signed-in")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === "signed-in"
                  ? "bg-neutral-800 text-emerald-400 shadow"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Signed-in ({signedInCount})
            </button>
            <button
              onClick={() => setFilterType("guests")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === "guests"
                  ? "bg-neutral-800 text-white shadow"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Guests ({guestCount})
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-neutral-400">Loading website visitors...</div>
      ) : filteredVisitors.length === 0 ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-12 text-center">
          <Globe className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No Visitors Found</h3>
          <p className="text-neutral-400 text-sm mt-1">
            Try adjusting your search keywords or filter.
          </p>
        </div>
      ) : (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-neutral-950/60 border-b border-neutral-800 text-xs uppercase text-neutral-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Visitor Identity</th>
                  <th className="px-6 py-4 font-semibold">Location</th>
                  <th className="px-6 py-4 font-semibold">IP Address</th>
                  <th className="px-6 py-4 font-semibold">Platform</th>
                  <th className="px-6 py-4 font-semibold text-right">Visited At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredVisitors.map((v) => {
                  const isAuthed = Boolean(v.user_id || v.user_email);
                  const locationParts = [v.city, v.region, v.country].filter(Boolean);
                  const locationStr =
                    locationParts.length > 0 ? locationParts.join(", ") : "Unknown Location";

                  return (
                    <tr key={v.id} className="hover:bg-neutral-800/40 transition">
                      <td className="px-6 py-4">
                        {isAuthed ? (
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                              <UserCheck className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">
                                {v.user_name || "Signed-in User"}
                                {v.user_role && (
                                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase font-bold">
                                    {v.user_role}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-neutral-400">
                                {v.user_email || "Email verified"}
                              </div>
                              {v.user_phone && (
                                <div className="text-xs text-emerald-400 mt-0.5">
                                  {v.user_phone}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-neutral-400 text-xs">
                            <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-500">
                              <User className="h-4 w-4" />
                            </div>
                            <span>Anonymous Visitor</span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-200">
                          <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                          <span>{locationStr}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-neutral-400">
                        {v.ip_address || "Hidden"}
                      </td>

                      <td className="px-6 py-4 text-xs text-neutral-400">{v.platform || "Web"}</td>

                      <td className="px-6 py-4 text-right text-xs text-neutral-400">
                        <div className="flex items-center justify-end gap-1 text-xs">
                          <Clock className="h-3 w-3 text-neutral-500" />
                          <span>
                            {new Date(v.visited_at).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
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
