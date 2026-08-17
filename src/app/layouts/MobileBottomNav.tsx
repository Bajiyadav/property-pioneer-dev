import { Link, useNavigate } from "@tanstack/react-router";
import { Home, MapPin, Heart, PlusCircle, User, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getCurrentUserLocality } from "@/lib/geolocation";
import { logLiveActivity } from "@/lib/leadRouting";
import { useAuthSession } from "@/hooks/useAuthSession";

export function MobileBottomNav() {
  const navigate = useNavigate();
  const { status, role } = useAuthSession();
  const [locating, setLocating] = useState(false);

  const handleNearMe = async () => {
    setLocating(true);
    toast.info("Detecting your nearest locality...");

    const res = await getCurrentUserLocality();
    setLocating(false);

    if (res.locality) {
      toast.success(`Location detected: Near ${res.locality}!`);
      // Log geolocation activity
      await logLiveActivity({
        activity_type: "search",
        locality: res.locality,
        latitude: res.latitude,
        longitude: res.longitude,
        search_query: `Near Me Geolocation Search (${res.locality})`,
      });

      navigate({
        to: "/properties",
        search: {
          q: res.locality,
          city: "Hyderabad",
          listing: "rent",
          minPrice: 0,
          maxPrice: 0,
          beds: 0,
        },
      });
    } else {
      toast.error(res.error || "Could not detect location. Showing default listings.");
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-md px-3 py-2 shadow-2xl">
      <div className="grid grid-cols-5 gap-1 text-center">
        {/* Home */}
        <Link
          to="/"
          className="flex flex-col items-center justify-center py-1 text-muted-foreground transition hover:text-primary active:scale-95"
          activeProps={{ className: "text-primary font-bold" }}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium">Home</span>
        </Link>

        {/* Near Me Geolocation */}
        <button
          type="button"
          onClick={handleNearMe}
          disabled={locating}
          className="flex flex-col items-center justify-center py-1 text-emerald-600 transition hover:text-emerald-500 active:scale-95 cursor-pointer"
        >
          {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
          <span className="text-[10px] mt-0.5 font-bold">Near Me</span>
        </button>

        {/* List Property CTA */}
        <Link
          to="/list-property"
          className="flex flex-col items-center justify-center py-1 text-primary transition hover:brightness-110 active:scale-95"
        >
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
            <PlusCircle className="h-5 w-5" />
          </div>
          <span className="text-[9px] mt-0.5 font-black uppercase text-primary">List</span>
        </Link>

        {/* Saved */}
        <Link
          to="/favorites"
          className="flex flex-col items-center justify-center py-1 text-muted-foreground transition hover:text-primary active:scale-95"
          activeProps={{ className: "text-primary font-bold" }}
        >
          <Heart className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium">Saved</span>
        </Link>

        {/* Account / Dashboard */}
        <Link
          to={status === "authenticated" ? "/dashboard" : "/auth"}
          className="flex flex-col items-center justify-center py-1 text-muted-foreground transition hover:text-primary active:scale-95"
          activeProps={{ className: "text-primary font-bold" }}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium">
            {status === "authenticated" ? (role ? role.toUpperCase() : "Portal") : "Sign In"}
          </span>
        </Link>
      </div>
    </div>
  );
}
