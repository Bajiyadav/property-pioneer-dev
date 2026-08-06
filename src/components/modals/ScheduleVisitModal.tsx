import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, CheckCircle2, User, Phone, Video } from "lucide-react";

export function ScheduleVisitModal({
  propertyTitle,
  isOpen,
  onClose,
}: {
  propertyTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [visitType, setVisitType] = useState<"in_person" | "video">("in_person");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00 AM");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [booked, setBooked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !date) return;
    setBooked(true);
    toast.success("Property Visit Scheduled Successfully!", {
      description: `Confirmed ${visitType === "in_person" ? "In-Person Walkthrough" : "Live Video Tour"} on ${date} at ${time}.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border p-6 rounded-3xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Verified Owner Walkthrough
            </span>
            <span className="text-xs text-muted-foreground">0% Brokerage</span>
          </div>
          <DialogTitle className="text-xl font-semibold text-foreground mt-2">
            Schedule Property Visit
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {propertyTitle || "Hyderabad Rental Property"}
          </DialogDescription>
        </DialogHeader>

        {booked ? (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-600/10 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h4 className="text-base font-semibold text-foreground">Visit Confirmed!</h4>
            <p className="text-xs text-muted-foreground">
              The property owner has been notified. You will receive an SMS reminder before your visit on <strong className="text-foreground">{date} at {time}</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                setBooked(false);
                onClose();
              }}
              className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Visit Type selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisitType("in_person")}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  visitType === "in_person"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground"
                }`}
              >
                <MapPin className="h-4 w-4" /> In-Person Visit
              </button>
              <button
                type="button"
                onClick={() => setVisitType("video")}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  visitType === "video"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground"
                }`}
              >
                <Video className="h-4 w-4" /> Live Video Tour
              </button>
            </div>

            {/* Date & Time Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-foreground">Preferred Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-foreground">Time Slot</label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                >
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                  <option value="07:00 PM">07:00 PM</option>
                </select>
              </div>
            </div>

            {/* Name & Contact */}
            <div>
              <label className="text-[11px] font-semibold text-foreground">Your Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-foreground">Mobile Phone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110 shadow"
            >
              <Calendar className="h-4 w-4" /> Confirm Visit Booking
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
