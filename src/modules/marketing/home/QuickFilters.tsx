import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Home, Key, Building2, Users } from "lucide-react";

const QUICK_TABS = [
  {
    id: "rent",
    label: "Rent Homes",
    icon: Key,
    search: { listing: "rent", q: "", city: "", minPrice: 0, maxPrice: 0, beds: 0 },
  },
  {
    id: "buy",
    label: "Buy Properties",
    icon: Home,
    search: { listing: "sale", q: "", city: "", minPrice: 0, maxPrice: 0, beds: 0 },
  },
  {
    id: "commercial",
    label: "Commercial",
    icon: Building2,
    search: { q: "commercial", listing: "", city: "", minPrice: 0, maxPrice: 0, beds: 0 },
  },
  {
    id: "flatmates",
    label: "Flatmates",
    icon: Users,
    search: { q: "flatmates", listing: "", city: "", minPrice: 0, maxPrice: 0, beds: 0 },
  },
];

export function QuickFilters() {
  const [active, setActive] = useState("rent");

  return (
    <div className="flex flex-wrap gap-2 sm:gap-2.5">
      {QUICK_TABS.map((tab) => {
        const Icon = tab.icon;
        const isSelected = active === tab.id;
        return (
          <Link
            key={tab.id}
            to="/properties"
            search={tab.search}
            onClick={() => setActive(tab.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold backdrop-blur-md transition-all duration-200 border ${
              isSelected
                ? "bg-card text-foreground border-white/40 shadow-md scale-102"
                : "bg-black/30 text-white/90 border-white/10 hover:bg-black/45 hover:text-white hover:border-white/25"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : "text-white/80"}`} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
