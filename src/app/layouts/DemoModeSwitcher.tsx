import { useState, useEffect } from "react";
import { Shield, User, Building, UserCheck, Sparkles, ChevronRight, Check } from "lucide-react";
import { getActiveRole, setActiveRole, getDashboardRoute, type UserRole } from "@/config/roles";

export function DemoModeSwitcher() {
  const [currentRole, setCurrentRole] = useState<UserRole>("customer");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCurrentRole(getActiveRole());
    const handleRoleChange = () => setCurrentRole(getActiveRole());
    window.addEventListener("demo_role_changed", handleRoleChange);
    return () => window.removeEventListener("demo_role_changed", handleRoleChange);
  }, []);

  // Never expose the role switcher in production builds
  if (!import.meta.env.DEV) return null;

  // Demo bar is visible in dev mode or demo state
  const roles: { role: UserRole; label: string; icon: React.ElementType; color: string }[] = [
    { role: "customer", label: "Customer", icon: User, color: "text-blue-500 bg-blue-500/10" },
    {
      role: "owner",
      label: "Property Owner",
      icon: Building,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      role: "agent",
      label: "Real Estate Agent",
      icon: UserCheck,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      role: "admin",
      label: "Platform Admin",
      icon: Shield,
      color: "text-amber-500 bg-amber-500/10",
    },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <div className="relative">
        {isOpen && (
          <div className="absolute bottom-12 right-0 mb-2 w-64 rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Client Demo Switcher
              </span>
              <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                DEV MODE
              </span>
            </div>

            <div className="mt-1 space-y-1">
              {roles.map(({ role, label, icon: Icon, color }) => {
                const isSelected = currentRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => {
                      setActiveRole(role);
                      setIsOpen(false);
                      window.location.href = getDashboardRoute(role);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`grid h-6 w-6 place-items-center rounded-lg ${isSelected ? "bg-white/20 text-white" : color}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span>{label}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-primary/40 bg-card/90 px-4 py-2.5 text-xs font-bold text-foreground shadow-xl backdrop-blur-md transition hover:scale-105 hover:border-primary hover:bg-card"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>
            Demo Role: <span className="capitalize text-primary">{currentRole}</span>
          </span>
          <ChevronRight
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}
