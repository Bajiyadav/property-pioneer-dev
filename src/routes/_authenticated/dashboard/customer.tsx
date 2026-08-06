import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard,
  Search,
  Heart,
  Calendar,
  MessageSquare,
  Bell,
  Settings,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  FileText,
  User,
  ArrowRight,
  Shield,
} from "lucide-react";
import { fetchProperties } from "@/lib/properties";
import { useFavorites } from "@/lib/useFavorites";
import { PropertyCard } from "@/components/PropertyCard";
import { DashboardLayout, type NavItem } from "@/components/dashboard/DashboardLayout";

export const Route = createFileRoute("/_authenticated/dashboard/customer")({
  component: CustomerDashboardPage,
});

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
  { id: "saved", label: "Saved Properties", icon: Heart, badge: "Favorites" },
  { id: "visits", label: "Scheduled Visits", icon: Calendar, badge: "2 Upcoming" },
  { id: "enquiries", label: "My Enquiries", icon: MessageSquare, badge: "3 Sent" },
  { id: "notifications", label: "Notifications", icon: Bell, badge: "1 New" },
  { id: "settings", label: "Settings", icon: Settings },
];

function CustomerDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { ids } = useFavorites();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  const savedHomes = properties.filter((p) => ids.includes(p.id));

  return (
    <DashboardLayout
      role="customer"
      title="Tenant & Buyer Dashboard"
      subtitle="Track your saved homes, scheduled visits, digital agreements, and property enquiries."
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricCard title="Saved Properties" value={savedHomes.length} icon={<Heart className="h-5 w-5 text-rose-500" />} />
            <MetricCard title="Scheduled Visits" value="2" icon={<Calendar className="h-5 w-5 text-blue-500" />} note="1 In-Person, 1 Video" />
            <MetricCard title="Active Enquiries" value="3" icon={<MessageSquare className="h-5 w-5 text-purple-500" />} note="Owner Response < 15m" />
            <MetricCard title="Digital Agreements" value="1" icon={<FileText className="h-5 w-5 text-emerald-500" />} note="Telangana E-Stamp" />
          </div>

          {/* Quick Action Banner */}
          <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wide">
                ✨ Hyderabad Search Assistant
              </span>
              <h2 className="mt-2 text-xl font-extrabold text-foreground">Find 0% Brokerage Homes in Gachibowli & Madhapur</h2>
              <p className="mt-1 text-xs text-muted-foreground">Explore 4,500+ verified listings directly from property owners.</p>
            </div>
            <Link
              to="/properties"
              search={{ q: "Hyderabad", city: "Hyderabad", listing: "rent", minPrice: 0, maxPrice: 0, beds: 0 }}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-md transition hover:brightness-110"
            >
              <Search className="h-4 w-4" /> Browse Hyderabad Homes
            </Link>
          </div>

          {/* Saved Homes Quick Preview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Your Saved Favorites ({savedHomes.length})</h2>
              <button onClick={() => setActiveTab("saved")} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {savedHomes.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/80 bg-card p-8 text-center">
                <Heart className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-bold text-foreground">No saved homes yet</p>
                <p className="text-xs text-muted-foreground mt-1">Click the heart icon on any property card to save it for later.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {savedHomes.slice(0, 3).map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "saved" && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">All Saved Properties ({savedHomes.length})</h2>
          {savedHomes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center">
              <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-base font-bold text-foreground">Your favorites list is empty</p>
              <p className="text-xs text-muted-foreground mt-1">Browse properties in Hyderabad to save your preferred listings.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {savedHomes.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "visits" && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">Your Scheduled Walkthrough Visits</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <VisitCard title="Luxury 2BHK Apartment in Gachibowli" date="Tomorrow, 10:00 AM" type="In-Person Walkthrough" owner="Suresh Reddy" status="Confirmed" />
            <VisitCard title="Modern Studio Flat near Financial District" date="Friday, 02:00 PM" type="Live Video Tour" owner="Anitha Rao" status="Scheduled" />
          </div>
        </div>
      )}

      {activeTab === "enquiries" && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">Sent Property Enquiries</h2>
          <div className="space-y-3">
            <EnquiryRow title="3BHK Gated Villa in Kondapur" date="2 hours ago" message="Hi, is this available for immediate move-in?" status="Owner Responded" />
            <EnquiryRow title="Fully Furnished 2BHK in Madhapur" date="Yesterday" message="Interested in scheduling a weekend visit." status="Pending Response" />
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Notifications & Alerts</h2>
          <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
            <Bell className="h-5 w-5 text-primary flex-none mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Price Drop Alert!</p>
              <p className="text-xs text-muted-foreground mt-0.5">2BHK in Gachibowli reduced rent by ₹2,000/mo.</p>
              <span className="text-[10px] text-muted-foreground">30 mins ago</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="rounded-3xl border border-border/50 bg-card p-6 max-w-xl">
          <h2 className="text-lg font-bold text-foreground">Account Settings</h2>
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block text-muted-foreground font-semibold mb-1">Full Name</label>
              <input type="text" defaultValue="Urban Renter" className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground" />
            </div>
            <div>
              <label className="block text-muted-foreground font-semibold mb-1">Email Address</label>
              <input type="email" defaultValue="renter@urbanproperties.in" className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground" />
            </div>
            <button className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground">Save Changes</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function MetricCard({ title, value, icon, note }: { title: string; value: React.ReactNode; icon: React.ReactNode; note?: string }) {
  return (
    <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
      {note && <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{note}</p>}
    </div>
  );
}

function VisitCard({ title, date, type, owner, status }: { title: string; date: string; type: string; owner: string; status: string }) {
  return (
    <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-emerald-600/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          ● {status}
        </span>
        <span className="text-xs text-muted-foreground font-medium">{type}</span>
      </div>
      <h3 className="mt-3 text-sm font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5 text-primary" /> {date}
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground border-t border-border/40 pt-2">
        Owner: <span className="font-semibold text-foreground">{owner}</span>
      </p>
    </div>
  );
}

function EnquiryRow({ title, date, message, status }: { title: string; date: string; message: string; status: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 flex items-center justify-between gap-4">
      <div>
        <h4 className="text-xs font-bold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">"{message}"</p>
        <span className="text-[10px] text-muted-foreground mt-1 block">{date}</span>
      </div>
      <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary flex-none">
        {status}
      </span>
    </div>
  );
}
