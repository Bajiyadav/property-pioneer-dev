import React, { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ImagePlus,
  X,
  Sparkles,
  ShieldCheck,
  Star,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { StepProps } from "../types";
import { supabase } from "@/integrations/supabase/client";

export function Step5Photos({ data, updateData }: StepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = data.images || [];
  const coverIndex = data.cover_image_index ?? 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);
    const files = Array.from(e.target.files);
    const newImages = [...images];

    try {
      let uploadedCount = 0;
      for (const file of files) {
        // Validation: size max 10MB, type image
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file.`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 10MB.`);
          continue;
        }

        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `owner_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        let publicUrl = "";

        // Primary: Supabase Storage bucket 'property-images'
        const { error: uploadErr } = await supabase.storage
          .from("property-images")
          .upload(fileName, file, { upsert: true });

        if (!uploadErr) {
          const { data: pubData } = supabase.storage.from("property-images").getPublicUrl(fileName);
          publicUrl = pubData.publicUrl;
        } else {
          // Secondary fallback bucket 'property-media'
          const { error: fallbackErr } = await supabase.storage
            .from("property-media")
            .upload(fileName, file, { upsert: true });

          if (!fallbackErr) {
            const { data: pubData } = supabase.storage
              .from("property-media")
              .getPublicUrl(fileName);
            publicUrl = pubData.publicUrl;
          }
        }

        if (publicUrl) {
          newImages.push(publicUrl);
          uploadedCount++;
        }
        setUploadProgress(Math.round((uploadedCount / files.length) * 100));
      }

      if (uploadedCount > 0) {
        updateData({ images: newImages });
        toast.success(`${uploadedCount} real photo(s) uploaded successfully!`);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    const newCoverIndex =
      coverIndex >= newImages.length ? Math.max(0, newImages.length - 1) : coverIndex;
    updateData({ images: newImages, cover_image_index: newCoverIndex });
  };

  const setCoverImage = (index: number) => {
    updateData({ cover_image_index: index });
    toast.success(`Cover photo updated.`);
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(from, 1);
    newImages.splice(to, 0, moved);
    updateData({ images: newImages });
  };

  const generateAutoTitleAndDescription = () => {
    const size = data.bhk_type || `${data.bedrooms || 2} BHK`;
    const type = data.property_type || "Apartment";
    const loc = data.locality || data.city || "Hyderabad";
    const title = `${size} ${type} in ${loc}`;

    const desc = `${size} ${type} available for ${data.listing_type === "sale" ? "sale" : "rent"} in prime locality ${loc}, ${data.city || "Hyderabad"}. Features ${data.bathrooms || 2} bathrooms, ${data.area_sqft || 1200} sq.ft. built-up area, ${data.furnishing_status || "semi-furnished"} condition, with ${data.parking_covered ? `${data.parking_covered} covered parking` : "ample parking"}. Located in a prime neighborhood with 0% brokerage directly from owner.`;

    updateData({ title, description: desc });
    toast.success("Generated auto-title and description from property specifications!");
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <ImagePlus className="h-6 w-6 text-primary" /> Property Photos & Gallery
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload clear, real photos of your property. Listings with authentic photos get 5x more
          genuine enquiries.
        </p>
      </div>

      {/* Real Photos Warning Banner if 0 photos */}
      {images.length === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <h4 className="font-bold text-amber-950 dark:text-amber-200">
              Add property photos to improve buyer/tenant trust
            </h4>
            <p className="text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              Seedha Properties connects genuine owners with tenants directly. Verified real photos
              of the living room, bedrooms, kitchen, and exterior build immediate credibility.
            </p>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-card rounded-2xl border-2 border-dashed border-border/80 p-6 sm:p-10 text-center hover:border-primary/50 transition-all bg-background/50">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            {isUploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            ) : (
              <Upload className="h-7 w-7" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              {isUploading
                ? `Uploading photos (${uploadProgress}%)...`
                : "Upload Real Property Photos"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports JPEG, PNG, WebP up to 10MB each
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Browse Photos from Device"}
          </button>
        </div>
      </div>

      {/* Uploaded Photos Grid */}
      {images.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Uploaded Photos ({images.length})</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Real Storage Photos
              </span>
            </h3>
            <span className="text-xs text-muted-foreground">Click star to set Cover Image</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((url, idx) => {
              const isCover = (data.cover_image_index ?? 0) === idx;
              return (
                <div
                  key={url + idx}
                  className={`group relative rounded-xl overflow-hidden border-2 aspect-4/3 bg-secondary/50 transition-all ${
                    isCover ? "border-primary ring-2 ring-primary/20" : "border-border/80"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Property photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Badges & Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCoverImage(idx)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isCover
                            ? "bg-amber-500 text-white font-bold"
                            : "bg-black/60 text-white hover:bg-black"
                        }`}
                        title="Set as Cover Photo"
                      >
                        <Star className={`w-3.5 h-3.5 ${isCover ? "fill-white" : ""}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition cursor-pointer"
                        title="Delete Photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveImage(idx, idx - 1)}
                        className="p-1 rounded bg-black/60 text-white hover:bg-black disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-white font-bold bg-black/50 px-1.5 py-0.5 rounded">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => moveImage(idx, idx + 1)}
                        className="p-1 rounded bg-black/60 text-white hover:bg-black disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {isCover && (
                    <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Cover Photo
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Listing Title & Description */}
      <div className="bg-card rounded-2xl border border-border/70 p-5 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <h3 className="text-base font-bold text-foreground">Listing Title & Description</h3>
          <button
            type="button"
            onClick={generateAutoTitleAndDescription}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Auto-Generate
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold text-foreground">
              Property Title *
            </Label>
            <Input
              id="title"
              placeholder="e.g. 2 BHK Modern Apartment in Madhapur"
              value={data.title || ""}
              className="h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateData({ title: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-foreground">
              Detailed Description *
            </Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Describe your property highlights, nearby landmarks, society amenities, and any specific preferences..."
              value={data.description || ""}
              className="rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20"
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateData({ description: e.target.value })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
