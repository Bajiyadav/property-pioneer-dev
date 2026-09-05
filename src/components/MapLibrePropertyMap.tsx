import React, { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  Marker,
  Popup,
  NavigationControl,
  LngLatBounds,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapProperty } from "./propertyMapData";

interface MapLibrePropertyMapProps {
  properties: MapProperty[];
  onBoundsChanged?: (bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) => void;
  className?: string;
  initialCenter?: { lat: number; lng: number };
}

// Standard OSM raster tile style (Free, no API key, zero Google dependencies)
const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function MapLibrePropertyMap({
  properties,
  onBoundsChanged,
  className = "h-full min-h-[500px] w-full rounded-3xl overflow-hidden shadow-sm",
  initialCenter = { lat: 17.4483, lng: 78.3915 }, // Default Hyderabad IT corridor
}: MapLibrePropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Determine initial center from first property with coordinates, or fallback
    const validProps = properties.filter(
      (p) =>
        typeof p.latitude === "number" &&
        typeof p.longitude === "number" &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude),
    );

    const centerLng = validProps.length > 0 ? validProps[0].longitude : initialCenter.lng;
    const centerLat = validProps.length > 0 ? validProps[0].latitude : initialCenter.lat;

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: OSM_STYLE,
      center: [centerLng, centerLat],
      zoom: validProps.length > 0 ? 12 : 5,
    });

    map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), "top-right");

    map.on("load", () => {
      map.resize();
    });

    map.on("moveend", () => {
      if (onBoundsChanged) {
        const bounds = map.getBounds();
        if (bounds) {
          onBoundsChanged({
            minLat: bounds.getSouth(),
            maxLat: bounds.getNorth(),
            minLng: bounds.getWest(),
            maxLng: bounds.getEast(),
          });
        }
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // Update markers and bounds whenever properties change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const validProps = properties.filter(
      (p) =>
        typeof p.latitude === "number" &&
        typeof p.longitude === "number" &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude),
    );

    if (validProps.length === 0) return;

    const bounds = new LngLatBounds();

    validProps.forEach((prop) => {
      const approxLat = Math.round(prop.latitude * 1000) / 1000;
      const approxLng = Math.round(prop.longitude * 1000) / 1000;

      const formattedPrice =
        prop.price >= 10000000
          ? `₹${(prop.price / 10000000).toFixed(2)}Cr`
          : prop.price >= 100000
            ? `₹${(prop.price / 100000).toFixed(1)}L`
            : `₹${(prop.price / 1000).toFixed(0)}K`;

      // Create Custom Price Badge Marker
      const el = document.createElement("button");
      el.type = "button";
      el.className =
        "group flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-card px-3 py-1.5 text-xs font-black text-foreground shadow-md transition-transform hover:scale-110 hover:bg-emerald-600 hover:text-white cursor-pointer";
      el.style.zIndex = "10";
      el.innerHTML = `
        <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>${formattedPrice}</span>
      `;

      // Create Popup HTML
      const popupHtml = `
        <div style="font-family: inherit; padding: 4px; max-width: 220px; color: #0F172A;">
          <h5 style="font-weight: 800; font-size: 13px; margin: 0 0 4px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${prop.title}
          </h5>
          <p style="font-size: 11px; color: #64748B; margin: 0 0 8px 0;">
            📍 ${prop.locality || prop.city || "Verified Home"}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-weight: 900; font-size: 13px; color: #059669;">
              ₹${prop.price.toLocaleString("en-IN")}
            </span>
            <a href="/properties/${prop.id}" style="background-color: #059669; color: white; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none; display: inline-block;">
              View Details
            </a>
          </div>
        </div>
      `;

      const popup = new Popup({ offset: 25, closeButton: true, maxWidth: "260px" }).setHTML(
        popupHtml,
      );

      const marker = new Marker({ element: el })
        .setLngLat([approxLng, approxLat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => {
        setSelectedProperty(prop);
      });

      markersRef.current.push(marker);
      bounds.extend([approxLng, approxLat]);
    });

    // Auto-fit bounds if we have coordinates
    try {
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: 60,
          maxZoom: 15,
          duration: 800,
        });
      }
    } catch {
      // Ignore fitBounds errors on collapsed tabs
    }
  }, [properties]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full" />
      {/* Attribution Watermark info */}
      <div className="absolute bottom-2 left-2 z-10 rounded-lg bg-background/90 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground shadow-xs border border-border/50 backdrop-blur-xs">
        🗺️ OSM-derived Map Data &bull; Zero Google Dependencies
      </div>
    </div>
  );
}
