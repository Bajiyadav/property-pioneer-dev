import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { BrandMark } from "@/shared/components/BrandMark";
import { getDashboardRoute, type UserRole } from "@/config/roles";
import { useAuthSession, type UseAuthSession } from "@/hooks/useAuthSession";

const ROLE_LABEL: Record<UserRole, string> = {
  customer: "Tenant & Buyer",
  owner: "Property Owner",
  agent: "Partner Agent",
  admin: "Platform Admin",
};

function getPrimaryRoleLabel(role: UserRole | UserRole[]): string {
  const primary = Array.isArray(role) ? role[0] : role;
  return ROLE_LABEL[primary];
}

/**
 * Authorization boundary for a single dashboard.
 *
 * Each role may open only its own dashboard: a mismatch redirects to the
 * caller's own dashboard instead of showing another role's data. The admin
 * role is only ever granted by the `user_roles` table, never by client state.
 */
export function RequireRole({
  role,
  children,
}: {
  role: UserRole | UserRole[];
  children: (session: UseAuthSession) => React.ReactNode;
}) {
  const session = useAuthSession();
  const navigate = useNavigate();
  const { status, role: actualRole, roleVerified } = session;

  const allowed = Array.isArray(role) ? role.includes(actualRole) : actualRole === role;

  useEffect(() => {
    // Wait for the authoritative role lookup before redirecting — otherwise the
    // optimistic default ("customer") would bounce owners off their own page.
    if (status !== "authenticated" || !roleVerified || allowed) return;
    const timer = setTimeout(() => {
      navigate({
        to: getDashboardRoute(actualRole),
        search: { tab: "overview" },
        replace: true,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [status, roleVerified, allowed, actualRole, navigate]);

  if (status !== "authenticated" || !roleVerified) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <BrandMark size="md" className="justify-center" />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs font-semibold text-muted-foreground">Checking your access…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="max-w-md space-y-4">
          <BrandMark size="md" className="justify-center" />
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">
            This is the {getPrimaryRoleLabel(role)} area
          </h1>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Your account is signed in as{" "}
            <strong className="text-foreground">{ROLE_LABEL[actualRole]}</strong>. Taking you to
            your own dashboard…
          </p>
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return <>{children(session)}</>;
}
