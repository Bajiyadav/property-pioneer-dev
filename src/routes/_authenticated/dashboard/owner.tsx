import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  MessageSquare,
  BarChart3,
  Star,
  CreditCard,
  Settings,
  TrendingUp,
  Users,
  CheckCircle2,
  Phone,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { fetchProperties } from "@/lib/properties";
import { DashboardLayout, type NavItem } from "@/components/dashboard/DashboardLayout";
import { OwnerOnboardingModal } from "@/components/modals/OwnerOnboardingModal";

export const Route = createFileRoute("/_authenticated/dashboard/owner")({
  component: OwnerDashboardPage,
});

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Owner Dashboard", icon: LayoutDashboard },
  { id: "properties", label: "My Listings", icon: Building2, badge: "4 Active" },
  { id: "add", label: "Add New Property", icon: PlusCircle, badge: "FREE" },
  { id: "leads", label: "Tenant Leads", icon: MessageSquare, badge: "18 Leads" },
  { id: "analytics", label: "Listing Analytics", icon: BarChart3 },
  { id: "subscription", label: "Zero Brokerage Plan", icon: Star, badge: "PRO" },
  { id: "payments", label: "Rent Collect", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];

function OwnerDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddWizard, setShowAddWizard] = useState(false);

  const { data: properties = [] } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  const ownerListings = properties.slice(0, 4);

  return (
    <DashboardLayout
      role="owner"
      title="Property Owner Control Panel"
      subtitle="Manage your 0% brokerage listings, tenant leads, walkthroughs, and monthly rent collections."
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={(tab) => {
        if (tab === "add") {
          setShowAddWizard(true);
        } else {
          setActiveTab(tab);
        }
      }}
    >
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Revenue & Listing Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard title="Active Listings" value="4" icon={<Building2 className="h-5 w-5 text-emerald-500" />} note="100% Verified Direct" />
            <StatCard title="Total Tenant Leads" value="18" icon={<Users className="h-5 w-5 text-blue-500" />} note="+5 new this week" />
            <StatCard title="Est. Monthly Rent" value="₹1,45,000" icon={<TrendingUp className="h-5 w-5 text-purple-500" />} note="0% Commission paid" />
            <StatCard title="Avg Response Time" value="12 mins" icon={<CheckCircle2 className="h-5 w-5 text-amber-500" />} note="Top 5% Owner Badge" />
          </div>

          {/* Add Property Banner CTA */}
          <div className="rounded-3xl border border-emerald-600/30 bg-emerald-600/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                🚀 List Another Property 100% Free
              </span>
              <h2 className="mt-2 text-xl font-extrabold text-foreground">Have another flat or villa in Hyderabad?</h2>
              <p className="mt-1 text-xs text-muted-foreground">Post your property in 2 minutes and get inquiries directly from verified tenants without brokers.</p>
            </div>
            <button
              onClick={() => setShowAddWizard(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-emerald-500"
            >
              <PlusCircle className="h-4 w-4" /> Add Property FREE
            </button>
          </div>

          {/* Active Listings Table */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">Your Active Hyderabad Listings ({ownerListings.length})</h2>
            <div className="divide-y divide-border/40">
              {ownerListings.map((p) => (
                <div key={p.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={p.images[0]} alt="" className="h-14 w-20 rounded-xl object-cover flex-none bg-muted" />
                    <div>
                      <h3 className="text-xs font-bold text-foreground">{p.title}</h3>
                      <p className="text-[11px] text-muted-foreground">{p.address}, {p.city}</p>
                      <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{p.price.toLocaleString("en-IN")}/mo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      ● Active & Live
                    </span>
                    <div className="flex items-center gap-1">
                      <button className="p-2 rounded-xl border border-border bg-secondary/50 text-foreground hover:bg-secondary">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-2 rounded-xl border border-border bg-secondary/50 text-foreground hover:bg-secondary">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "properties" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Your Listed Properties ({ownerListings.length})</h2>
            <button
              onClick={() => setShowAddWizard(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              <PlusCircle className="h-4 w-4" /> Add Property
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ownerListings.map((p) => (
              <div key={p.id} className="rounded-3xl border border-border/50 bg-card p-4 shadow-sm">
                <img src={p.images[0]} alt="" className="h-40 w-full rounded-2xl object-cover" />
                <h3 className="mt-3 text-sm font-bold text-foreground">{p.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{p.city}</p>
                <p className="mt-2 text-sm font-extrabold text-emerald-600">₹{p.price.toLocaleString("en-IN")}/mo</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "leads" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Tenant Lead Enquiries (18)</h2>
          <div className="space-y-3">
            <LeadRow name="Rahul Sharma" phone="+91 98765 43210" property="Luxury 2BHK Gachibowli" date="10 mins ago" status="High Intent" />
            <LeadRow name="Priya Varma" phone="+91 91234 56789" property="Modern Studio Financial District" date="1 hour ago" status="Scheduled Visit" />
            <LeadRow name="Vikram Roy" phone="+91 99887 76655" property="3BHK Villa Kondapur" date="3 hours ago" status="Agreement Generated" />
          </div>
        </div>
      )}

      <OwnerOnboardingModal isOpen={showAddWizard} onClose={() => setShowAddWizard(false)} />
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

function LeadRow({ name, phone, property, date, status }: { name: string; phone: string; property: string; date: string; status: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 flex items-center justify-between gap-4">
      <div>
        <h4 className="text-xs font-bold text-foreground">{name}</h4>
        <p className="text-[11px] text-muted-foreground">{property} • {phone}</p>
        <span className="text-[10px] text-muted-foreground mt-0.5 block">{date}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          {status}
        </span>
        <button className="p-2 rounded-xl bg-emerald-600 text-white">
          <Phone className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
