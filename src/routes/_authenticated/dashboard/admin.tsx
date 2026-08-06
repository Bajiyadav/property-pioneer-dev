import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  CheckSquare,
  FileBarChart,
  BarChart3,
  DollarSign,
  FileText,
  Settings,
  ShieldAlert,
  BadgeCheck,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { DashboardLayout, type NavItem } from "@/components/dashboard/DashboardLayout";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  component: AdminDashboardPage,
});

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Admin Overview", icon: LayoutDashboard },
  { id: "users", label: "User Directory", icon: Users, badge: "1,240" },
  { id: "properties", label: "All Properties", icon: Building2, badge: "482" },
  { id: "approvals", label: "Pending Approvals", icon: CheckSquare, badge: "6 Pending" },
  { id: "reports", label: "Platform Reports", icon: FileBarChart },
  { id: "analytics", label: "Growth Analytics", icon: BarChart3 },
  { id: "revenue", label: "Revenue & Finance", icon: DollarSign },
  { id: "audit", label: "Audit Logs", icon: FileText },
  { id: "settings", label: "Platform Settings", icon: Settings },
];

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <DashboardLayout
      role="admin"
      title="Platform Admin HQ"
      subtitle="Manage pan-India platform operations, owner listing approvals, user roles, security audits, and growth metrics."
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Admin Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard title="Registered Users" value="1,240" icon={<Users className="h-5 w-5 text-blue-500" />} note="840 Tenants, 400 Owners" />
            <StatCard title="Total Properties" value="482" icon={<Building2 className="h-5 w-5 text-emerald-500" />} note="Hyderabad Core MVP" />
            <StatCard title="Pending Approvals" value="6" icon={<CheckSquare className="h-5 w-5 text-amber-500" />} note="Requires Owner ID verification" />
            <StatCard title="Gross GMV" value="₹1.42 Cr" icon={<DollarSign className="h-5 w-5 text-purple-500" />} note="0% Brokerage Saved: ₹28L" />
          </div>

          {/* Pending Verification Queue */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Pending Owner Verification Queue</h2>
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                6 Awaiting Review
              </span>
            </div>

            <div className="space-y-3">
              <ApprovalRow owner="Venkatesh Rao" title="4BHK Luxury Flat in Hitech City" city="Hyderabad" date="15 mins ago" />
              <ApprovalRow owner="Srilatha Reddy" title="Studio Flat near Durgam Cheruvu Metro" city="Hyderabad" date="45 mins ago" />
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">User Management Directory</h2>
          <div className="rounded-3xl border border-border/50 bg-card p-6">
            <div className="space-y-3">
              <UserRow name="Baji Yadav" email="admin@urbanproperties.in" role="SUPER ADMIN" status="Active" />
              <UserRow name="Suresh Kumar" email="suresh.k@gmail.com" role="PROPERTY OWNER" status="Verified" />
              <UserRow name="Pooja Sharma" email="pooja.renter@yahoo.com" role="TENANT / BUYER" status="Active" />
            </div>
          </div>
        </div>
      )}

      {activeTab === "approvals" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Pending Listing Approvals</h2>
          <div className="space-y-3">
            <ApprovalRow owner="Anil Varma" title="3BHK Gated Villa in Kondapur" city="Hyderabad" date="1 hour ago" />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, note }: { title: string; value: string; icon: React.ReactNode; note: string }) {
  return (
    <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{note}</p>
    </div>
  );
}

function ApprovalRow({ owner, title, city, date }: { owner: string; title: string; city: string; date: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h4 className="text-xs font-bold text-foreground">{title}</h4>
        <p className="text-[11px] text-muted-foreground">Owner: {owner} • {city} • {date}</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow">
          <CheckCircle2 className="h-3.5 w-3.5" /> Approve Listing
        </button>
        <button className="flex items-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400">
          <XCircle className="h-3.5 w-3.5" /> Reject
        </button>
      </div>
    </div>
  );
}

function UserRow({ name, email, role, status }: { name: string; email: string; role: string; status: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-secondary/30 p-3.5 flex items-center justify-between">
      <div>
        <h4 className="text-xs font-bold text-foreground">{name}</h4>
        <p className="text-[11px] text-muted-foreground">{email}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-extrabold text-primary">
          {role}
        </span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
          ● {status}
        </span>
      </div>
    </div>
  );
}
