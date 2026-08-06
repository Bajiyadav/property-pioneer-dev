import { useState } from "react";
import { Sparkles, SlidersHorizontal } from "lucide-react";

export function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
          <Sparkles className="h-3.5 w-3.5" /> Visual Transformation Guarantee
        </span>
        <h2 className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">
          See the Difference: Before vs. After Urban Deep Clean
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Drag the interactive slider below to inspect deep kitchen & tile descaling results.</p>
      </div>

      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border/80 shadow-2xl h-80 sm:h-96 select-none">
        {/* AFTER Image (Clean) */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80"
            alt="After Deep Cleaning"
            className="h-full w-full object-cover"
          />
          <span className="absolute top-4 right-4 rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white shadow-md">
            AFTER: Urban Deep Clean
          </span>
        </div>

        {/* BEFORE Image (Clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"
            alt="Before Deep Cleaning"
            className="h-full w-full object-cover max-w-none"
            style={{ width: "100%" }}
          />
          <span className="absolute top-4 left-4 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white shadow-md">
            BEFORE
          </span>
        </div>

        {/* Divider Bar */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize flex items-center justify-center"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-teal-600 shadow-xl border border-teal-600">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
        </div>

        {/* Hidden Range Input overlay */}
        <input
          type="range"
          min={0}
          max={100}
          value={sliderPosition}
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
        />
      </div>
    </section>
  );
}
