import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, PlusCircle, User } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";

export function MobileBottomNav() {
  const { status } = useAuthSession();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-md px-2 py-1.5 shadow-2xl safe-area-pb"
    >
      <div className="grid grid-cols-4 items-center text-center">
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center py-1 transition active:scale-95 ${
            isActive("/")
              ? "text-emerald-600 font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium">Home</span>
        </Link>

        {/* 2. Properties / Search */}
        <Link
          to="/properties"
          search={{ q: "", city: "", listing: "rent", minPrice: 0, maxPrice: 0, beds: 0 }}
          className={`flex flex-col items-center justify-center py-1 transition active:scale-95 ${
            isActive("/properties")
              ? "text-emerald-600 font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium">Properties</span>
        </Link>

        {/* 3. Post Property (Featured Plus Action) */}
        <Link
          to="/list-property"
          className="flex flex-col items-center justify-center py-0.5 text-white transition hover:brightness-110 active:scale-95"
        >
          <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-600 text-white shadow-md ring-2 ring-background">
            <PlusCircle className="h-5 w-5" />
          </div>
          <span className="text-[9px] mt-0.5 font-extrabold uppercase text-emerald-600">
            Post Property
          </span>
        </Link>

        {/* 4. Profile */}
        <Link
          to={status === "authenticated" ? "/profile" : "/auth"}
          className={`flex flex-col items-center justify-center py-1 transition active:scale-95 ${
            isActive("/profile") || isActive("/auth")
              ? "text-emerald-600 font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
