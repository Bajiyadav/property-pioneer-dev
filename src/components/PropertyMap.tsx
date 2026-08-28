import React, { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { Link } from "@tanstack/react-router";
import type { MapProperty } from "./propertyMapData";

interface PropertyMapProps {
  properties: MapProperty[];
  onBoundsChanged?: (bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) => void;
}

const MapUpdater = ({
  onBoundsChanged,
}: {
  onBoundsChanged?: PropertyMapProps["onBoundsChanged"];
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener("idle", () => {
      if (onBoundsChanged) {
        const bounds = map.getBounds();
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          onBoundsChanged({
            minLat: sw.lat(),
            maxLat: ne.lat(),
            minLng: sw.lng(),
            maxLng: ne.lng(),
          });
        }
      }
    });

    return () => {
      listener.remove();
    };
  }, [map, onBoundsChanged]);

  return null;
};

export function PropertyMap({ properties, onBoundsChanged }: PropertyMapProps) {
  const [mapError, setMapError] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  useEffect(() => {
    const originalAuthFailure = (window as unknown as { gm_authFailure?: () => void })
      .gm_authFailure;
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
      setMapError(true);
      if (typeof originalAuthFailure === "function") {
        originalAuthFailure();
      }
    };

    return () => {
      (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = originalAuthFailure;
    };
  }, []);

  // If no API key or Google Maps auth failed, render high-aesthetic fallback
  if (!apiKey || mapError) {
    return (
      <div className="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-border bg-card p-6 text-center shadow-inner">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-15 [background-size:16px_16px]" />
        <div className="relative z-10 max-w-md space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h4 className="text-base font-bold text-foreground">
            Locality Cluster View ({properties.length} Active Listings)
          </h4>
          <p className="text-xs text-muted-foreground">
            Displaying verified properties across Hyderabad (Madhapur, Gachibowli, Kondapur, Hitec
            City).
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {Array.from(new Set(properties.map((p) => p.locality || p.city).filter(Boolean)))
              .slice(0, 6)
              .map((loc) => (
                <span
                  key={loc}
                  className="rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold text-foreground border border-border/60"
                >
                  📍 {loc}
                </span>
              ))}
          </div>
        </div>
      </div>
    );
  }

  const MAP_ID = "DEMO_MAP_ID";

  return (
    <div className="relative h-full min-h-[500px] w-full overflow-hidden rounded-3xl">
      <APIProvider apiKey={apiKey} onError={() => setMapError(true)}>
        <Map
          defaultCenter={{ lat: 17.4483, lng: 78.3915 }} // Centered on Hyderabad IT Corridor
          defaultZoom={12}
          mapId={MAP_ID}
          internalUsageAttributionIds={["gmp_git_agentskills_v1"]}
          className="h-full w-full"
        >
          <MapUpdater onBoundsChanged={onBoundsChanged} />

          {properties.map((prop) => {
            const approxLat = Math.round(prop.latitude * 1000) / 1000;
            const approxLng = Math.round(prop.longitude * 1000) / 1000;
            const formattedPrice =
              prop.price >= 100000
                ? `₹${(prop.price / 100000).toFixed(1)}L`
                : `₹${(prop.price / 1000).toFixed(0)}K`;

            return (
              <AdvancedMarker
                key={prop.id}
                position={{ lat: approxLat, lng: approxLng }}
                title={prop.title}
                onClick={() => setSelectedProperty(prop)}
              >
                <button
                  type="button"
                  className="group flex items-center gap-1 rounded-full border border-primary/40 bg-card px-2.5 py-1 text-xs font-black text-foreground shadow-md transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{formattedPrice}</span>
                </button>
              </AdvancedMarker>
            );
          })}

          {selectedProperty && (
            <InfoWindow
              position={{
                lat: selectedProperty.latitude,
                lng: selectedProperty.longitude,
              }}
              onCloseClick={() => setSelectedProperty(null)}
            >
              <div className="max-w-[200px] p-1 text-foreground">
                <h5 className="font-bold text-xs line-clamp-1">{selectedProperty.title}</h5>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  📍 {selectedProperty.locality || selectedProperty.city || "Hyderabad"}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-black text-xs text-primary">
                    ₹{selectedProperty.price.toLocaleString("en-IN")}
                  </span>
                  <Link
                    to="/properties/$id"
                    params={{ id: selectedProperty.id }}
                    className="rounded-md bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    View
                  </Link>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
