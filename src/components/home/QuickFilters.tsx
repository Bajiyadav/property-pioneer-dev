import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Home, Key, Building2, Users } from "lucide-react";

const QUICK_TABS = [
  {
    id: "rent",
    label: "Rent",
    icon: Key,
    search: { listing: "rent", q: "", city: "", minPrice: 0, maxPrice: 0, beds: 0 },
  },
  {
    id: "buy",
    label: "Buy",
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
    <div className="flex flex-wrap gap-2">
      {QUICK_TABS.map((tab) => {
        const Icon = tab.icon;
        const isSelected = active === tab.id;
        return (
          <Link
            key={tab.id}
            to="/properties"
            search={tab.search}
            onClick={() => setActive(tab.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold backdrop-blur transition ${
              isSelected
                ? "bg-background text-foreground shadow-md"
                : "bg-background/80 text-foreground/80 hover:bg-background hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
