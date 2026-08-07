import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Building,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function OwnerOnboardingModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    city: "Hyderabad",
    locality: "Gachibowli",
    propertyType: "Apartment",
    bedrooms: 2,
    rent: 25000,
    deposit: 50000,
    phone: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleNext = () => setStep((s) => Math.min(s + 1, 5));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Property submitted for 2-hour review!", {
      description: "Our Hyderabad verification team will verify owner PII and publish listing.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border p-6 rounded-3xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              100% Zero Brokerage
            </span>
            <span className="text-xs text-muted-foreground">Step {step} of 5</span>
          </div>
          <DialogTitle className="text-2xl font-semibold text-foreground mt-2">
            List Your Property for FREE
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Upload property details in 2 minutes and receive direct WhatsApp leads from verified
            tenants.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden my-4">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-600/10 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Listing Submitted Successfully!
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Your property listing for{" "}
              <strong className="text-foreground">{formData.title || "Hyderabad Apartment"}</strong>{" "}
              has been submitted. Our team will verify owner details within 2 hours.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setStep(1);
                onClose();
              }}
              className="rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow"
            >
              Done & Return Home
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Step 1: Basic Property Info
                </h4>
                <div>
                  <label className="text-xs font-medium text-foreground">Property Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Spacious 2 BHK Flat near Financial District"
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-foreground">City</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                    >
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Bangalore">Bangalore (Coming Soon)</option>
                      <option value="Chennai">Chennai (Coming Soon)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Locality</label>
                    <input
                      type="text"
                      required
                      value={formData.locality}
                      onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                      placeholder="e.g. Gachibowli"
                      className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Step 2: Property Type & Size
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-foreground">Property Type</label>
                    <select
                      value={formData.propertyType}
                      onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                    >
                      <option value="Apartment">Apartment / Flat</option>
                      <option value="Independent House">Independent House</option>
                      <option value="Villa">Villa</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Bedrooms</label>
                    <select
                      value={formData.bedrooms}
                      onChange={(e) =>
                        setFormData({ ...formData, bedrooms: Number(e.target.value) })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                    >
                      <option value={1}>1 BHK / Studio</option>
                      <option value={2}>2 BHK</option>
                      <option value={3}>3 BHK</option>
                      <option value={4}>4+ BHK</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Step 3: Rent & Security Deposit
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-foreground">Monthly Rent (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.rent}
                      onChange={(e) => setFormData({ ...formData, rent: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Security Deposit (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.deposit}
                      onChange={(e) =>
                        setFormData({ ...formData, deposit: Number(e.target.value) })
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Step 4: Contact & Phone Verification
                </h4>
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Mobile Phone (WhatsApp Leads)
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Your phone number is kept private and only shared securely via server contact
                    requests.
                  </p>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Step 5: Review & Publish
                </h4>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-xs space-y-1 text-foreground">
                  <p>
                    <strong>Title:</strong> {formData.title || "2 BHK Flat"}
                  </p>
                  <p>
                    <strong>Location:</strong> {formData.locality}, {formData.city}
                  </p>
                  <p>
                    <strong>Type:</strong> {formData.bedrooms} BHK {formData.propertyType}
                  </p>
                  <p>
                    <strong>Rent:</strong> ₹{formData.rent}/mo (Deposit: ₹{formData.deposit})
                  </p>
                </div>
              </div>
            )}

            {/* Modal Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-6 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500"
                >
                  Publish Listing FREE
                </button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
