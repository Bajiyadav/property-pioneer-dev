import { describe, expect, it } from "vitest";
import {
  createPresignedDownloadUrl,
  generateSafeObjectKey,
  objectKeyOwnerId,
  validateUploadRequest,
  type UploadFolder,
} from "@/server/storage";

/**
 * File and document security (Phase 4), web side.
 *
 * These mirror the Java suite in backend-java FileSecurityTests: web and mobile
 * upload through different backends, and a rule that holds on only one of them
 * is not a rule.
 */

const USER = "11111111-1111-4111-8111-111111111111";

function params(overrides: Partial<Parameters<typeof validateUploadRequest>[0]> = {}) {
  return {
    folder: "property-photos" as UploadFolder,
    fileName: "photo.jpg",
    contentType: "image/jpeg",
    fileSizeBytes: 1024,
    userId: USER,
    ...overrides,
  };
}

describe("upload validation", () => {
  it("rejects a folder that has no policy instead of defaulting to public", () => {
    expect(validateUploadRequest(params({ folder: "anything" as UploadFolder })).valid).toBe(false);
    expect(validateUploadRequest(params({ folder: "../../etc" as UploadFolder })).valid).toBe(
      false,
    );
  });

  it("rejects content types that a browser would execute", () => {
    for (const contentType of [
      "text/html",
      "image/svg+xml",
      "application/javascript",
      "application/x-msdownload",
    ]) {
      expect(validateUploadRequest(params({ contentType })).valid, contentType).toBe(false);
    }
  });

  it("enforces the per-folder size ceiling in both directions", () => {
    expect(validateUploadRequest(params({ fileSizeBytes: 11 * 1024 * 1024 })).valid).toBe(false);
    expect(validateUploadRequest(params({ fileSizeBytes: 0 })).valid).toBe(false);
    expect(validateUploadRequest(params({ fileSizeBytes: 1 })).valid).toBe(true);
  });

  it("allows a PDF only where the folder's policy permits one", () => {
    expect(
      validateUploadRequest(params({ folder: "rental-agreements", contentType: "application/pdf" }))
        .valid,
    ).toBe(true);
    expect(validateUploadRequest(params({ contentType: "application/pdf" })).valid).toBe(false);
  });
});

describe("object key generation", () => {
  it("never lets a submitted filename contribute a path", () => {
    const key = generateSafeObjectKey("kyc-documents", USER, "../../../etc/passwd.pdf");
    expect(key).not.toContain("..");
    expect(key.startsWith(`kyc-documents/${USER}/`)).toBe(true);
    expect(key.endsWith(".pdf")).toBe(true);
  });

  it("scrubs a user id that is not plain identifier characters", () => {
    const key = generateSafeObjectKey("kyc-documents", "../admin", "a.pdf");
    expect(key).not.toContain("..");
    expect(key.split("/")[1]).toBe("admin");
  });
});

describe("private key ownership", () => {
  it("reads the owner from the key's user segment", () => {
    expect(objectKeyOwnerId(`kyc-documents/${USER}/abc.pdf`)).toBe(USER);
    expect(objectKeyOwnerId(`rental-agreements/${USER}/entity-1/abc.pdf`)).toBe(USER);
  });

  it("refuses a key whose shape could smuggle a different prefix past the owner check", () => {
    for (const key of [
      `kyc-documents/${USER}/../victim/secret.pdf`,
      `/kyc-documents/${USER}/a.pdf`,
      `kyc-documents//${USER}/a.pdf`,
      `kyc-documents/${USER}/%2e%2e/a.pdf`,
      "kyc-documents",
      "",
    ]) {
      expect(() => objectKeyOwnerId(key), key).toThrow();
    }
  });
});

describe("private download pre-signing", () => {
  it("refuses to sign anything outside a private folder", async () => {
    await expect(createPresignedDownloadUrl(`property-photos/${USER}/a.jpg`)).rejects.toThrow();
    await expect(createPresignedDownloadUrl(`../kyc-documents/${USER}/a.pdf`)).rejects.toThrow();
  });

  it("refuses a traversal key even under a private prefix", async () => {
    await expect(
      createPresignedDownloadUrl(`kyc-documents/${USER}/../other/a.pdf`),
    ).rejects.toThrow();
  });
});
