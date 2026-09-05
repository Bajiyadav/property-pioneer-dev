import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { nativeApi } from "@/lib/api-client";
import {
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Calendar,
  IndianRupee,
  Phone,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/property-management/")({
  component: AdminPropertyManagementListPage,
});

const STATUS_PILLS: Record<string, { label: string; color: string }> = {
  SUBMITTED: {
    label: "Submitted",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  APPROVED: {
    label: "Approved",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  MANAGEMENT_ACTIVE: {
    label: "Active Managed",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-neutral-800 text-neutral-400 border-neutral-700",
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-400 border-red-500/30",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-neutral-800 text-neutral-400 border-neutral-700",
  },
};

function AdminPropertyManagementListPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-pm-stats"],
    queryFn: async () => {
      const res = await nativeApi.adminPropertyManagement.getStats();
      return (
        res.data || {
          totalRequests: 0,
          submittedCount: 0,
          underReviewCount: 0,
          approvedCount: 0,
          managementActiveCount: 0,
          completedCount: 0,
          rejectedCount: 0,
        }
      );
    },
  });

  const {
    data: listData,
    isLoading: listLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-pm-list", selectedStatus],
    queryFn: async () => {
      const res = await nativeApi.adminPropertyManagement.getAll(selectedStatus);
      return res.data?.content || [];
    },
  });

  const items = listData || [];
  const filtered = items.filter((item: any) => {
    const q = searchTerm.toLowerCase();
    const idMatch = item.id.toLowerCase().includes(q);
    const phoneMatch = (item.ownerContactPhone || "").includes(q);
    const mgrMatch = (item.assignedManagerName || "").toLowerCase().includes(q);
    const propMatch = item.propertyId.toLowerCase().includes(q);
    return !q || idMatch || phoneMatch || mgrMatch || propMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" /> Operations & Rental Management
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Property Management Requests
          </h1>
          <p className="text-neutral-400 text-xs mt-0.5">
            Manage owner submissions, assign dedicated property managers, track contract lifecycle,
            and record private internal audit notes.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by ID, phone, manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-1">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase">Total Requests</p>
          <p className="text-2xl font-extrabold text-white">{statsData?.totalRequests ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1">
          <p className="text-[11px] font-semibold text-amber-400 uppercase">Submitted</p>
          <p className="text-2xl font-extrabold text-amber-400">{statsData?.submittedCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-1">
          <p className="text-[11px] font-semibold text-blue-400 uppercase">Under Review</p>
          <p className="text-2xl font-extrabold text-blue-400">
            {statsData?.underReviewCount ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-1">
          <p className="text-[11px] font-semibold text-purple-400 uppercase">Active Managed</p>
          <p className="text-2xl font-extrabold text-purple-400">
            {statsData?.managementActiveCount ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1">
          <p className="text-[11px] font-semibold text-emerald-400 uppercase">Completed</p>
          <p className="text-2xl font-extrabold text-emerald-400">
            {statsData?.completedCount ?? 0}
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          "ALL",
          "SUBMITTED",
          "UNDER_REVIEW",
          "APPROVED",
          "MANAGEMENT_ACTIVE",
          "COMPLETED",
          "REJECTED",
        ].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
              selectedStatus === status
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800/80"
            }`}
          >
            {status === "ALL" ? "All Requests" : status.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
        {listLoading ? (
          <div className="p-12 text-center text-neutral-400 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-400" />
            <p className="text-xs">Loading management requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 space-y-2">
            <ShieldCheck className="h-8 w-8 mx-auto text-neutral-600" />
            <p className="text-sm font-semibold">No property management requests found.</p>
            <p className="text-xs text-neutral-500">
              {selectedStatus !== "ALL"
                ? `No requests with status "${selectedStatus}".`
                : "Owner submissions will appear here automatically."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900 border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Request ID</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Owner Phone</th>
                  <th className="px-4 py-3.5">Target Rent</th>
                  <th className="px-4 py-3.5">Assigned Manager</th>
                  <th className="px-4 py-3.5">Services</th>
                  <th className="px-4 py-3.5">Submitted</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {filtered.map((row: any) => {
                  const statusCfg = STATUS_PILLS[row.status] || STATUS_PILLS.SUBMITTED;

                  return (
                    <tr key={row.id} className="hover:bg-neutral-800/40 transition">
                      <td className="px-4 py-3 font-mono text-[11px] text-white">
                        <Link
                          to="/admin/property-management/$id"
                          params={{ id: row.id }}
                          className="hover:text-emerald-400 underline-offset-2 hover:underline"
                        >
                          {row.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${statusCfg.color}`}
                        >
                          {statusCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{row.ownerContactPhone}</td>
                      <td className="px-4 py-3">
                        {row.monthlyRentTarget ? `₹${row.monthlyRentTarget.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        {row.assignedManagerName || (
                          <span className="text-neutral-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-neutral-400">
                          {row.servicesRequested?.length || 0} services
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="rounded-xl h-7 px-2.5 text-[11px] bg-neutral-900 border-neutral-700 hover:bg-neutral-800 hover:text-white"
                        >
                          <Link to="/admin/property-management/$id" params={{ id: row.id }}>
                            Manage <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
