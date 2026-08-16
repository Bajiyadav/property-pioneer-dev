import { useState } from "react";
import { X, Calendar as CalendarIcon, Video, MapPin, CheckCircle2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { useInteractionStore } from "@/shared/stores/interactionStore";

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  tenantId: string;
}

export function ScheduleVisitModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  ownerId,
  tenantId,
}: ScheduleVisitModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState<string>("10:00 AM");
  const [visitMode, setVisitMode] = useState<"In-person walkthrough" | "Live video tour">(
    "In-person walkthrough",
  );
  const [isSuccess, setIsSuccess] = useState(false);

  const bookVisit = useInteractionStore((s) => s.bookVisit);

  if (!isOpen) return null;

  const handleBook = () => {
    bookVisit({
      propertyId,
      propertyTitle,
      ownerId,
      tenantId,
      mode: visitMode,
      when: `${format(selectedDate, "MMM d, yyyy")} · ${selectedTime}`,
    });
    setIsSuccess(true);
  };

  const handleClose = () => {
    setIsSuccess(false);
    onClose();
  };

  const availableTimes = ["10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {isSuccess ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-foreground">Visit Requested!</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              We've notified the owner to confirm your {visitMode.toLowerCase()} for
              <br />
              <strong className="text-foreground">{propertyTitle}</strong>.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {format(selectedDate, "MMM d, yyyy")} at {selectedTime}
            </p>
            <button
              onClick={handleClose}
              className="mt-8 rounded-full bg-primary px-8 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-foreground">Schedule a Visit</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a time to view <strong className="text-foreground">{propertyTitle}</strong>
            </p>

            <div className="mt-6 space-y-5">
              {/* Visit Mode */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Visit Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setVisitMode("In-person walkthrough")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                      visitMode === "In-person walkthrough"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <MapPin className="h-4 w-4" /> In-person
                  </button>
                  <button
                    onClick={() => setVisitMode("Live video tour")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                      visitMode === "Live video tour"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <Video className="h-4 w-4" /> Video Call
                  </button>
                </div>
              </div>

              {/* Date & Time (Simplified for mock purposes) */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Date & Time
                </label>
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                  {[0, 1, 2, 3, 4].map((offset) => {
                    const d = addDays(new Date(), offset);
                    const isSelected = selectedDate.getDate() === d.getDate();
                    return (
                      <button
                        key={offset}
                        onClick={() => setSelectedDate(d)}
                        className={`flex min-w-[70px] shrink-0 flex-col items-center justify-center rounded-xl border p-2 transition ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        <span className="text-[10px] uppercase opacity-80">{format(d, "MMM")}</span>
                        <span className="text-lg font-bold leading-none my-1">
                          {format(d, "dd")}
                        </span>
                        <span className="text-[10px] uppercase opacity-80">{format(d, "EEE")}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-lg border py-2 text-xs font-semibold transition ${
                        selectedTime === time
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={handleBook}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]"
              >
                <CalendarIcon className="h-4 w-4" /> Request{" "}
                {visitMode.includes("video") ? "Video Tour" : "Visit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
