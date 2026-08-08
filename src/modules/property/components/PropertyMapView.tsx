import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  CheckCircle2,
  ArrowRight,
  Layers,
  Navigation,
} from "lucide-react";
import { type Property, formatPrice } from "@/modules/property/services/propertyQueries";

const HYD_MAP_PINS = [
  {
    id: "hyd-000",
    lat: 17.4475,
    lng: 78.389,
    title: "Luxury Duplex Villa",
    price: "₹45,000",
    area: "Vinayak Nagar, Madhapur",
  },
  {
    id: "hyd-001",
    lat: 17.4401,
    lng: 78.3489,
    title: "2 BHK Gachibowli",
    price: "₹32,000",
    area: "Gachibowli",
  },
  {
    id: "hyd-002",
    lat: 17.4483,
    lng: 78.3915,
    title: "1 BHK Madhapur",
    price: "₹18,500",
    area: "Madhapur",
  },
  {
    id: "hyd-003",
    lat: 17.4622,
    lng: 78.3568,
    title: "3 BHK Kondapur",
    price: "₹45,000",
    area: "Kondapur",
  },
  {
    id: "hyd-004",
    lat: 17.4435,
    lng: 78.3772,
    title: "Studio Hitech City",
    price: "₹22,000",
    area: "Hitech City",
  },
  {
    id: "hyd-005",
    lat: 17.4156,
    lng: 78.3425,
    title: "3 BHK Financial Dist",
    price: "₹52,000",
    area: "Financial District",
  },
];

export function PropertyMapView({ properties }: { properties: Property[] }) {
  const [selectedPin, setSelectedPin] = useState<(typeof HYD_MAP_PINS)[0] | null>(HYD_MAP_PINS[0]);

  return (
    <div className="relative rounded-3xl border border-border bg-card overflow-hidden shadow-2xl h-[550px] flex flex-col md:flex-row">
      {/* Map Interactive Viewport Mock Canvas */}
      <div className="relative flex-1 bg-secondary/50 p-6 flex flex-col justify-between overflow-hidden border-b md:border-b-0 md:border-r border-border">
        {/* Background Stylized Map Grid Overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Map Header Controls */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-card/90 border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground backdrop-blur shadow">
            <MapPin className="h-3.5 w-3.5 text-primary" /> Hyderabad Interactive Map View
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-600/10 px-3 py-1 rounded-full">
            ● {HYD_MAP_PINS.length} Live Pins
          </span>
        </div>

        {/* Interactive Pin Overlays */}
        <div className="relative z-10 my-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
          {HYD_MAP_PINS.map((pin) => (
            <button
              key={pin.id}
              type="button"
              onClick={() => setSelectedPin(pin)}
              className={`group flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition duration-300 transform-gpu hover:scale-105 shadow-md ${
                selectedPin?.id === pin.id
                  ? "border-primary bg-primary text-primary-foreground shadow-lg scale-105"
                  : "border-border bg-card text-foreground hover:border-primary/50"
              }`}
            >
              <span className="text-xs font-bold">{pin.price}</span>
              <span className="text-[10px] opacity-80 mt-0.5">{pin.area}</span>
            </button>
          ))}
        </div>

        {/* Map Footer Note */}
        <div className="relative z-10 text-[11px] text-muted-foreground flex items-center gap-1.5">
          <Navigation className="h-3.5 w-3.5 text-primary" /> Showing Gachibowli, Madhapur &
          Financial District corridors
        </div>
      </div>

      {/* Selected Property Sidebar Card */}
      <div className="w-full md:w-80 bg-card p-6 flex flex-col justify-between border-t md:border-t-0 border-border">
        {selectedPin ? (
          <div className="space-y-4">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-600/10 px-2.5 py-0.5 rounded-full">
              Verified Owner • 0% Brokerage
            </span>

            <h3 className="text-lg font-semibold text-foreground">{selectedPin.title}</h3>

            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" /> {selectedPin.area}, Hyderabad
            </p>

            <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Monthly Rent</span>
                <strong className="text-foreground text-base">{selectedPin.price}/mo</strong>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Deposit</span>
                <strong className="text-foreground">2 Months Rent</strong>
              </div>
            </div>

            <Link
              to="/properties/$id"
              params={{ id: selectedPin.id }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground transition hover:brightness-110 shadow"
            >
              View Property Details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="text-center my-auto text-xs text-muted-foreground">
            Select a price pin on the map to view property details.
          </div>
        )}
      </div>
    </div>
  );
}
