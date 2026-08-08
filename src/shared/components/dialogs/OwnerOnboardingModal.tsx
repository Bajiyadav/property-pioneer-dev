import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createListing, uploadListingImage } from "@/modules/owner/services/ownerFunctions";

interface PickedPhoto {
  name: string;
  dataUrl: string;
}
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
    description: "",
    city: "Hyderabad",
    locality: "Gachibowli",
    propertyType: "Apartment",
    bedrooms: 2,
    areaSqft: 900,
    rent: 25000,
    deposit: 50000,
    phone: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  const create = useServerFn(createListing);
  const uploadImage = useServerFn(uploadListingImage);

  const handleNext = () => setStep((s) => Math.min(s + 1, 5));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      toast.error("Please sign in to publish a listing.");
      return;
    }

    setSaving(true);
    try {
      // Upload any selected photos first so the listing is created with real URLs.
      const urls: string[] = [];
      for (const photo of photos) {
        const { url } = await uploadImage({
          data: { dataUrl: photo.dataUrl, filename: photo.name },
        });
        urls.push(url);
      }

      await create({
        data: {
          title: formData.title.trim(),
          description:
            formData.description.trim() ||
            `${formData.bedrooms} BHK ${formData.propertyType} in ${formData.locality}, ${formData.city}.`,
          price: Number(formData.rent),
          city: formData.city,
          address: formData.locality,
          bedrooms: Number(formData.bedrooms),
          bathrooms: Math.max(1, Number(formData.bedrooms)),
          area_sqft: Number(formData.areaSqft) || 900,
          property_type: formData.propertyType,
          listing_type: "rent",
          images: urls,
        },
      });

      setSubmitted(true);
      toast.success("Listing submitted for review", {
        description: "It goes live as soon as a moderator approves it.",
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save the listing. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked: PickedPhoto[] = [];
    for (const file of Array.from(files).slice(0, 8)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is over the 5 MB limit.`);
        continue;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the file"));
        reader.readAsDataURL(file);
      });
      picked.push({ name: file.name, dataUrl });
    }
    setPhotos((prev) => [...prev, ...picked].slice(0, 8));
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
            <h3 className="text-xl font-semibold text-foreground">Listing submitted for review</h3>
            <p className="mx-auto max-w-md text-xs text-muted-foreground">
              <strong className="text-foreground">{formData.title || "Your property"}</strong> has
              been saved to your account
              {photos.length > 0
                ? ` with ${photos.length} photo${photos.length > 1 ? "s" : ""}`
                : ""}
              . It appears publicly as soon as a moderator approves it — you can track it under{" "}
              <strong className="text-foreground">My Listings</strong>.
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
                  Step 4: Photos & Contact
                </h4>

                <div>
                  <label htmlFor="listing-photos" className="text-xs font-medium text-foreground">
                    Property photos (up to 8, max 5 MB each)
                  </label>
                  <input
                    id="listing-photos"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    onChange={(e) => onPickFiles(e.target.files)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                  />
                  {photos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {photos.map((p, i) => (
                        <div key={`${p.name}-${i}`} className="relative">
                          <img
                            src={p.dataUrl}
                            alt={p.name}
                            className="h-14 w-20 rounded-lg border border-border object-cover"
                          />
                          <button
                            type="button"
                            aria-label={`Remove ${p.name}`}
                            onClick={() => setPhotos((prev) => prev.filter((_, k) => k !== i))}
                            className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose-600 text-[10px] font-bold text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="listing-desc" className="text-xs font-medium text-foreground">
                    Description
                  </label>
                  <textarea
                    id="listing-desc"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Furnishing, amenities, nearby landmarks…"
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>

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
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-6 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saving
                    ? photos.length
                      ? "Uploading photos…"
                      : "Submitting…"
                    : "Submit Listing FREE"}
                </button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
