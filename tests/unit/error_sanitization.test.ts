import { describe, it, expect } from "vitest";
import { parseFriendlyError, getFriendlyErrorMessage } from "../../src/lib/errorUtils";

describe("Seedha Properties Error Sanitizer", () => {
  it("sanitizes network and offline errors into human-friendly language", () => {
    const fetchErr = new Error("Failed to fetch");
    const result = parseFriendlyError(fetchErr);
    expect(result.title).toBe("No internet connection");
    expect(result.message).toBe("Please check your internet connection and try again.");
    expect(result.actionLabel).toBe("Retry");
    expect(result.isOffline).toBe(true);
  });

  it("sanitizes timeout errors", () => {
    const timeoutErr = new Error("Request timed out / deadline exceeded");
    const result = parseFriendlyError(timeoutErr);
    expect(result.title).toBe("Taking longer than usual");
    expect(result.message).toBe("Please try again in a moment.");
    expect(result.actionLabel).toBe("Try Again");
    expect(result.isTimeout).toBe(true);
  });

  it("sanitizes authentication credential rejections", () => {
    const authErr = new Error("AuthApiError: Invalid login credentials");
    const msg = getFriendlyErrorMessage(authErr);
    expect(msg).toBe("Incorrect email/mobile or password. Please try again.");
  });

  it("sanitizes expired OTP errors", () => {
    const otpErr = new Error("AuthApiError: Token has expired or is invalid");
    const msg = getFriendlyErrorMessage(otpErr);
    expect(msg).toBe("Your OTP has expired. Please request a new OTP.");
  });

  it("sanitizes duplicate account errors", () => {
    const userErr = new Error("User already registered with this email");
    const msg = getFriendlyErrorMessage(userErr);
    expect(msg).toBe("An account with this email or mobile number already exists. Please sign in.");
  });

  it("sanitizes storage/upload errors", () => {
    const uploadErr = new Error("Storage upload failed: bucket permission denied");
    const msg = getFriendlyErrorMessage(uploadErr);
    expect(msg).toBe("We couldn't upload this file. Please try again.");
  });

  it("never exposes raw technical stack or database codes", () => {
    const dbErr = new Error("PGRST500: internal database connection error at line 42");
    const msg = getFriendlyErrorMessage(dbErr);
    expect(msg).not.toContain("PGRST");
    expect(msg).not.toContain("database");
    expect(msg).toBe("We couldn't connect right now. Please try again.");
  });
});
