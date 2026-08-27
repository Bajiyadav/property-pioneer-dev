import { useState } from "react";
import { toast } from "sonner";
import { Building2, Loader2, Phone, User, CheckCircle2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createPropertyListing } from "@/modules/owner/services/createPropertyListing.server";

export function AgentPropertySubmission({ onSuccess }: { onSuccess?: () => void }) {
  const submitProperty = useServerFn(createPropertyListing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      isAgentSubmission: true,
      title: formData.get("title") as string,
      property_type: formData.get("property_type") as string,
      listing_type: formData.get("listing_type") as string,
      city: formData.get("city") as string,
      locality: formData.get("locality") as string,
      address: formData.get("address") as string,
      price: Number(formData.get("price")),
      bedrooms: Number(formData.get("bedrooms")),
      bathrooms: Number(formData.get("bathrooms")),
      area_sqft: Number(formData.get("area_sqft")),
      description: formData.get("description") as string,
      owner_name: formData.get("owner_name") as string,
      owner_phone: formData.get("owner_phone") as string,
      owner_email: formData.get("owner_email") as string,
    };

    try {
      await submitProperty({ data });
      setIsSuccess(true);
      toast.success("Property listed successfully on behalf of owner.");
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit property.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
        <h3 className="text-xl font-bold text-foreground">Property Listed!</h3>
        <p className="text-muted-foreground mt-2">
          The property is now live and associated with the owner's phone number.
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-110"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight text-foreground">
          List on Behalf of Owner
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add properties to the platform quickly. When the owner signs up using their phone number,
          this property will automatically sync to their account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-4 sm:col-span-2">
            <h3 className="text-sm font-bold text-foreground border-b border-border/40 pb-2">
              Owner Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground">Owner Name *</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    name="owner_name"
                    type="text"
                    className="w-full rounded-xl border border-border/60 bg-background/50 pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Owner Phone *</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    name="owner_phone"
                    type="tel"
                    className="w-full rounded-xl border border-border/60 bg-background/50 pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">
                  Owner Email (Optional)
                </label>
                <input
                  name="owner_email"
                  type="email"
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="jane@example.com"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:col-span-2 mt-2">
            <h3 className="text-sm font-bold text-foreground border-b border-border/40 pb-2">
              Property Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Property Title *</label>
                <input
                  required
                  name="title"
                  type="text"
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="E.g. Modern 2BHK in Jubilee Hills"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Type *</label>
                <select
                  required
                  name="property_type"
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Listing For *</label>
                <select
                  required
                  name="listing_type"
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="rent">Rent</option>
                  <option value="sale">Sale</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">City *</label>
                <input
                  required
                  name="city"
                  type="text"
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Hyderabad"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Locality *</label>
                <input
                  required
                  name="locality"
                  type="text"
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Jubilee Hills"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Full Address *</label>
                <input
                  required
                  name="address"
                  type="text"
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Street, landmark, etc."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Price (₹) *</label>
                <input
                  required
                  name="price"
                  type="number"
                  min="0"
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="25000"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Area (Sq.ft) *</label>
                <input
                  required
                  name="area_sqft"
                  type="number"
                  min="0"
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="1200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Bedrooms *</label>
                <input
                  required
                  name="bedrooms"
                  type="number"
                  min="0"
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Bathrooms *</label>
                <input
                  required
                  name="bathrooms"
                  type="number"
                  min="0"
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Description *</label>
                <textarea
                  required
                  name="description"
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Property highlights..."
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
          {isSubmitting ? "Submitting Listing..." : "List Property"}
        </button>
      </form>
    </div>
  );
}
