import { createFileRoute, Outlet, useNavigate as useNav } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { checkEmployeeAccess } from "@/modules/admin/services/adminFunctions";
import {
  LayoutDashboard,
  Shield,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  ArrowLeft,
  LogOut,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuthSession } from "@/hooks/useAuthSession";
import { AdminMfaSecurityModal } from "@/modules/admin/components/AdminMfaSecurityModal";

/**
 * Access is checked in the component, not in `beforeLoad`.
 *
 * `beforeLoad` runs during SSR, where the Supabase bearer token is attached by
 * a *client* middleware and so is absent — `checkEmployeeAccess()` threw
 * "no authorization header" and the whole document 500'd for every admin.
 * Skipping it on the server does not help either, because `beforeLoad` does not
 * re-run on hydration, which would leave the portal ungated.
 *
 * Checking on the client keeps the gate real: nothing but a loading state
 * renders until the answer arrives, and every server function behind these
 * pages runs its own `assertEmployee`, so the data is guarded independently of
 * this component.
 */
export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminGate,
});

function AdminGate() {
  const check = useServerFn(checkEmployeeAccess);
  const navigate = useNav();
  const { data, isPending, isError } = useQuery({
    queryKey: ["admin", "employee-access"],
    queryFn: () => check({}),
    retry: false,
  });

  const denied = !isPending && (isError || !data?.access);

  useEffect(() => {
    if (denied) navigate({ to: "/", replace: true });
  }, [denied, navigate]);

  if (isPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-950 text-neutral-400">
        <p className="text-xs font-semibold">Checking your access…</p>
      </div>
    );
  }

  if (denied || !data?.access) return null;

  return <AdminLayout access={data.access} />;
}

function AdminLayout({ access }: { access: { role: string; regions: string[] } }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuthSession();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate({ to: "/auth", replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  const [mfaModalOpen, setMfaModalOpen] = useState(false);

  const regionsLabel =
    access.regions.length > 0
      ? access.regions.join(", ")
      : access.role === "admin"
        ? "Global (All Regions)"
        : "No Regions Assigned";

  const navigation = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Moderation Queue", href: "/admin/moderation", icon: Shield },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Activity", href: "/admin/activity", icon: Activity },
    ...(access.role === "admin"
      ? [{ name: "Access Control", href: "/admin/access", icon: Settings }]
      : []),
  ];

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900 border-r border-neutral-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-800">
            <span className="text-lg font-bold text-white tracking-tight">Admin Portal</span>
            <button className="lg:hidden p-2" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-neutral-800 space-y-2">
            <div>
              <div className="text-xs text-neutral-400 uppercase font-semibold">Role</div>
              <div className="text-sm font-medium capitalize text-emerald-400">{access.role}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 uppercase font-semibold">Scope</div>
              <div className="text-sm font-medium text-neutral-300 truncate" title={regionsLabel}>
                {regionsLabel}
              </div>
            </div>
            <div className="pt-1">
              <div className="text-xs text-neutral-400 uppercase font-semibold mb-1">
                MFA Security
              </div>
              <button
                type="button"
                onClick={() => setMfaModalOpen(true)}
                className="inline-flex w-full items-center justify-between px-2.5 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 border border-neutral-700 transition"
              >
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Shield className="w-3.5 h-3.5" />
                  MFA Configured
                </span>
                <span className="text-[10px] text-neutral-400">Manage</span>
              </button>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors [&.active]:bg-neutral-800 [&.active]:text-white text-neutral-400 hover:bg-neutral-800 hover:text-white"
                activeProps={{ className: "active" }}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/*
            "Exit Admin" only returns to the public site — it does not end the
            session. Without a sign-out here the admin portal has no way out,
            which is the bug this restores for the second time; the previous
            admin shell lost it in the same way.
          */}
          <div className="p-4 border-t border-neutral-800 space-y-2">
            <Link
              to="/"
              className="flex items-center text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit Admin
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              data-testid="sidebar-signout"
              aria-label="Sign out"
              className="flex w-full items-center rounded-md px-0 py-1 text-sm font-medium text-rose-400 transition-colors hover:text-rose-300 disabled:opacity-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 lg:hidden">
          <button className="p-2 -ml-2 mr-2" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-neutral-400" />
          </button>
          <span className="font-semibold text-white truncate">Admin Portal</span>
        </header>

        <main className="flex-1 overflow-y-auto bg-neutral-950 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <AdminMfaSecurityModal isOpen={mfaModalOpen} onClose={() => setMfaModalOpen(false)} />
    </div>
  );
}
