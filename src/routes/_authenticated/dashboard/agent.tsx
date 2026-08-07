import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  Building2,
  Phone,
  Calendar,
  Settings,
  DollarSign,
} from "lucide-react";
import { DashboardLayout, type NavItem } from "@/components/dashboard/DashboardLayout";
import { DashboardPlaceholder } from "@/components/dashboard/DashboardPlaceholder";

/** Tabs with a real panel below; everything else shows the placeholder. */
const IMPLEMENTED_TABS = ["overview", "clients", "commission"];

export const Route = createFileRoute("/_authenticated/dashboard/agent")({
  component: AgentDashboardPage,
});

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Agent Hub Overview", icon: LayoutDashboard },
  { id: "clients", label: "Client CRM Pipeline", icon: Users, badge: "34 Clients" },
  { id: "listings", label: "Managed Listings", icon: Building2, badge: "12 Properties" },
  { id: "leads", label: "Property Leads", icon: Phone, badge: "8 New" },
  { id: "commission", label: "Commission Tracker", icon: DollarSign, badge: "₹84,500" },
  { id: "appointments", label: "Appointments", icon: Calendar, badge: "4 Today" },
  { id: "settings", label: "Settings", icon: Settings },
];

function AgentDashboardPage() {
  const { tab: activeTab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const setActiveTab = (id: string) => navigate({ search: { tab: id }, replace: true });

  return (
    <DashboardLayout
      role="agent"
      title="Partner Agent Hub"
      subtitle="Manage your buyer & tenant clients, property listings, walkthrough schedules, and commission payouts."
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              title="Active Clients"
              value="34"
              icon={<Users className="h-5 w-5 text-purple-500" />}
              note="12 Buyers, 22 Tenants"
            />
            <StatCard
              title="Managed Listings"
              value="12"
              icon={<Building2 className="h-5 w-5 text-blue-500" />}
              note="Gachibowli & Hitech City"
            />
            <StatCard
              title="Monthly Commission"
              value="₹84,500"
              icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
              note="Payout date: 10th Aug"
            />
            <StatCard
              title="Today's Visits"
              value="4"
              icon={<Calendar className="h-5 w-5 text-amber-500" />}
              note="All confirmed"
            />
          </div>

          {/* Client Pipeline Overview */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Client Pipeline & Lead Status
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <PipelineColumn
                stage="Lead Inquiries"
                count={8}
                color="border-blue-500/40 bg-blue-500/5 text-blue-600"
              />
              <PipelineColumn
                stage="Site Visits Scheduled"
                count={5}
                color="border-purple-500/40 bg-purple-500/5 text-purple-600"
              />
              <PipelineColumn
                stage="Agreement & Move-In"
                count={3}
                color="border-emerald-500/40 bg-emerald-500/5 text-emerald-600"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "clients" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Client CRM Pipeline (34)</h2>
          <div className="space-y-3">
            <ClientRow
              name="Kavitha Reddy"
              budget="₹45,000/mo"
              requirement="3BHK Gachibowli"
              stage="Visited"
              agent="Partner Agent"
            />
            <ClientRow
              name="Arjun Kapoor"
              budget="₹28,000/mo"
              requirement="2BHK Madhapur"
              stage="Negotiation"
              agent="Partner Agent"
            />
          </div>
        </div>
      )}

      {activeTab === "commission" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-emerald-600/30 bg-emerald-600/5 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                Total Earned This Month
              </span>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                ₹84,500 INR
              </p>
            </div>
            <button
              onClick={() =>
                toast.success(
                  "Payout request submitted! Amount will be credited within 2–3 business days.",
                )
              }
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow"
            >
              Request Bank Payout
            </button>
          </div>
        </div>
      )}

      {!IMPLEMENTED_TABS.includes(activeTab) && (
        <DashboardPlaceholder
          navItems={NAV_ITEMS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  icon,
  note,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  note: string;
}) {
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

function PipelineColumn({ stage, count, color }: { stage: string; count: number; color: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${color}`}>
      <span className="text-xs font-bold uppercase tracking-wider block">{stage}</span>
      <p className="mt-2 text-3xl font-black">{count}</p>
    </div>
  );
}

function ClientRow({
  name,
  budget,
  requirement,
  stage,
  agent,
}: {
  name: string;
  budget: string;
  requirement: string;
  stage: string;
  agent: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 flex items-center justify-between">
      <div>
        <h4 className="text-xs font-bold text-foreground">{name}</h4>
        <p className="text-[11px] text-muted-foreground">
          {requirement} • Budget: {budget} • {agent}
        </p>
      </div>
      <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
        {stage}
      </span>
    </div>
  );
}
