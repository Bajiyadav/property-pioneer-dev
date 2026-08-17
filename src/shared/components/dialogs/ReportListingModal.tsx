import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const SUPPORT_EMAIL = "support@seedhaproperties.com";

export function ReportListingModal({
  isOpen,
  onClose,
  propertyTitle = "Property Listing",
}: {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle?: string;
}) {
  const [reason, setReason] = useState("price_inaccurate");
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // There is no reports table, so a stored "report" would silently vanish.
  // Handing off to the published support address actually delivers it.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const subject = `Listing report: ${propertyTitle}`;
    const body = [
      `Listing: ${propertyTitle}`,
      `Reason: ${reason}`,
      "",
      "Details:",
      comments || "(none provided)",
    ].join("\n");
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setLoading(false);
    setSubmitted(true);
    toast.success("Report drafted in your email app — send it to reach our team.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Platform Integrity
            </span>
          </div>
          <DialogTitle className="mt-2 text-xl font-extrabold text-foreground sm:text-2xl">
            Report Listing
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground truncate">
            Report issue for "{propertyTitle}"
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="mt-4 rounded-2xl border border-emerald-600/30 bg-emerald-600/10 p-6 text-center space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-foreground">Report drafted</h3>
            <p className="text-xs text-muted-foreground">
              We have opened an email to {SUPPORT_EMAIL} with your report. Send it and our team will
              review the listing. If your email app did not open, write to us directly.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-2 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-foreground mb-1">Select Issue Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="price_inaccurate">Rent or Price is Inaccurate</option>
                <option value="already_rented">Property is Already Rented / Sold</option>
                <option value="fake_photos">Photos don't match actual property</option>
                <option value="broker_demanding">Owner is actually a Broker asking fee</option>
                <option value="unreachable">Phone number / Owner is unreachable</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Describe what went wrong…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-rose-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-rose-500 flex items-center justify-center gap-2"
            >
              {loading ? "Submitting Report…" : "Submit Report to Safety Team"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
