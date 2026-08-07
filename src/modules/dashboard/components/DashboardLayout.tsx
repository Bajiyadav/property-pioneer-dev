import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { ChevronLeft, ChevronRight, Menu, X, LogOut, Home, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { type UserRole } from "@/config/roles";
import { BrandMark } from "@/components/BrandMark";
import { Breadcrumbs } from "@/modules/dashboard/components/DashboardKit";
import { displayName, initialsFor } from "@/lib/auth-session";
import { supabase } from "@/integrations/supabase/client";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const ROLE_META: Record<UserRole, { name: string; color: string; avatar: string }> = {
  customer: {
    name: "Tenant & Buyer Portal",
    color: "bg-blue-600/10 text-blue-600 dark:text-blue-400",
    avatar: "bg-blue-600",
  },
  owner: {
    name: "Verified Owner Portal",
    color: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400",
    avatar: "bg-emerald-600",
  },
  agent: {
    name: "Partner Agent Hub",
    color: "bg-purple-600/10 text-purple-600 dark:text-purple-400",
    avatar: "bg-purple-600",
  },
  admin: {
    name: "Platform Admin HQ",
    color: "bg-amber-600/10 text-amber-600 dark:text-amber-400",
    avatar: "bg-amber-600",
  },
};

export function DashboardLayout({
  role,
  title,
  subtitle,
  navItems,
  activeTab,
  onTabChange,
  user,
  headerAction,
  children,
}: {
  role: UserRole;
  title: string;
  subtitle: string;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  user?: User | null;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();

  const meta = ROLE_META[role];
  const activeLabel = navItems.find((n) => n.id === activeTab)?.label ?? "Overview";

  // Close the mobile drawer whenever the panel changes.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed out successfully");
    navigate({ to: "/", replace: true });
  };

  const sidebarInner = (
    <>
      <div className="flex items-center justify-between border-b border-border/40 p-4">
        {!collapsed && <BrandMark responsiveName />}
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden h-8 w-8 place-items-center rounded-xl border border-border bg-secondary/60 text-muted-foreground transition hover:text-foreground md:grid"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Signed-in identity */}
      <div className={`border-b border-border/30 p-4 ${collapsed ? "flex justify-center" : ""}`}>
        <div className="flex items-center gap-3">
          <div
            className={`grid h-9 w-9 flex-none place-items-center rounded-full text-xs font-black text-white ${meta.avatar}`}
          >
            {initialsFor(user ?? null, role)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-foreground">
                {displayName(user ?? null)}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">{user?.email ?? "—"}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <span
            className={`mt-3 block rounded-xl px-3 py-1.5 text-center text-[10px] font-extrabold uppercase tracking-wider ${meta.color}`}
          >
            ● {meta.name}
          </span>
        )}
      </div>

      <nav aria-label="Dashboard sections" className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-semibold transition ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 flex-none" />
              {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
              {!collapsed && item.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-border/40 p-3">
        <Link
          to="/"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/50 py-2.5 text-xs font-bold text-foreground transition hover:bg-secondary"
        >
          <Home className="h-3.5 w-3.5" />
          {!collapsed && "Public site"}
        </Link>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/5 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-400"
        >
          <LogOut className="h-3.5 w-3.5" />
          {!collapsed && (signingOut ? "Signing out…" : "Sign out")}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border/40 bg-card p-4 md:hidden">
        <BrandMark size="sm" />
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          className="rounded-xl border border-border bg-secondary p-2 text-foreground"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen flex-col border-r border-border/40 bg-card/95 backdrop-blur-xl transition-all duration-300 md:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarInner}
      </aside>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border/40 bg-card shadow-2xl md:hidden">
            {sidebarInner}
          </aside>
        </>
      )}

      {/* Main column */}
      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-8">
        <header className="mb-8 border-b border-border/40 pb-6">
          <Breadcrumbs trail={[meta.name, activeLabel]} />
          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
            </div>
            <div className="flex flex-none flex-wrap items-center gap-3">
              {headerAction}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Live
              </span>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
