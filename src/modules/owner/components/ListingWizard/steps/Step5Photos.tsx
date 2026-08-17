import React from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { ImagePlus, X, Sparkles, Video, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { StepProps } from "../types";

export function Step5Photos({ data, updateData }: StepProps) {
  const [imageUrl, setImageUrl] = React.useState("");

  const samplePhotos = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
  ];

  const addImage = () => {
    if (imageUrl.trim()) {
      updateData({ images: [...(data.images || []), imageUrl.trim()] });
      setImageUrl("");
      toast.success("Image added to gallery");
    }
  };

  const addSamplePhotos = () => {
    updateData({ images: [...(data.images || []), ...samplePhotos] });
    toast.success("Sample showcase photos added!");
  };

  const removeImage = (index: number) => {
    const newImages = [...(data.images || [])];
    newImages.splice(index, 1);
    updateData({ images: newImages });
  };

  const autoGenerateTitle = () => {
    const generated = `${data.bedrooms || 2} BHK ${data.property_type || "Apartment"} in ${data.locality || "Hyderabad"}`;
    updateData({ title: generated });
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 5 of 6</span>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
          <ImagePlus className="h-6 w-6 text-primary" /> Photos & Description
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          High quality photos get 5x more inquiries. Add photo URLs or browse sample showcase
          images.
        </p>
      </div>

      <div className="space-y-7">
        {/* Photo Upload Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground">Property Gallery</Label>
            {(!data.images || data.images.length === 0) && (
              <button
                type="button"
                onClick={addSamplePhotos}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" /> Add Sample Photos
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Paste photo image URL (e.g. https://...)..."
              value={imageUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImageUrl(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                e.key === "Enter" && (e.preventDefault(), addImage())
              }
              className="h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={addImage}
              className="px-5 h-11 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm shrink-0 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          {/* Grid of Images */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 mt-4">
            {/* Upload Box helper */}
            <div
              onClick={addSamplePhotos}
              className="aspect-video sm:aspect-square border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-secondary/30 hover:bg-secondary/60 hover:border-primary/50 cursor-pointer transition-all p-4 text-center group"
            >
              <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform mb-2">
                <ImagePlus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-foreground">Upload Images</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG or WebP</span>
            </div>

            {/* Added Images */}
            {(data.images || []).map((img: string, i: number) => (
              <div
                key={i}
                className="aspect-video sm:aspect-square rounded-2xl overflow-hidden relative group border-2 border-border/70 shadow-xs"
              >
                <img
                  src={img}
                  alt="Property preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-rose-500 transition-colors shadow-md cursor-pointer"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-border/60" />

        {/* Title & Description */}
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-sm font-semibold text-foreground">
                Property Title *
              </Label>
              <button
                type="button"
                onClick={autoGenerateTitle}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" /> Auto-Generate
              </button>
            </div>
            <Input
              id="title"
              placeholder="e.g. Spacious 2 BHK Gated Community Apartment in Madhapur"
              value={data.title || ""}
              className="h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 font-medium"
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
              placeholder="Highlight key features, society security, proximity to metro/IT parks, furnishing, water supply, and house rules..."
              className="min-h-[120px] rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20 p-3"
              value={data.description || ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateData({ description: e.target.value })
              }
            />
            <p className="text-[11px] text-muted-foreground text-right">
              {data.description?.length || 0}/5000 characters
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
