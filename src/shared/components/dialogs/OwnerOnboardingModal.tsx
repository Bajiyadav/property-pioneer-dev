import { PropertyImage } from "@/shared/components/PropertyImage";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  createListing,
  uploadListingImage,
  getSignedVideoUploadUrl,
} from "@/modules/owner/services/ownerFunctions";
import { motion, AnimatePresence } from "framer-motion";

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
  Building,
  MapPin,
  IndianRupee,
  Video,
  XCircle,
  Home,
  Building2,
  ImagePlus,
  ShieldCheck,
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const create = useServerFn(createListing);
  const uploadImage = useServerFn(uploadListingImage);
  const getSignedUrl = useServerFn(getSignedVideoUploadUrl);

  const handleNext = () => {
    if (step === 1 && (!formData.title.trim() || !formData.locality.trim())) {
      toast.error("Please fill in the property title and locality.");
      return;
    }
    if (step === 3 && (!formData.rent || !formData.deposit)) {
      toast.error("Please fill in the rent and security deposit amounts.");
      return;
    }
    if (step === 4 && (!formData.phone.trim() || formData.phone.length < 10)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    setStep((s) => Math.min(s + 1, 6));
  };

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
      // Upload any selected photos and video first so the listing is created with real URLs.
      const urls: string[] = [];
      for (const photo of photos) {
        const { url } = await uploadImage({
          data: { dataUrl: photo.dataUrl, filename: photo.name },
        });
        urls.push(url);
      }

      // Upload video if selected
      let finalVideoUrl: string | undefined;
      if (videoFile) {
        setUploadingVideo(true);
        const { signedUrl, publicUrl } = await getSignedUrl({
          data: { filename: videoFile.name, mime: videoFile.type },
        });

        // Direct upload to Supabase storage bypassing serverless limits
        const res = await fetch(signedUrl, {
          method: "PUT",
          body: videoFile,
          headers: { "Content-Type": videoFile.type },
        });

        if (!res.ok) throw new Error("Failed to upload video to storage.");
        finalVideoUrl = publicUrl;
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
          // The modal has always asked for this at step 4 and then dropped it on
          // the floor, because `listingSchema` had no field to receive it. That
          // is why every row had `owner_phone` null and no enquiry ever reached
          // an owner.
          owner_phone: formData.phone,
          images: urls,
          video_url: finalVideoUrl,
          video_status: finalVideoUrl ? "pending" : undefined,
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

  const propertyTypes = [
    { value: "Apartment", icon: Building, label: "Apartment" },
    { value: "Independent House", icon: Home, label: "House" },
    { value: "Villa", icon: Building2, label: "Villa" },
  ];

  const cities = ["Hyderabad", "Bangalore", "Chennai"];
  const bedOptions = [1, 2, 3, 4];

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border p-0 overflow-hidden rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Free to list
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                Step {step} of 6
              </span>
            </div>
            <DialogTitle className="text-3xl font-bold tracking-tight text-foreground">
              List Your Property
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Upload property details in 2 minutes and receive direct WhatsApp leads from verified
              tenants.
            </DialogDescription>
          </DialogHeader>

          {/* Segmented Progress Indicator */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-out ${
                    step >= i ? "bg-primary" : "bg-transparent"
                  }`}
                  style={{ width: step >= i ? "100%" : "0%" }}
                />
              </div>
            ))}
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center space-y-6"
            >
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-600/10 text-emerald-600 ring-8 ring-emerald-600/5">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">Submitted for Review</h3>
                <p className="mx-auto max-w-md text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground font-semibold">
                    {formData.title || "Your property"}
                  </strong>{" "}
                  has been saved to your account. It will appear publicly as soon as a moderator
                  approves it.
                </p>
              </div>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setStep(1);
                  onClose();
                }}
                className="mt-4 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all active:scale-95"
              >
                Done & Return Home
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="relative min-h-[300px]">
              <AnimatePresence mode="wait" initial={false}>
                {step === 1 && (
                  <motion.div
                    key="step1"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1.5">
                      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" /> Basic Information
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Let's start with a catchy title and the location.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Property Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="e.g. Spacious 2 BHK Flat near Financial District"
                          className="w-full rounded-2xl border-2 border-border/50 bg-background/50 px-4 py-3 text-sm transition-colors focus:border-primary focus:bg-background focus:outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          City <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {cities.map((city) => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => setFormData({ ...formData, city })}
                              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                                formData.city === city
                                  ? "bg-primary text-primary-foreground shadow-md"
                                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Locality <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.locality}
                          onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                          placeholder="e.g. Gachibowli"
                          className="w-full rounded-2xl border-2 border-border/50 bg-background/50 px-4 py-3 text-sm transition-colors focus:border-primary focus:bg-background focus:outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1.5">
                      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" /> Property Details
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        What type of property are you listing?
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Property Type</label>
                        <div className="grid grid-cols-3 gap-3">
                          {propertyTypes.map((type) => {
                            const Icon = type.icon;
                            const isSelected = formData.propertyType === type.value;
                            return (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() =>
                                  setFormData({ ...formData, propertyType: type.value })
                                }
                                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-border/50 bg-background/50 text-muted-foreground hover:border-primary/50"
                                }`}
                              >
                                <Icon className="h-6 w-6" />
                                <span className="text-xs font-semibold">{type.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Bedrooms</label>
                        <div className="flex flex-wrap gap-3">
                          {bedOptions.map((num) => {
                            const isSelected = formData.bedrooms === num;
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setFormData({ ...formData, bedrooms: num })}
                                className={`flex h-12 w-16 items-center justify-center rounded-2xl border-2 transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary/5 text-primary font-bold"
                                    : "border-border/50 bg-background/50 text-muted-foreground hover:border-primary/50 font-medium"
                                }`}
                              >
                                {num} {num === 4 ? "+" : ""}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Area (Sq.ft){" "}
                          <span className="text-muted-foreground font-normal">(Optional)</span>
                        </label>
                        <input
                          type="number"
                          value={formData.areaSqft}
                          onChange={(e) =>
                            setFormData({ ...formData, areaSqft: Number(e.target.value) })
                          }
                          className="w-full rounded-2xl border-2 border-border/50 bg-background/50 px-4 py-3 text-sm transition-colors focus:border-primary focus:bg-background focus:outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1.5">
                      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <IndianRupee className="h-5 w-5 text-primary" /> Pricing
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Set a competitive price for your property.
                      </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Monthly Rent <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="number"
                            required
                            value={formData.rent}
                            onChange={(e) =>
                              setFormData({ ...formData, rent: Number(e.target.value) })
                            }
                            className="w-full rounded-2xl border-2 border-border/50 bg-background/50 py-3 pl-10 pr-4 text-sm font-medium transition-colors focus:border-primary focus:bg-background focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Security Deposit <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="number"
                            required
                            value={formData.deposit}
                            onChange={(e) =>
                              setFormData({ ...formData, deposit: Number(e.target.value) })
                            }
                            className="w-full rounded-2xl border-2 border-border/50 bg-background/50 py-3 pl-10 pr-4 text-sm font-medium transition-colors focus:border-primary focus:bg-background focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1.5">
                      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <ImagePlus className="h-5 w-5 text-primary" /> Photos & Contact
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Showcase your property and provide contact details.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Property Photos (up to 8, max 5 MB each)
                        </label>
                        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border/60 bg-secondary/30 hover:bg-secondary/50 transition-colors p-6 flex flex-col items-center justify-center gap-2 text-center group">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            multiple
                            onChange={(e) => onPickFiles(e.target.files)}
                            className="absolute inset-0 cursor-pointer opacity-0"
                          />
                          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <ImagePlus className="h-6 w-6" />
                          </div>
                          <span className="text-sm font-semibold text-primary">
                            Click or drag photos here
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Supports JPG, PNG, WEBP
                          </span>
                        </div>

                        {photos.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-3">
                            {photos.map((p, i) => (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={`${p.name}-${i}`}
                                className="relative group"
                              >
                                <PropertyImage
                                  src={p.dataUrl}
                                  alt={p.name}
                                  watermarkSize="xs"
                                  containerClassName="h-20 w-28 rounded-xl border-2 border-border/50 object-cover shadow-sm transition-transform group-hover:scale-[1.02]"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPhotos((prev) => prev.filter((_, k) => k !== i))
                                  }
                                  className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Description</label>
                        <textarea
                          rows={3}
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          placeholder="Highlight key features, amenities, or nearby landmarks…"
                          className="w-full rounded-2xl border-2 border-border/50 bg-background/50 px-4 py-3 text-sm transition-colors focus:border-primary focus:bg-background focus:outline-none resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Mobile Phone <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="10-digit mobile number"
                          className="w-full rounded-2xl border-2 border-border/50 bg-background/50 px-4 py-3 text-sm transition-colors focus:border-primary focus:bg-background focus:outline-none"
                        />
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1.5">
                          <ShieldCheck className="h-3 w-3 text-emerald-500" />
                          Your number is kept private and only shared with verified leads.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div
                    key="step5"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1.5">
                      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Video className="h-5 w-5 text-primary" /> Video Tour
                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-bold">
                          Highly Recommended
                        </span>
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Listings with video tours receive up to 5x more genuine leads.
                      </p>
                    </div>

                    <div>
                      {!videoPreview ? (
                        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border/60 bg-secondary/30 hover:bg-secondary/50 transition-colors p-10 flex flex-col items-center justify-center text-center group">
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 50 * 1024 * 1024) {
                                toast.error("Video is over the 50 MB limit.");
                                return;
                              }
                              setVideoFile(file);
                              setVideoPreview(URL.createObjectURL(file));
                            }}
                            className="absolute inset-0 cursor-pointer opacity-0"
                          />
                          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                            <Video className="h-8 w-8" />
                          </div>
                          <h5 className="text-base font-semibold text-foreground mb-1">
                            Upload a Walkthrough Video
                          </h5>
                          <p className="text-xs text-muted-foreground max-w-xs">
                            Drag & drop or click to upload. Max 50MB (MP4, WebM, QuickTime).
                          </p>
                        </div>
                      ) : (
                        <div className="relative rounded-2xl overflow-hidden border-2 border-border/50 bg-black aspect-video group shadow-lg">
                          <video
                            src={videoPreview}
                            className="w-full h-full object-contain"
                            controls
                            muted
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setVideoFile(null);
                              if (videoPreview) URL.revokeObjectURL(videoPreview);
                              setVideoPreview(null);
                            }}
                            className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-rose-500 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                            title="Remove video"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 6 && (
                  <motion.div
                    key="step6"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1.5">
                      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" /> Review & Publish
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Verify your details before submitting the listing.
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-3xl border-2 border-border/50 bg-secondary/20 relative">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
                      <div className="p-6 space-y-4 text-sm">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            Title
                          </p>
                          <p className="font-medium text-foreground text-base">
                            {formData.title || "Untitled Property"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                              Location
                            </p>
                            <p className="font-medium text-foreground">
                              {formData.locality}, {formData.city}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                              Configuration
                            </p>
                            <p className="font-medium text-foreground">
                              {formData.bedrooms} BHK {formData.propertyType}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                              Rent
                            </p>
                            <p className="font-medium text-foreground">
                              ₹{formData.rent.toLocaleString()}/mo
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                              Deposit
                            </p>
                            <p className="font-medium text-foreground">
                              ₹{formData.deposit.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          )}
        </div>

        {/* Fixed Footer Controls */}
        {!submitted && (
          <div className="flex items-center justify-between p-6 bg-card/80 backdrop-blur-xl border-t border-border">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={saving || uploadingVideo}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all active:scale-95"
              >
                Next Step <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={saving || uploadingVideo}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving || uploadingVideo ? (
                  uploadingVideo ? (
                    "Uploading video…"
                  ) : photos.length ? (
                    "Uploading photos…"
                  ) : (
                    "Submitting…"
                  )
                ) : (
                  <>
                    Submit Listing <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
