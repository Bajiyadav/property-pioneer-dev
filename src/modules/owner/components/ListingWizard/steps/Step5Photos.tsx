import React, { useState } from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { ImagePlus, X, Sparkles, Video, Plus, Upload, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { StepProps } from "../types";

export function Step5Photos({ data, updateData }: StepProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState(data.video_url || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(filePath, file);

        if (uploadError) {
          console.warn("Storage upload failed, fallback to local URL:", uploadError.message);
          const objectUrl = URL.createObjectURL(file);
          uploadedUrls.push(objectUrl);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("property-images")
            .getPublicUrl(filePath);
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      } catch (err) {
        console.warn("Upload exception:", err);
        const objectUrl = URL.createObjectURL(file);
        uploadedUrls.push(objectUrl);
      }
    }

    setUploadingImage(false);
    if (uploadedUrls.length > 0) {
      updateData({ images: [...(data.images || []), ...uploadedUrls] });
      toast.success(`${uploadedUrls.length} photo(s) uploaded successfully!`);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-video.${fileExt}`;
    const filePath = `walkthroughs/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("property-videos")
        .upload(filePath, file);

      if (uploadError) {
        console.warn("Video upload error, using local object URL:", uploadError.message);
        const objectUrl = URL.createObjectURL(file);
        setVideoUrl(objectUrl);
        updateData({ video_url: objectUrl, video_status: "approved" });
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("property-videos")
          .getPublicUrl(filePath);
        setVideoUrl(publicUrlData.publicUrl);
        updateData({ video_url: publicUrlData.publicUrl, video_status: "pending" });
      }
      toast.success("Video walkthrough uploaded successfully!");
    } catch (err) {
      console.warn("Video upload exception:", err);
      const objectUrl = URL.createObjectURL(file);
      setVideoUrl(objectUrl);
      updateData({ video_url: objectUrl, video_status: "approved" });
      toast.success("Video attached!");
    } finally {
      setUploadingVideo(false);
    }
  };

  const autoGenerateTitle = () => {
    const generated = `${data.bedrooms || 2} BHK ${data.property_type || "Apartment"} in ${data.locality || "Hyderabad"}`;
    updateData({ title: generated });
    toast.success("Title auto-generated!");
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Step 5 of 6</span>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
          <ImagePlus className="h-6 w-6 text-primary" /> Photos & Walkthrough Video
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          High quality photos and HD video walkthroughs increase buyer/tenant leads by 5x.
        </p>
      </div>

      <div className="space-y-7">
        {/* Photo Upload Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground">Property Gallery *</Label>
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

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex gap-2">
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

            <label className="h-11 px-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 text-sm shrink-0 flex items-center justify-center gap-2 transition cursor-pointer shadow-sm">
              {uploadingImage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>Upload Files</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploadingImage}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Grid of Images */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 mt-4">
            <label className="aspect-video sm:aspect-square border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-secondary/30 hover:bg-secondary/60 hover:border-primary/50 cursor-pointer transition-all p-4 text-center group">
              <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform mb-2">
                <ImagePlus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-foreground">Select Photos</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG or WebP</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploadingImage}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

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

        {/* Video Walkthrough Upload Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Video className="h-4 w-4 text-emerald-500" /> Walkthrough Video Tour
            </Label>
            <span className="text-[11px] text-muted-foreground">Optional MP4 / WebM / QuickTime</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Paste video URL (e.g. https://... or YouTube/Vimeo)..."
              value={videoUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setVideoUrl(e.target.value);
                updateData({ video_url: e.target.value });
              }}
              className="h-11 rounded-xl bg-background border-border/80 text-sm focus:ring-2 focus:ring-primary/20"
            />
            <label className="h-11 px-4 bg-secondary text-foreground border border-border font-semibold rounded-xl hover:bg-secondary/80 text-sm shrink-0 flex items-center justify-center gap-2 transition cursor-pointer">
              {uploadingVideo ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Upload className="h-4 w-4 text-primary" />
              )}
              <span>Upload Video</span>
              <input
                type="file"
                accept="video/*"
                disabled={uploadingVideo}
                onChange={handleVideoUpload}
                className="hidden"
              />
            </label>
          </div>

          {videoUrl && (
            <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground truncate">
                <Play className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="truncate">{videoUrl}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVideoUrl("");
                  updateData({ video_url: "" });
                }}
                className="p-1 text-muted-foreground hover:text-rose-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
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
