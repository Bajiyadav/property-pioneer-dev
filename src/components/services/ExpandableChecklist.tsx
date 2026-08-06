import { useState } from "react";
import { ChevronDown, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

const ROOM_CHECKLISTS = [
  {
    id: "kitchen",
    title: "Kitchen Deep Cleaning",
    icon: "🍳",
    items: ["Chimney & Oil Filter Scrubbing", "Stove & Gas Burner Degreasing", "Cabinet Inside & Outside Wipedown", "Sink & Drain Sanitization", "Wall Tiles & Grout Descaling", "Refrigerator Exterior Cleaning"],
  },
  {
    id: "bathroom",
    title: "Bathroom Descaling & Sanitization",
    icon: "🚿",
    items: ["Commode & Toilet Bowl Disinfection", "Washbasin & Chrome Tap Polishing", "Glass Mirror & Shower Door Cleaning", "Floor Tile Scrubbing with Machine", "Exhaust Fan & Ceiling Dusting", "Geyser Exterior Wipedown"],
  },
  {
    id: "bedroom",
    title: "Bedrooms & Living Areas",
    icon: "🛋️",
    items: ["Mattress Vacuuming & Stain Removal", "Wardrobe Exterior & Shelves Wipedown", "Window Glass & Mesh Screen Washing", "Ceiling Fan & Light Fixtures Dusting", "Door Knobs & Switches Disinfection", "Sofa & Upholstery Vacuuming"],
  },
  {
    id: "balcony",
    title: "Balcony & Utility Area",
    icon: "🪴",
    items: ["Floor Machine Scrubbing", "Railing Dusting & Rust Inspection", "Sliding Glass Door Track Vacuuming", "Washing Machine Tap Cleaning", "Ceiling Cobweb Removal"],
  },
];

export function ExpandableChecklist() {
  const [openId, setOpenId] = useState<string>("kitchen");

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
          <ShieldCheck className="h-3.5 w-3.5" /> 100% Quality Standard
        </span>
        <h2 className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">
          Complete Room-by-Room Cleaning Checklist
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Click any room card below to inspect every item included in your service booking.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ROOM_CHECKLISTS.map((room) => {
          const isOpen = openId === room.id;
          return (
            <div
              key={room.id}
              className={`rounded-3xl border transition duration-300 ${
                isOpen ? "border-teal-600/50 bg-card shadow-lg" : "border-border/60 bg-secondary/30 hover:bg-secondary/50"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? "" : room.id)}
                className="flex w-full items-center justify-between p-5 text-left font-bold text-foreground"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{room.icon}</span>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">{room.title}</h3>
                    <p className="text-[11px] text-muted-foreground font-normal">{room.items.length} verified inspection points</p>
                  </div>
                </div>
                <div className={`grid h-8 w-8 place-items-center rounded-full bg-secondary text-foreground transition-transform duration-300 ${isOpen ? "rotate-180 bg-teal-600 text-white" : ""}`}>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-border/40 p-5 pt-3 grid gap-2 text-xs">
                  {room.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 flex-none" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
