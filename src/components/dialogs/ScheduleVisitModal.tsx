import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar, MapPin, CheckCircle2, Video, Loader2 } from "lucide-react";
import { submitEnquiry } from "@/modules/enquiry/services/enquiryService";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";

/**
 * Visit request for a property.
 *
 * This previously showed a "Visit Confirmed!" screen and promised an SMS
 * reminder while persisting nothing at all. There is no scheduling or SMS
 * backend, so rather than keep a confirmation the product cannot honour, the
 * form now submits a real enquiry — the one workflow that does exist — with the
 * requested slot in the message. The owner receives it in their dashboard, and
 * the success copy claims only that.
 */
export function ScheduleVisitModal({
  propertyId,
  propertyTitle,
  isOpen,
  onClose,
}: {
  propertyId: string;
  propertyTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [visitType, setVisitType] = useState<"in_person" | "video">("in_person");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00 AM");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  /** Honeypot — a real user never sees or fills this. */
  const [company, setCompany] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Timing is measured from when the form is actually shown, since the endpoint
  // rejects submissions that arrive implausibly fast.
  const openedAt = useRef(0);
  useEffect(() => {
    if (isOpen) openedAt.current = Date.now();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);

    const visitLabel = visitType === "in_person" ? "in-person visit" : "video tour";
    const result = await submitEnquiry({
      propertyId,
      name,
      phone,
      message: `Visit request: ${visitLabel} on ${date} at ${time}. Please confirm if this slot works.`,
      company,
      elapsedMs: Date.now() - openedAt.current,
    });

    setSubmitting(false);
    if (result.ok) {
      setSent(true);
    } else {
      setError(
        getFriendlyErrorMessage(result.error, "Your enquiry wasn't sent. Please try again."),
      );
    }
  };

  const close = () => {
    setSent(false);
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && close()}>
      <DialogContent className="sm:max-w-md bg-card border-border p-6 rounded-3xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Request a Property Visit
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {propertyTitle || "Hyderabad rental property"}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-600/10 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h4 className="text-base font-semibold text-foreground">Request sent</h4>
            <p className="text-xs text-muted-foreground">
              Your visit request for{" "}
              <strong className="text-foreground">
                {date} at {time}
              </strong>{" "}
              has been sent to the owner. They will see it in their dashboard and contact you on the
              number you provided. The slot is not confirmed until the owner responds.
            </p>
            <button
              type="button"
              onClick={close}
              className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
                <Video className="h-4 w-4" /> Video Tour
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="visit-date" className="text-[11px] font-semibold text-foreground">
                  Preferred Date
                </label>
                <input
                  id="visit-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="visit-time" className="text-[11px] font-semibold text-foreground">
                  Time Slot
                </label>
                <select
                  id="visit-time"
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

            <div>
              <label htmlFor="visit-name" className="text-[11px] font-semibold text-foreground">
                Your Full Name
              </label>
              <input
                id="visit-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="visit-phone" className="text-[11px] font-semibold text-foreground">
                Mobile Phone
              </label>
              <input
                id="visit-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
              />
            </div>

            {/* Honeypot: hidden from users, attractive to bots. */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="hidden"
            />

            {error && (
              <p role="alert" className="text-[11px] font-medium text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110 shadow disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" /> Send Visit Request
                </>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
