import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { BrandMark } from "@/components/branding/BrandMark";
import { CustomErrorBoundary } from "@/components/feedback/CustomErrorBoundary";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getDashboardRoute } from "@/config/roles";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGuard,
  errorComponent: CustomErrorBoundary,
});

/**
 * Gate for every signed-in area.
 *
 * Enforces authentication globally for /_authenticated/*, and verifies
 * role authorization before any protected admin route renders.
 * Non-admin users attempting to access /admin or /dashboard/admin are
 * immediately redirected to their own role-specific dashboard.
 */
function AuthGuard() {
  const navigate = useNavigate();
  const { status, role, roleVerified } = useAuthSession();
  const { href, pathname } = useRouterState({
    select: (s) => ({ href: s.location.href, pathname: s.location.pathname }),
  });

  // Held in a ref so moving between dashboard tabs doesn't re-run the effect.
  const hrefRef = useRef(href);
  hrefRef.current = href;

  const isAdminRoute = pathname.startsWith("/admin") || pathname === "/dashboard/admin";

  useEffect(() => {
    if (status === "guest") {
      navigate({ to: "/auth", search: { redirect: hrefRef.current }, replace: true });
      return;
    }

    if (status === "authenticated" && roleVerified && isAdminRoute && role !== "admin") {
      navigate({
        to: getDashboardRoute(role),
        search: { tab: "overview" },
        replace: true,
      });
    }
  }, [status, role, roleVerified, isAdminRoute, navigate]);

  if (status !== "authenticated" || (isAdminRoute && !roleVerified)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <BrandMark size="md" className="justify-center" />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs font-semibold text-muted-foreground">
          {status === "guest"
            ? "Redirecting to sign in…"
            : isAdminRoute
              ? "Verifying administrative authorization…"
              : "Verifying your session…"}
        </p>
      </div>
    );
  }

  if (isAdminRoute && role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <BrandMark size="md" className="justify-center" />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs font-semibold text-muted-foreground">
          Redirecting to your dashboard…
        </p>
      </div>
    );
  }

  return <Outlet />;
}
