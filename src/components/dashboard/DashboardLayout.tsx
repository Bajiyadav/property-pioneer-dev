import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Users,
  BarChart3,
  MessageSquare,
  Calendar,
  Bell,
  Settings,
  UserCircle,
  CreditCard,
  FileBarChart,
  LogOut,
  Search,
  CheckSquare,
  ShieldAlert,
  FileText,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Heart,
  Briefcase,
  Star,
  Banknote,
  CheckCircle2,
} from "lucide-react";
import { type UserRole } from "@/components/demo/DemoModeSwitcher";
import { BrandMark } from "@/components/BrandMark";

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
}

export function DashboardLayout({
  role,
  title,
  subtitle,
  navItems,
  activeTab,
  onTabChange,
  children,
}: {
  role: UserRole;
  title: string;
  subtitle: string;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roleLabels: Record<UserRole, { name: string; color: string }> = {
    customer: { name: "Tenant & Buyer Portal", color: "bg-blue-600/10 text-blue-600 dark:text-blue-400" },
    owner: { name: "Verified Owner Portal", color: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400" },
    agent: { name: "Partner Agent Hub", color: "bg-purple-600/10 text-purple-600 dark:text-purple-400" },
    admin: { name: "Platform Admin HQ", color: "bg-amber-600/10 text-amber-600 dark:text-amber-400" },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="flex md:hidden items-center justify-between border-b border-border/40 bg-card p-4">
        <BrandMark size="sm" />
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="rounded-xl border border-border bg-secondary p-2 text-foreground"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`sticky top-0 z-40 h-screen border-r border-border/40 bg-card/95 backdrop-blur-xl transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${mobileMenuOpen ? "fixed inset-y-0 left-0 w-64 flex flex-col" : "hidden md:flex md:flex-col"}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          {!collapsed && <BrandMark responsiveName />}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="hidden md:grid h-8 w-8 place-items-center rounded-xl border border-border bg-secondary/60 text-muted-foreground hover:text-foreground transition"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Role Badge */}
        {!collapsed && (
          <div className="p-4 border-b border-border/30">
            <span className={`rounded-xl px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider block text-center ${roleLabels[role].color}`}>
              ● {roleLabels[role].name}
            </span>
          </div>
        )}

        {/* Sidebar Nav Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-semibold transition ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 flex-none" />
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border/40">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/50 py-2.5 text-xs font-bold text-foreground transition hover:bg-secondary"
          >
            ← {!collapsed && "Return to Public App"}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-extrabold text-foreground">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-600/10 px-3.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Live Sync Active
            </span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
