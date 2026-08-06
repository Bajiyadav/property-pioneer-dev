import { useState } from "react";
import { Sparkles, Calculator, Check, ArrowRight } from "lucide-react";

const PROPERTY_TYPES = [
  { id: "apartment", label: "Apartment / Flat", basePrice: 2499 },
  { id: "villa", label: "Luxury Villa", basePrice: 4999 },
  { id: "independent", label: "Independent House", basePrice: 3499 },
  { id: "office", label: "Commercial Office", basePrice: 5999 },
];

const SERVICES = [
  { id: "full_cleaning", name: "Full Home Deep Cleaning", priceMultiplier: 1.0 },
  { id: "kitchen_bath", name: "Kitchen & Bathroom Deep Clean", priceMultiplier: 0.6 },
  { id: "packers", name: "Packers & Movers Relocation", priceMultiplier: 1.8 },
  { id: "agreement", name: "Digital E-Stamp Agreement", priceMultiplier: 0.2 },
];

export function HomeServicesCalculator() {
  const [propertyType, setPropertyType] = useState("apartment");
  const [bhk, setBhk] = useState(2);
  const [selectedServices, setSelectedServices] = useState<string[]>(["full_cleaning"]);

  const base = PROPERTY_TYPES.find((p) => p.id === propertyType)?.basePrice || 2499;
  const bhkMultiplier = 1 + (bhk - 1) * 0.35;
  const serviceMultipliers = selectedServices.reduce((acc, sId) => {
    const s = SERVICES.find((item) => item.id === sId);
    return acc + (s?.priceMultiplier || 0);
  }, 0);

  const estimatedPrice = Math.round(base * bhkMultiplier * (serviceMultipliers || 1));

  const toggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((s) => s !== id));
      }
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-xl sm:p-8">
      <div className="flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-600/10 text-teal-600 dark:text-teal-400">
          <Calculator className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-extrabold text-foreground">Interactive Instant Price Estimator</h3>
          <p className="text-xs text-muted-foreground">Select your property size and services for 100% price lock guarantee.</p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Property Type Selector */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-2">1. Select Property Type</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs font-bold">
            {PROPERTY_TYPES.map((pt) => (
              <button
                key={pt.id}
                type="button"
                onClick={() => setPropertyType(pt.id)}
                className={`rounded-2xl border p-3 transition text-center ${
                  propertyType === pt.id
                    ? "border-teal-600 bg-teal-600/10 text-teal-600 dark:text-teal-400 shadow-sm"
                    : "border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary"
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        {/* BHK Slider */}
        <div>
          <div className="flex justify-between text-xs font-bold text-foreground mb-2">
            <span>2. Size / Rooms</span>
            <span className="text-teal-600 dark:text-teal-400">{bhk} BHK / {bhk * 400 + 200} sq.ft</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={bhk}
            onChange={(e) => setBhk(Number(e.target.value))}
            className="w-full accent-teal-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-semibold mt-1">
            <span>1 BHK</span>
            <span>2 BHK</span>
            <span>3 BHK</span>
            <span>4 BHK</span>
            <span>5+ BHK / Villa</span>
          </div>
        </div>

        {/* Services Checkboxes */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-2">3. Included Service Modules</label>
          <div className="grid gap-2 sm:grid-cols-2 text-xs">
            {SERVICES.map((s) => {
              const active = selectedServices.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  className={`flex items-center justify-between rounded-xl border p-3 font-semibold transition text-left ${
                    active
                      ? "border-teal-600 bg-teal-600/10 text-foreground"
                      : "border-border/60 bg-secondary/20 text-muted-foreground hover:bg-secondary/40"
                  }`}
                >
                  <span>{s.name}</span>
                  <div className={`grid h-5 w-5 place-items-center rounded-full ${active ? "bg-teal-600 text-white" : "bg-muted text-transparent"}`}>
                    <Check className="h-3 w-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Output Display */}
        <div className="rounded-2xl border border-teal-600/30 bg-teal-600/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Estimated Total Price (100% Price Lock)</span>
            <p className="font-[family-name:var(--font-display)] text-3xl font-black text-foreground">
              ₹{estimatedPrice.toLocaleString("en-IN")} <span className="text-xs text-muted-foreground font-normal">+ taxes</span>
            </p>
          </div>
          <a
            href="#booking-form"
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-teal-500"
          >
            Book This Estimate <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
