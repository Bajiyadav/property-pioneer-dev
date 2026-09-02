import { describe, it, expect } from "vitest";
import {
  validateUploadRequest,
  generateSafeObjectKey,
  createPresignedUploadUrl,
  createPresignedDownloadUrl,
  type PresignUploadParams,
} from "@/server/storage";

describe("S3 Pre-signed Media & Document Upload Module", () => {
  const validPhotoParams: PresignUploadParams = {
    folder: "property-photos",
    fileName: "living-room.jpg",
    contentType: "image/jpeg",
    fileSizeBytes: 2 * 1024 * 1024, // 2MB
    userId: "usr-123e4567-e89b-12d3-a456-426614174000",
  };

  const validKycParams: PresignUploadParams = {
    folder: "kyc-documents",
    fileName: "aadhar-card.pdf",
    contentType: "application/pdf",
    fileSizeBytes: 1.5 * 1024 * 1024, // 1.5MB
    userId: "usr-123e4567-e89b-12d3-a456-426614174000",
  };

  it("1. Accepts valid property photo parameters", () => {
    const res = validateUploadRequest(validPhotoParams);
    expect(res.valid).toBe(true);
  });

  it("2. Accepts valid private KYC document parameters", () => {
    const res = validateUploadRequest(validKycParams);
    expect(res.valid).toBe(true);
  });

  it("3. Rejects disallowed MIME types (e.g. .exe, .sh, .html)", () => {
    const invalidMimeParams: PresignUploadParams = {
      ...validPhotoParams,
      contentType: "application/x-msdownload",
      fileName: "malicious.exe",
    };
    const res = validateUploadRequest(invalidMimeParams);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Invalid file type");
  });

  it("4. Rejects file size exceeding maximum threshold (>10MB for photos)", () => {
    const oversizeParams: PresignUploadParams = {
      ...validPhotoParams,
      fileSizeBytes: 15 * 1024 * 1024, // 15MB
    };
    const res = validateUploadRequest(oversizeParams);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("exceeds limit");
  });

  it("5. Generates safe deterministic object keys and blocks path traversal attempts", () => {
    const pathTraversalAttempt = "../../../etc/passwd.jpg";
    const key = generateSafeObjectKey("property-photos", "user-123", pathTraversalAttempt);

    // Must NOT contain ../
    expect(key).not.toContain("..");
    expect(key).toMatch(/^property-photos\/user-123\/[a-f0-9-]+\.jpg$/);
  });

  it("6. Scopes object keys with entityId when provided", () => {
    const key = generateSafeObjectKey("property-photos", "user-123", "kitchen.png", "prop-999");
    expect(key).toMatch(/^property-photos\/user-123\/prop-999\/[a-f0-9-]+\.png$/);
  });

  it("7. Issues pre-signed upload URL with 5-minute (300s) expiration", async () => {
    const result = await createPresignedUploadUrl(validPhotoParams, 300);
    expect(result.uploadUrl).toBeDefined();
    expect(result.expiresInSeconds).toBe(300);
    expect(result.isPrivate).toBe(false);
    expect(result.objectKey).toContain("property-photos/usr-123e4567-e89b-12d3-a456-426614174000");
  });

  it("8. Marks KYC uploads as private and omits publicUrl", async () => {
    const result = await createPresignedUploadUrl(validKycParams, 300);
    expect(result.isPrivate).toBe(true);
    expect(result.publicUrl).toBeUndefined();
  });

  it("9. Generates pre-signed download URL for private documents", async () => {
    const objectKey = "kyc-documents/user-123/sample-uuid.pdf";
    const downloadUrl = await createPresignedDownloadUrl(objectKey, 300);
    expect(downloadUrl).toContain("kyc-documents/user-123/sample-uuid.pdf");
  });

  it("10. Rejects pre-signed download requests for invalid or unapproved folders", async () => {
    await expect(createPresignedDownloadUrl("unauthorized-folder/file.pdf")).rejects.toThrow(
      "Invalid private object key",
    );
  });
});
