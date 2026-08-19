import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  UserCircle,
  LayoutDashboard,
  Heart,
  Calendar,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Building2,
  BarChart3,
  Users,
  Shield,
  FileCheck,
  FileBarChart,
  ChevronDown,
  CheckCircle2,
  LogIn,
} from "lucide-react";
import { getDashboardRoute, type UserRole } from "@/config/roles";
import { useAuthSession } from "@/hooks/useAuthSession";
import { toast } from "sonner";

export function HeaderProfileMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Authoritative auth state & role from centralized AuthContext
  const { role, user, status, signOut } = useAuthSession();
  const dashboardPath = getDashboardRoute(role);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    toast.success("Signed out successfully");
    navigate({ to: "/auth", replace: true });
  };

  // If user is not authenticated, render a clean Sign In link
  if (status !== "authenticated" || !user) {
    return (
      <Link
        to="/auth"
        className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-border/80 bg-secondary/50 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:bg-secondary"
      >
        <LogIn className="h-3.5 w-3.5 text-primary" />
        <span>Sign In</span>
      </Link>
    );
  }

  const getInitials = () => {
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    if (role === "admin") return "AD";
    if (role === "owner") return "OW";
    if (role === "agent") return "AG";
    return "US";
  };

  const roleColors: Record<UserRole, string> = {
    customer: "bg-blue-600 text-white",
    owner: "bg-emerald-600 text-white",
    agent: "bg-purple-600 text-white",
    admin: "bg-amber-600 text-white",
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-border/80 bg-secondary/50 p-1 pr-3 transition hover:border-primary hover:bg-secondary focus:outline-none"
        aria-label="User profile menu"
      >
        <div
          className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${roleColors[role]}`}
        >
          {getInitials()}
        </div>
        <span className="hidden text-xs font-semibold capitalize text-foreground sm:inline-block">
          {role} Account
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-3xl border border-border/60 bg-card p-3 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95">
          {/* User Info Header */}
          <div className="flex items-center gap-3 border-b border-border/40 pb-3 px-3 pt-2">
            <div
              className={`grid h-10 w-10 place-items-center rounded-full text-sm font-extrabold ${roleColors[role]}`}
            >
              {getInitials()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-foreground truncate">
                {user.email || `Verified ${role.toUpperCase()} User`}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                <CheckCircle2 className="h-3 w-3" /> {role} Role Verified
              </span>
            </div>
          </div>

          {/* Quick Menu Items */}
          <div className="mt-2 space-y-1">
            <MenuItem
              to={dashboardPath}
              search={{ tab: "overview" }}
              icon={LayoutDashboard}
              label="My Dashboard"
              onClick={() => setOpen(false)}
            />
            <MenuItem
              to="/favorites"
              icon={Heart}
              label="Saved Properties"
              onClick={() => setOpen(false)}
            />
            <MenuItem
              to={dashboardPath}
              search={{ tab: "visits" }}
              icon={Calendar}
              label="My Visits"
              onClick={() => setOpen(false)}
            />
            <MenuItem
              to={dashboardPath}
              search={{ tab: "enquiries" }}
              icon={MessageSquare}
              label="My Enquiries"
              onClick={() => setOpen(false)}
            />

            {/* Role Specific Additions */}
            {(role === "owner" || role === "customer") && (
              <>
                <div className="my-1 border-t border-border/30" />
                <MenuItem
                  to="/dashboard/owner"
                  search={{ tab: "listings" }}
                  icon={Building2}
                  label="My Listings"
                  onClick={() => setOpen(false)}
                />
              </>
            )}

            {role === "agent" && (
              <>
                <div className="my-1 border-t border-border/30" />
                <MenuItem
                  to="/dashboard/agent"
                  search={{ tab: "clients" }}
                  icon={Users}
                  label="Assigned Leads"
                  onClick={() => setOpen(false)}
                />
                <MenuItem
                  to="/dashboard/agent"
                  search={{ tab: "commission" }}
                  icon={BarChart3}
                  label="Commission Tracker"
                  onClick={() => setOpen(false)}
                />
              </>
            )}

            {role === "admin" && (
              <>
                <div className="my-1 border-t border-border/30" />
                <MenuItem
                  to="/admin"
                  icon={Shield}
                  label="Admin Portal"
                  onClick={() => setOpen(false)}
                  highlight
                />
                <MenuItem
                  to="/dashboard/admin"
                  search={{ tab: "users" }}
                  icon={Users}
                  label="User Management"
                  onClick={() => setOpen(false)}
                />
                <MenuItem
                  to="/dashboard/admin"
                  search={{ tab: "approvals" }}
                  icon={FileCheck}
                  label="Pending Approvals"
                  onClick={() => setOpen(false)}
                />
                <MenuItem
                  to="/dashboard/admin"
                  search={{ tab: "reports" }}
                  icon={FileBarChart}
                  label="Platform Reports"
                  onClick={() => setOpen(false)}
                />
              </>
            )}

            <div className="my-1 border-t border-border/30" />
            <MenuItem
              to="/profile"
              icon={UserCircle}
              label="My Profile"
              onClick={() => setOpen(false)}
            />
            <MenuItem
              to="/notifications"
              icon={Bell}
              label="Notifications"
              onClick={() => setOpen(false)}
            />
            <MenuItem
              to={dashboardPath}
              search={{ tab: "settings" }}
              icon={Settings}
              label="Settings"
              onClick={() => setOpen(false)}
            />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition mt-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  to,
  search,
  icon: Icon,
  label,
  onClick,
  highlight = false,
}: {
  to: string;
  search?: Record<string, string>;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      search={search}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition ${
        highlight
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "text-foreground hover:bg-secondary"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}
