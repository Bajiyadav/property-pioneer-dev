import React, { useMemo } from "react";
import { useAdminPropertyStore } from "@/modules/admin/stores/adminPropertyStore";
import { ActivityAnalyticsPanel } from "@/modules/analytics/components/ActivityAnalyticsPanel";
import { TrendingUp, Clock, CheckCircle2, XCircle, Home } from "lucide-react";

export function DashboardAnalytics() {
  // Derived with useMemo from the raw slice, not inside the selector. A
  // selector that returns `.filter(...)` hands useSyncExternalStore a brand new
  // array every render, so the snapshot never compares equal and React loops
  // until "Maximum update depth exceeded" — which crashed this dashboard to the
  // error boundary and took the sign-out control down with it.
  const allProperties = useAdminPropertyStore((s) => s.properties);
  const pending = useMemo(
    () => allProperties.filter((p) => p.status === "pending"),
    [allProperties],
  );
  const active = useMemo(
    () => allProperties.filter((p) => p.status === "available"),
    [allProperties],
  );
  const rejected = useMemo(
    () => allProperties.filter((p) => p.status === "rejected"),
    [allProperties],
  );
  const expired = useMemo(
    () => allProperties.filter((p) => p.status === "archived"),
    [allProperties],
  );

  const total = pending.length + active.length + rejected.length + expired.length;

  const stats = [
    {
      label: "Total Properties",
      value: total,
      icon: Home,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending Approvals",
      value: pending.length,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Active Listings",
      value: active.length,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Rejected",
      value: rejected.length,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Platform metrics and property status summary.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${s.bg}`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div className="flex items-center text-sm font-medium text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12%
              </div>
            </div>
            <h3 className="text-3xl font-bold text-neutral-900 mb-1">{s.value}</h3>
            <p className="text-sm text-neutral-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm mt-8">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 italic">No recent activity to show.</p>
        </div>
      </div>

      {/* Visitor activity — distinct from the listing counts above. */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-extrabold text-foreground">Visitor activity</h2>
        <ActivityAnalyticsPanel />
      </div>
    </div>
  );
}
