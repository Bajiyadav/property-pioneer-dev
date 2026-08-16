import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Compass,
  Layers,
  Info,
  ExternalLink,
  ShieldCheck,
  Building,
  ArrowRight,
} from "lucide-react";
import { type Property, formatPrice } from "@/modules/property/services/propertyQueries";

/**
 * Clean, production-safe Map View & Locality Cluster component.
 *
 * NOTE ON MAP COORDINATES ARCHITECTURE:
 * The live Postgres schema currently stores locality, landmark, metro_station, it_park,
 * college, and hospital fields, but does NOT contain explicit latitude/longitude columns.
 * Per platform guidelines, we strictly avoid fabricating fake geographic coordinates.
 *
 * Required Geo Data Structure for Future PostGIS / Mapbox Integration:
 * - latitude: number (e.g. 17.4483)
 * - longitude: number (e.g. 78.3915)
 * - geo_point: geography(Point, 4326)
 * - polygon_boundary?: GeoJSON.Polygon
 */
export function PropertyMapView({ properties }: { properties: Property[] }) {
  // Aggregate real properties by locality
  const localityClusters = useMemo(() => {
    const counts: Record<
      string,
      { count: number; minPrice: number; maxPrice: number; sampleProperty: Property }
    > = {};

    properties.forEach((p) => {
      const loc = p.locality || p.address || "Hyderabad";
      if (!counts[loc]) {
        counts[loc] = {
          count: 0,
          minPrice: p.price,
          maxPrice: p.price,
          sampleProperty: p,
        };
      }
      counts[loc].count += 1;
      if (p.price < counts[loc].minPrice) counts[loc].minPrice = p.price;
      if (p.price > counts[loc].maxPrice) counts[loc].maxPrice = p.price;
    });

    return Object.entries(counts).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [properties]);

  const [activeLocality, setActiveLocality] = useState<string | null>(
    localityClusters[0]?.name || null,
  );

  const selectedCluster =
    localityClusters.find((c) => c.name === activeLocality) || localityClusters[0];

  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl lg:h-[540px] lg:flex-row">
      {/* 1. INTERACTIVE LOCALITY CLUSTER BOARD */}
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden border-b border-border bg-secondary/30 p-6 lg:border-b-0 lg:border-r">
        {/* Subtle Map Grid Pattern */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-10 [background-size:20px_20px]" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-3.5 py-1.5 text-xs font-semibold text-foreground backdrop-blur shadow-sm">
            <Compass className="h-3.5 w-3.5 text-primary" />
            <span>Locality Map Clusters</span>
          </div>

          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {localityClusters.length} Active Localities ({properties.length} Homes)
          </span>
        </div>

        {/* Real Locality Hub Clusters */}
        <div className="relative z-10 my-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {localityClusters.map((cluster) => {
            const isSelected = activeLocality === cluster.name;
            return (
              <button
                key={cluster.name}
                type="button"
                onClick={() => setActiveLocality(cluster.name)}
                className={`group flex flex-col items-start rounded-2xl border p-3.5 text-left transition duration-200 ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                    : "border-border/70 bg-card text-foreground hover:border-primary/50 hover:bg-card/90"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="truncate text-xs font-bold">{cluster.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {cluster.count} {cluster.count === 1 ? "home" : "homes"}
                  </span>
                </div>
                <p
                  className={`mt-2 text-[11px] font-medium ${
                    isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
                  }`}
                >
                  From ₹{cluster.minPrice.toLocaleString("en-IN")}/mo
                </p>
              </button>
            );
          })}
        </div>

        {/* Architecture Notice */}
        <div className="relative z-10 flex items-center gap-2 rounded-xl bg-background/80 px-3.5 py-2 text-xs text-muted-foreground backdrop-blur">
          <Info className="h-4 w-4 flex-none text-primary" />
          <span>
            Precise GPS boundary sync is being integrated via GIS shapefiles. Showing verified
            locality clusters.
          </span>
        </div>
      </div>

      {/* 2. SELECTED LOCALITY PREVIEW PANEL */}
      <div className="flex w-full flex-col justify-between bg-card p-6 lg:w-[380px]">
        {selectedCluster ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-foreground">
                  {selectedCluster.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedCluster.count} verified rental{" "}
                  {selectedCluster.count === 1 ? "home" : "homes"} available
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Rent Price Range</span>
                <span className="font-bold text-foreground">
                  ₹{selectedCluster.minPrice.toLocaleString("en-IN")} – ₹
                  {selectedCluster.maxPrice.toLocaleString("en-IN")}/mo
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Platform Commission</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  No Platform Fee
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Listing Status</span>
                <span className="font-bold text-foreground">Moderated</span>
              </div>
            </div>

            {/* Featured Sample Property */}
            {selectedCluster.sampleProperty && (
              <div className="mt-4 rounded-2xl border border-border/60 p-3 bg-card">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Featured in {selectedCluster.name}
                </span>
                <h4 className="mt-1 line-clamp-1 text-xs font-bold text-foreground">
                  {selectedCluster.sampleProperty.title}
                </h4>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">
                    {formatPrice(
                      selectedCluster.sampleProperty.price,
                      selectedCluster.sampleProperty.listing_type,
                    )}
                  </span>
                  <Link
                    to="/properties/$id"
                    params={{ id: selectedCluster.sampleProperty.id }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>View</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
            Select a locality to view properties
          </div>
        )}

        <div className="mt-6 border-t border-border/40 pt-4">
          <p className="text-[11px] text-muted-foreground">
            Urban Properties ensures direct contact with verified owners across Hyderabad.
          </p>
        </div>
      </div>
    </div>
  );
}
