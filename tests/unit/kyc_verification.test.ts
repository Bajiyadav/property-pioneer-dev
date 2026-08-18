import { describe, it, expect } from "vitest";
import { validateKYCFile } from "@/modules/owner/services/kycService";

describe("Owner KYC Document Verification", () => {
  it("approves valid image and PDF formats", () => {
    const validPng = new File(["test-content"], "aadhar.png", { type: "image/png" });
    const validPdf = new File(["pdf-content"], "electricity_bill.pdf", { type: "application/pdf" });

    expect(validateKYCFile(validPng).valid).toBe(true);
    expect(validateKYCFile(validPdf).valid).toBe(true);
  });

  it("rejects unsupported file formats like executables or word docs", () => {
    const invalidDoc = new File(["exe-content"], "malware.exe", {
      type: "application/x-msdownload",
    });
    const result = validateKYCFile(invalidDoc);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Only JPG, PNG, WEBP, or PDF");
  });

  it("rejects files exceeding 5MB limit", () => {
    // 6MB dummy buffer
    const largeBuffer = new Uint8Array(6 * 1024 * 1024);
    const oversizedFile = new File([largeBuffer], "heavy_tax_receipt.pdf", {
      type: "application/pdf",
    });

    const result = validateKYCFile(oversizedFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("less than 5 MB");
  });
});
