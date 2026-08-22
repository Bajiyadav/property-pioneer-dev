import { useState } from "react";
import {
  X,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  FileArchive,
  Film,
  Image as ImageIcon,
  ShieldCheck,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { downloadFilesAsZip, triggerSingleDownload } from "@/lib/zipHelper";
import type { Property } from "@/modules/property/services/propertyQueries";

interface PropertyMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  userRole: "admin" | "agent";
}

export function PropertyMediaModal({
  isOpen,
  onClose,
  property,
  userRole,
}: PropertyMediaModalProps) {
  const queryClient = useQueryClient();

  const [images, setImages] = useState<string[]>(property.images || []);
  const [videoUrl, setVideoUrl] = useState<string | null>(property.video_url || null);
  const [mediaStatus, setMediaStatus] = useState<"pending_review" | "verified" | "needs_reshoot">(
    property.media_status ?? "pending_review",
  );
  const [mediaNotes, setMediaNotes] = useState<string>(property.media_notes ?? "");

  const [uploading, setUploading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  // Helper for safe Supabase file upload with offline Blob fallback
  const uploadMediaFile = async (
    file: File,
    bucket: "property-images" | "property-videos",
  ): Promise<string> => {
    const ext = file.name.split(".").pop() || "bin";
    const filePath = `property-${property.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    try {
      const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.warn(
        "Supabase Storage upload failed or offline. Generating local Object URL fallback.",
        err,
      );
      toast.info("Supabase Storage offline — media cached locally for session preview.");
      return URL.createObjectURL(file);
    }
  };

  // Upload new image gallery item
  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const url = await uploadMediaFile(files[i], "property-images");
      newUrls.push(url);
    }

    setImages((prev) => [...prev, ...newUrls]);
    setUploading(false);
    toast.success(`Added ${newUrls.length} new photo(s) to gallery.`);
  };

  // Replace photo at specific index
  const handleReplacePhoto = async (index: number, file: File) => {
    setUploading(true);
    const newUrl = await uploadMediaFile(file, "property-images");
    setImages((prev) => {
      const updated = [...prev];
      updated[index] = newUrl;
      return updated;
    });
    setUploading(false);
    toast.success(`Replaced photo #${index + 1}`);
  };

  // Upload or replace video
  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadMediaFile(file, "property-videos");
    setVideoUrl(url);
    setUploading(false);
    toast.success("Walkthrough video updated.");
  };

  // Reorder photos (move left/right)
  const handleMovePhoto = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[from];
      updated[from] = updated[to];
      updated[to] = temp;
      return updated;
    });
  };

  // Delete individual photo
  const handleDeletePhoto = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    toast.info(`Removed photo #${index + 1}`);
  };

  // Download all media as .zip package
  const handleDownloadZip = async () => {
    setZipping(true);
    setZipProgress(0);

    const itemsToDownload = images.map((img, idx) => ({
      name: `Photo_${idx + 1}_${property.id.slice(0, 5)}.jpg`,
      url: img,
    }));

    if (videoUrl) {
      itemsToDownload.push({
        name: `Walkthrough_Video_${property.id.slice(0, 5)}.mp4`,
        url: videoUrl,
      });
    }

    const cleanTitle = property.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20);
    await downloadFilesAsZip(itemsToDownload, `${cleanTitle}_Media.zip`, (pct) =>
      setZipProgress(pct),
    );

    setZipping(false);
    toast.success("Media ZIP package generated and downloaded!");
  };

  // Save changes to database
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          images,
          video_url: videoUrl,
          media_status: mediaStatus,
          media_notes: mediaNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", property.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["property-feed"] });
      queryClient.invalidateQueries({ queryKey: ["property", property.id] });
      queryClient.invalidateQueries({ queryKey: ["agent"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });

      toast.success("Media management & moderation status updated!");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save media changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/60 p-5 bg-secondary/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase">
                {userRole} Media Inspector
              </span>
              <h2 className="font-extrabold text-foreground text-lg truncate max-w-md">
                {property.title}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Locality:{" "}
              <strong className="text-foreground">{property.locality || property.city}</strong> ·
              ID: {property.id}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={zipping || (images.length === 0 && !videoUrl)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary border border-border text-foreground font-bold text-xs hover:bg-secondary/80 disabled:opacity-50 transition cursor-pointer"
            >
              {zipping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>{zipProgress}%</span>
                </>
              ) : (
                <>
                  <FileArchive className="h-4 w-4 text-emerald-500" />
                  <span>Download All (.zip)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Moderation Status Banner */}
          <div className="p-4 rounded-2xl border border-border bg-secondary/40 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Listing Media Moderation &amp;
              Verification Tag
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMediaStatus("verified")}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  mediaStatus === "verified"
                    ? "bg-emerald-600/10 text-emerald-600 border-emerald-600 dark:text-emerald-400"
                    : "bg-background text-muted-foreground border-border hover:border-emerald-600/50"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" /> Media Verified by Agent
              </button>

              <button
                type="button"
                onClick={() => setMediaStatus("pending_review")}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  mediaStatus === "pending_review"
                    ? "bg-amber-600/10 text-amber-600 border-amber-600 dark:text-amber-400"
                    : "bg-background text-muted-foreground border-border hover:border-amber-600/50"
                }`}
              >
                <Clock className="h-4 w-4" /> Pending Media Review
              </button>

              <button
                type="button"
                onClick={() => setMediaStatus("needs_reshoot")}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  mediaStatus === "needs_reshoot"
                    ? "bg-rose-600/10 text-rose-600 border-rose-600 dark:text-rose-400"
                    : "bg-background text-muted-foreground border-border hover:border-rose-600/50"
                }`}
              >
                <AlertTriangle className="h-4 w-4" /> Needs Re-Shoot
              </button>
            </div>

            <textarea
              value={mediaNotes}
              onChange={(e) => setMediaNotes(e.target.value)}
              placeholder="Add feedback or notes for property owner (e.g. 'Living room photo blurry, video missing kitchen view')..."
              className="w-full p-3 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              rows={2}
            />
          </div>

          {/* Photo Gallery Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" /> Photo Gallery ({images.length}{" "}
                Photos)
              </h3>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow hover:bg-primary/90 transition cursor-pointer">
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                <span>Upload New Photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddPhotos}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {images.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-border text-center space-y-2">
                <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-xs font-bold text-foreground">
                  No photos uploaded for this property
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Click 'Upload New Photos' to add high-resolution gallery images.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-2xl border border-border/80 bg-background overflow-hidden shadow-sm flex flex-col"
                  >
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      <img
                        src={img}
                        alt={`Listing media #${idx + 1}`}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white font-bold text-[10px] backdrop-blur-md">
                        #{idx + 1} {idx === 0 ? "Cover Photo" : ""}
                      </span>

                      {/* Floating actions */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            triggerSingleDownload(
                              img,
                              `Photo_${idx + 1}_${property.id.slice(0, 5)}.jpg`,
                            )
                          }
                          className="p-2 rounded-full bg-white/90 text-black hover:bg-white shadow transition cursor-pointer"
                          title="Download photo"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(idx)}
                          className="p-2 rounded-full bg-rose-600 text-white hover:bg-rose-500 shadow transition cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Controls Footer */}
                    <div className="p-2.5 bg-card border-t border-border/50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMovePhoto(idx, idx - 1)}
                          className="p-1 rounded bg-secondary text-foreground disabled:opacity-30 hover:bg-secondary/80 cursor-pointer"
                          title="Move left"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={idx === images.length - 1}
                          onClick={() => handleMovePhoto(idx, idx + 1)}
                          className="p-1 rounded bg-secondary text-foreground disabled:opacity-30 hover:bg-secondary/80 cursor-pointer"
                          title="Move right"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <label className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" /> Replace
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleReplacePhoto(idx, f);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Walkthrough Video Section */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Film className="h-4 w-4 text-emerald-500" /> Walkthrough Video Tour
              </h3>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary border border-border text-foreground text-xs font-bold hover:bg-secondary/80 transition cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                <span>{videoUrl ? "Replace Video" : "Upload Video"}</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleUploadVideo}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {videoUrl ? (
              <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
                <video src={videoUrl} controls className="w-full max-h-64 rounded-xl bg-black" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-sm">{videoUrl}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        triggerSingleDownload(videoUrl, `Video_${property.id.slice(0, 5)}.mp4`)
                      }
                      className="px-3 py-1 bg-secondary rounded-lg text-foreground font-bold hover:bg-secondary/80 flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Video
                    </button>
                    <button
                      onClick={() => {
                        setVideoUrl(null);
                        toast.info("Removed walkthrough video.");
                      }}
                      className="px-3 py-1 bg-rose-600/10 text-rose-600 rounded-lg font-bold hover:bg-rose-600/20 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-border text-center space-y-1 bg-secondary/20">
                <Film className="h-6 w-6 text-muted-foreground mx-auto" />
                <p className="text-xs font-bold text-foreground">No video tour attached</p>
                <p className="text-[11px] text-muted-foreground">
                  Upload an MP4/WebM video walkthrough for tenant virtual tours.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-border/60 bg-secondary/30 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow-lg hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>Save Media &amp; Verification Status</span>
          </button>
        </div>
      </div>
    </div>
  );
}
