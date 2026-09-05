import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { nativeApi } from "@/lib/api-client";
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Phone,
  Building,
  Sparkles,
  Loader2,
} from "lucide-react";

interface RequestPropertyManagementDialogProps {
  propertyId: string;
  propertyTitle?: string;
  initialPhone?: string;
  triggerButton?: React.ReactNode;
  onSuccess?: () => void;
}

const AVAILABLE_SERVICES = [
  {
    id: "TENANT_SCREENING",
    label: "Tenant Screening & Police Verification",
    description: "Strict background check, ID verification, and criminal record clearance.",
  },
  {
    id: "RENT_COLLECTION",
    label: "Guaranteed Rent Collection & Payouts",
    description: "Automated rent collection by 5th of every month with zero delays.",
  },
  {
    id: "MAINTENANCE",
    label: "24/7 Maintenance & Periodic Inspections",
    description: "Quarterly video inspection audits and verified vendor repairs.",
  },
  {
    id: "LEGAL_DOCUMENTATION",
    label: "Digital Agreement & Stamp Paper Signing",
    description: "State-compliant e-stamped legal rental agreements.",
  },
  {
    id: "MOVE_IN_OUT",
    label: "Move-In & Move-Out Condition Inventory",
    description: "Detailed 150-point checklist report before handover.",
  },
];

export function RequestPropertyManagementDialog({
  propertyId,
  propertyTitle,
  initialPhone = "",
  triggerButton,
  onSuccess,
}: RequestPropertyManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(initialPhone);
  const [services, setServices] = useState<string[]>([
    "TENANT_SCREENING",
    "RENT_COLLECTION",
    "MAINTENANCE",
  ]);
  const [monthlyRent, setMonthlyRent] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const toggleService = (id: string) => {
    setServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Please enter a valid contact phone number.");
      return;
    }
    if (services.length === 0) {
      toast.error("Please select at least one management service.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await nativeApi.propertyManagement.create({
        propertyId,
        ownerContactPhone: phone.trim(),
        servicesRequested: services,
        monthlyRentTarget: monthlyRent ? parseFloat(monthlyRent) : undefined,
        availableFromDate: availableFrom || undefined,
        ownerNotes: notes.trim() || undefined,
      });

      if (res.ok || res.data) {
        setSubmittedSuccess(true);
        toast.success("Property Management request submitted successfully!");
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Failed to submit property management request.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) setSubmittedSuccess(false);
      }}
    >
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-sm">
            <ShieldCheck className="mr-2 h-4 w-4" /> Request Property Management
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-7">
        {submittedSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Request Received!
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed max-w-md mx-auto">
              Our dedicated Property Manager will review your property details and contact you at{" "}
              <strong className="text-foreground">{phone}</strong> within 24 hours to schedule an
              onboarding walk-through.
            </DialogDescription>
            <div className="pt-4">
              <Button
                onClick={() => {
                  setOpen(false);
                  setSubmittedSuccess(false);
                }}
                className="rounded-xl px-6"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4" /> Seedha End-to-End Property Management
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                Let Seedha Manage Your Property
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Enjoy 100% passive rental income. From tenant sourcing and background verification
                to rent collection and emergency maintenance, our local property managers take care
                of everything.
              </DialogDescription>
            </DialogHeader>

            {propertyTitle && (
              <div className="rounded-xl bg-muted/50 p-3.5 border border-border/60 flex items-center gap-3">
                <Building className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Property
                  </p>
                  <p className="text-sm font-medium truncate">{propertyTitle}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="pm-phone"
                  className="text-xs font-semibold flex items-center gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5" /> Direct Contact Phone Number *
                </Label>
                <Input
                  id="pm-phone"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 rounded-xl"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Our relationship manager will reach you on this number.
                </p>
              </div>

              <div>
                <Label className="text-xs font-semibold">Services Requested *</Label>
                <p className="text-[11px] text-muted-foreground mb-2.5">
                  Select the services you want Seedha to handle:
                </p>
                <div className="space-y-2.5">
                  {AVAILABLE_SERVICES.map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() => toggleService(srv.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                        services.includes(srv.id)
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/60 hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox
                        id={`srv-${srv.id}`}
                        checked={services.includes(srv.id)}
                        onCheckedChange={() => toggleService(srv.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`srv-${srv.id}`}
                          className="text-xs font-semibold cursor-pointer text-foreground"
                        >
                          {srv.label}
                        </Label>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                          {srv.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Label
                    htmlFor="pm-rent"
                    className="text-xs font-semibold flex items-center gap-1.5"
                  >
                    <IndianRupee className="h-3.5 w-3.5" /> Target Monthly Rent (₹)
                  </Label>
                  <Input
                    id="pm-rent"
                    type="number"
                    placeholder="e.g. 35000"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="mt-1.5 rounded-xl"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="pm-date"
                    className="text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Available From Date
                  </Label>
                  <Input
                    id="pm-date"
                    type="date"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="mt-1.5 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pm-notes" className="text-xs font-semibold">
                  Special Instructions or Preferences (Optional)
                </Label>
                <Textarea
                  id="pm-notes"
                  placeholder="e.g. Prefer family tenants, furnished flat, keys available with security..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-1.5 rounded-xl resize-none text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:brightness-105"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Request Seedha Management
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
