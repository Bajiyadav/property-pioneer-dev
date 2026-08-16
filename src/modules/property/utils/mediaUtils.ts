export type ImageCategory =
  | "exterior"
  | "living_room"
  | "bedroom"
  | "kitchen"
  | "bathroom"
  | "balcony"
  | "dining"
  | "amenities"
  | "floorplan"
  | "other";

export interface PropertyImageItem {
  url: string;
  category?: ImageCategory | string;
  label?: string;
  isPrimary?: boolean;
}

export const CATEGORY_ORDER: Record<string, number> = {
  exterior: 1,
  living_room: 2,
  living: 2,
  hall: 2,
  bedroom: 3,
  master_bedroom: 3,
  kitchen: 4,
  bathroom: 5,
  washroom: 5,
  balcony: 6,
  dining: 7,
  amenities: 8,
  floorplan: 9,
  other: 10,
};

/**
 * Orders property photos coherently based on architectural walkthrough logic:
 * 1. Exterior -> 2. Living -> 3. Bedroom -> 4. Kitchen -> 5. Bathroom -> 6. Balcony -> 7. Dining -> 8. Amenities
 */
export function categorizePropertyImages(
  images: (PropertyImageItem | string)[],
): PropertyImageItem[] {
  if (!images || !Array.isArray(images)) return [];

  const normalized: PropertyImageItem[] = images.map((img) => {
    if (typeof img === "string") {
      return { url: img, category: "other" };
    }
    return img;
  });

  return [...normalized].sort((a, b) => {
    const orderA = CATEGORY_ORDER[a.category?.toLowerCase() || "other"] ?? 99;
    const orderB = CATEGORY_ORDER[b.category?.toLowerCase() || "other"] ?? 99;
    return orderA - orderB;
  });
}

export interface VideoValidationResult {
  isValid: boolean;
  error?: string;
}

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

const MAX_VIDEO_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB

/**
 * Validates video file format, extension, and size for owner video uploads.
 */
export function validateVideoUpload(file: {
  name: string;
  type: string;
  size: number;
}): VideoValidationResult {
  if (!file) {
    return { isValid: false, error: "No video file provided." };
  }

  const hasValidType = ALLOWED_VIDEO_TYPES.includes(file.type.toLowerCase());
  const hasValidExt = /\.(mp4|webm|mov|m4v)$/i.test(file.name);

  if (!hasValidType && !hasValidExt) {
    return {
      isValid: false,
      error: "Invalid file format. Please upload MP4, WebM, or MOV videos.",
    };
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds 150MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please compress your video.`,
    };
  }

  return { isValid: true };
}

export type VideoModerationStatus = "approved" | "pending" | "rejected" | "none";

/**
 * Determines whether a video tour should be shown to public marketplace customers.
 * Only APPROVED videos with valid URLs are shown to guests and buyers.
 */
export function canDisplayPublicVideo(status?: string | null, videoUrl?: string | null): boolean {
  if (!videoUrl || videoUrl.trim() === "") return false;
  return status?.toLowerCase() === "approved";
}

export type MediaCompletenessStatus =
  "VIDEO AVAILABLE" | "VIDEO PENDING REVIEW" | "PHOTO READY" | "MEDIA PENDING";

/**
 * Returns a media status badge string for listings and cards.
 */
export function getMediaCompletenessStatus(params: {
  hasPhotos: boolean;
  videoStatus?: string | null;
}): MediaCompletenessStatus {
  const { hasPhotos, videoStatus } = params;

  if (videoStatus === "approved") {
    return "VIDEO AVAILABLE";
  }
  if (videoStatus === "pending") {
    return "VIDEO PENDING REVIEW";
  }
  if (hasPhotos) {
    return "PHOTO READY";
  }
  return "MEDIA PENDING";
}

/**
 * Formats duration in seconds into mm:ss format for badges and players.
 */
export function formatVideoDuration(seconds?: number | null): string {
  if (typeof seconds !== "number" || isNaN(seconds) || seconds <= 0) {
    return "";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
