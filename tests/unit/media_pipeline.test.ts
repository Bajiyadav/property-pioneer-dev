import { describe, it, expect } from "vitest";
import {
  categorizePropertyImages,
  validateVideoUpload,
  getMediaCompletenessStatus,
  canDisplayPublicVideo,
  formatVideoDuration,
} from "@/modules/property/utils/mediaUtils";

describe("Media Pipeline and Quality Upgrades", () => {
  describe("Photo Categorization & Intelligent Ordering", () => {
    it("orders property photos coherently according to floor plan logic", () => {
      const unorderedImages = [
        {
          url: "https://images.unsplash.com/balcony.jpg",
          category: "balcony",
          label: "Balcony View",
        },
        {
          url: "https://images.unsplash.com/exterior.jpg",
          category: "exterior",
          label: "Building Front",
        },
        {
          url: "https://images.unsplash.com/bedroom.jpg",
          category: "bedroom",
          label: "Master Bedroom",
        },
        {
          url: "https://images.unsplash.com/living.jpg",
          category: "living_room",
          label: "Spacious Living",
        },
        {
          url: "https://images.unsplash.com/kitchen.jpg",
          category: "kitchen",
          label: "Modular Kitchen",
        },
        {
          url: "https://images.unsplash.com/bathroom.jpg",
          category: "bathroom",
          label: "Ensuite Bathroom",
        },
      ];

      const sorted = categorizePropertyImages(unorderedImages);
      expect(sorted[0].category).toBe("exterior");
      expect(sorted[1].category).toBe("living_room");
      expect(sorted[2].category).toBe("bedroom");
      expect(sorted[3].category).toBe("kitchen");
      expect(sorted[4].category).toBe("bathroom");
      expect(sorted[5].category).toBe("balcony");
    });

    it("handles legacy string array images gracefully without throwing", () => {
      const stringImages = [
        "https://images.unsplash.com/photo-1.jpg",
        "https://images.unsplash.com/photo-2.jpg",
      ];
      const sorted = categorizePropertyImages(stringImages);
      expect(sorted.length).toBe(2);
      expect(sorted[0].url).toBe("https://images.unsplash.com/photo-1.jpg");
    });
  });

  describe("Video Upload Validation", () => {
    it("accepts valid MP4 and WebM video files within size limits (<= 150MB)", () => {
      const validMp4 = {
        name: "tour.mp4",
        type: "video/mp4",
        size: 45 * 1024 * 1024, // 45 MB
      };
      const result = validateVideoUpload(validMp4);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("rejects invalid MIME types such as executables or non-video files", () => {
      const invalidFile = {
        name: "malicious.exe",
        type: "application/x-msdownload",
        size: 5 * 1024 * 1024,
      };
      const result = validateVideoUpload(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/Invalid file format/i);
    });

    it("rejects videos exceeding 150MB limit", () => {
      const oversizedVideo = {
        name: "huge_tour.mp4",
        type: "video/mp4",
        size: 200 * 1024 * 1024, // 200MB
      };
      const result = validateVideoUpload(oversizedVideo);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/exceeds/i);
    });
  });

  describe("Video Moderation & Public Visibility Rules", () => {
    it("only permits APPROVED videos to be displayed to public customers", () => {
      expect(canDisplayPublicVideo("approved", "https://cdn.urbanproperties.in/video.mp4")).toBe(
        true,
      );
      expect(canDisplayPublicVideo("pending", "https://cdn.urbanproperties.in/video.mp4")).toBe(
        false,
      );
      expect(canDisplayPublicVideo("rejected", "https://cdn.urbanproperties.in/video.mp4")).toBe(
        false,
      );
      expect(canDisplayPublicVideo("none", "")).toBe(false);
      expect(canDisplayPublicVideo(undefined, undefined)).toBe(false);
    });

    it("calculates media completeness status correctly", () => {
      expect(getMediaCompletenessStatus({ hasPhotos: true, videoStatus: "approved" })).toBe(
        "VIDEO AVAILABLE",
      );
      expect(getMediaCompletenessStatus({ hasPhotos: true, videoStatus: "pending" })).toBe(
        "VIDEO PENDING REVIEW",
      );
      expect(getMediaCompletenessStatus({ hasPhotos: true, videoStatus: "rejected" })).toBe(
        "PHOTO READY",
      );
      expect(getMediaCompletenessStatus({ hasPhotos: true, videoStatus: "none" })).toBe(
        "PHOTO READY",
      );
      expect(getMediaCompletenessStatus({ hasPhotos: false, videoStatus: "none" })).toBe(
        "MEDIA PENDING",
      );
    });

    it("formats video duration cleanly for UI badges and players", () => {
      expect(formatVideoDuration(65)).toBe("1:05");
      expect(formatVideoDuration(125)).toBe("2:05");
      expect(formatVideoDuration(45)).toBe("0:45");
      expect(formatVideoDuration(undefined)).toBe("");
    });
  });
});
