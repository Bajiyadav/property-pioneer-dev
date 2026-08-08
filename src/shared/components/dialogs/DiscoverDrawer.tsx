import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";
import {
  Search,
  MapPin,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Train,
  Briefcase,
  GraduationCap,
  Stethoscope,
  Star,
  ShieldCheck,
  Heart,
  MessageSquare,
} from "lucide-react";
import type { CategoryModalData } from "./CategoryModal";

const HYD_LOCALITIES = [
  { name: "Gachibowli", tag: "Financial District & IT Corridor", count: "1,200+ Homes" },
  { name: "Madhapur", tag: "Near Cyber Towers & Metro", count: "950+ Homes" },
  { name: "Kondapur", tag: "Near Botanical Garden & Malls", count: "1,100+ Homes" },
  { name: "Financial District", tag: "Nanakramguda & US Consulate", count: "850+ Homes" },
  { name: "Hitech City", tag: "Mindspace Tech Park Hub", count: "1,400+ Homes" },
  { name: "Kukatpally", tag: "KPHB Metro & Shopping Hub", count: "900+ Homes" },
  { name: "Miyapur", tag: "Terminal Metro Corridor", count: "650+ Homes" },
  { name: "Manikonda", tag: "Lanco Hills & Film Nagar", count: "580+ Homes" },
  { name: "Nanakramguda", tag: "WaveRock & Wipro Circle", count: "490+ Homes" },
  { name: "Uppal", tag: "Metro Station & Stadium", count: "410+ Homes" },
];

const BUDGET_RANGES = [
  { label: "Under ₹15,000/mo", maxPrice: 15000 },
  { label: "₹15,000 - ₹30,000/mo", minPrice: 15000, maxPrice: 30000 },
  { label: "₹30,000 - ₹50,000/mo", minPrice: 30000, maxPrice: 50000 },
  { label: "Luxury ₹50,000+/mo", minPrice: 50000 },
];

export function DiscoverDrawer({
  data,
  onClose,
}: {
  data: CategoryModalData | null;
  onClose: () => void;
}) {
  if (!data) return null;

  return (
    <Dialog open={Boolean(data)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl bg-card border-border p-6 sm:p-8 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> 100% Zero Brokerage • Verified Owners
            </span>
            <span className="text-xs text-muted-foreground">📍 Launch City: Hyderabad</span>
          </div>

          <DialogTitle className="text-3xl font-semibold text-foreground mt-3 flex items-center gap-2">
            Discover {data.title} in Hyderabad
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed max-w-2xl mt-1">
            Explore curated, direct-owner {data.title.toLowerCase()} listings across top Hyderabad
            tech corridors and residential hubs.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-8">
          {/* Locality Matrix Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" /> Popular Hyderabad Localities
              </h4>
              <span className="text-xs text-muted-foreground">1-Click Instant Filters</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {HYD_LOCALITIES.map((loc) => (
                <Link
                  key={loc.name}
                  to="/properties"
                  search={{
                    q: loc.name,
                    city: "Hyderabad",
                    listing: "rent",
                    minPrice: 0,
                    maxPrice: 0,
                    beds: 0,
                  }}
                  onClick={onClose}
                  className="group flex flex-col justify-between rounded-xl border border-border bg-secondary/40 p-3 text-left transition duration-300 hover:border-primary hover:bg-card hover:shadow-md"
                >
                  <div>
                    <h5 className="text-xs font-semibold text-foreground group-hover:text-primary transition">
                      {loc.name}
                    </h5>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {loc.tag}
                    </p>
                  </div>
                  <span className="mt-2 text-[10px] font-bold text-primary flex items-center gap-0.5">
                    {loc.count}{" "}
                    <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Budget Shortcuts */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground mb-3">
              Filter By Monthly Budget
            </h4>
            <div className="flex flex-wrap gap-2">
              {BUDGET_RANGES.map((b) => (
                <Link
                  key={b.label}
                  to="/properties"
                  search={{
                    q: "",
                    city: "Hyderabad",
                    listing: "rent",
                    minPrice: b.minPrice || 0,
                    maxPrice: b.maxPrice || 0,
                    beds: 0,
                  }}
                  onClick={onClose}
                  className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition hover:border-primary hover:bg-primary hover:text-primary-foreground shadow-sm"
                >
                  💰 {b.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
            <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
              <Star className="h-4 w-4 fill-current" /> 4.9/5 Rating from 12,000+ Hyderabad Renters
            </div>
            <Link
              to="/properties"
              search={{
                q: data.title,
                city: "Hyderabad",
                listing: "rent",
                minPrice: 0,
                maxPrice: 0,
                beds: 0,
              }}
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 shadow-lg"
            >
              <Search className="h-4 w-4" /> Start Exploring {data.title} Listings →
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
