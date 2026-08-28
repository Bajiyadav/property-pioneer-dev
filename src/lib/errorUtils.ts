/**
 * Seedha Properties — Centralized User-Friendly Error Sanitizer & Handler
 *
 * Guarantees that customers never see raw technical errors, HTTP status codes,
 * database errors, Supabase errors, Firebase errors, Axios/fetch errors,
 * or developer terminology.
 */

import { toast } from "sonner";

export interface FriendlyError {
  title: string;
  message: string;
  actionLabel?: string;
  isOffline?: boolean;
  isTimeout?: boolean;
  isAuth?: boolean;
}

/**
 * Maps any runtime error, API rejection, or exception into clean,
 * professional customer-facing language.
 */
export function getFriendlyErrorMessage(error: unknown, fallback?: string): string {
  const details = parseFriendlyError(error, fallback);
  return details.message;
}

/**
 * Returns a structured error object with title, message, and action label.
 */
export function parseFriendlyError(error: unknown, fallback?: string): FriendlyError {
  if (!error) {
    return {
      title: "Something went wrong",
      message: fallback || "We couldn't connect right now. Please try again.",
      actionLabel: "Try Again",
    };
  }

  // If user is offline in browser environment
  if (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.onLine === "boolean" &&
    !navigator.onLine
  ) {
    return {
      title: "No internet connection",
      message: "Please check your internet connection and try again.",
      actionLabel: "Retry",
      isOffline: true,
    };
  }

  let rawMessage = "";
  if (typeof error === "string") {
    rawMessage = error;
  } else if (error instanceof Error) {
    rawMessage = error.message;
  } else if (typeof error === "object" && error !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = error as any;
    rawMessage = obj.message || obj.error_description || obj.error || JSON.stringify(error);
  }

  const normalized = rawMessage.toLowerCase();

  // 1. Explicit Offline Indicators
  if (
    normalized.includes("err_internet_disconnected") ||
    normalized === "offline" ||
    normalized.includes("device is offline")
  ) {
    return {
      title: "No internet connection",
      message: "Please check your internet connection and try again.",
      actionLabel: "Retry",
      isOffline: true,
    };
  }

  // 2. Server / Network Connection Failures (Device is online or connection dropped)
  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("fetch failed") ||
    normalized.includes("networkerror") ||
    normalized.includes("network request failed") ||
    normalized.includes("socketexception") ||
    normalized.includes("econnrefused") ||
    normalized.includes("connection refused")
  ) {
    return {
      title: "Something went wrong",
      message: fallback || "We couldn't connect right now. Please try again.",
      actionLabel: "Try Again",
    };
  }

  // 2. Request Timeout
  if (
    normalized.includes("timeout") ||
    normalized.includes("aborted") ||
    normalized.includes("deadline exceeded") ||
    normalized.includes("taking longer")
  ) {
    return {
      title: "Taking longer than usual",
      message: "Please try again in a moment.",
      actionLabel: "Try Again",
      isTimeout: true,
    };
  }

  // 3. Authentication & OTP
  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid_grant") ||
    normalized.includes("wrong password") ||
    normalized.includes("incorrect email")
  ) {
    return {
      title: "Incorrect credentials",
      message: "Incorrect email/mobile or password. Please try again.",
      actionLabel: "Try Again",
      isAuth: true,
    };
  }

  if (
    normalized.includes("otp expired") ||
    normalized.includes("token has expired") ||
    normalized.includes("otp_expired") ||
    normalized.includes("invalid or expired otp") ||
    normalized.includes("token is expired")
  ) {
    return {
      title: "OTP expired",
      message: "Your OTP has expired. Please request a new OTP.",
      actionLabel: "Resend OTP",
      isAuth: true,
    };
  }

  if (normalized.includes("email not confirmed") || normalized.includes("email_not_confirmed")) {
    return {
      title: "Email not confirmed",
      message:
        "Your email address has not been confirmed. Please check your inbox for the confirmation link.",
      actionLabel: "Resend Email",
      isAuth: true,
    };
  }

  if (
    normalized.includes("already registered") ||
    normalized.includes("user already exists") ||
    normalized.includes("already exist")
  ) {
    return {
      title: "Account already exists",
      message: "An account with this email or mobile number already exists. Please sign in.",
      actionLabel: "Sign In",
      isAuth: true,
    };
  }

  if (
    normalized.includes("jwt expired") ||
    normalized.includes("session expired") ||
    normalized.includes("invalid refresh token") ||
    normalized.includes("session_not_found")
  ) {
    return {
      title: "Session expired",
      message: "Your session has expired. Please sign in again.",
      actionLabel: "Sign In",
      isAuth: true,
    };
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("over_email_send_rate_limit")
  ) {
    return {
      title: "Too many attempts",
      message: "Too many attempts. Please wait a moment and try again.",
      actionLabel: "Try Again",
    };
  }

  // 4. File / Image Uploads
  if (
    normalized.includes("upload") ||
    normalized.includes("storage") ||
    normalized.includes("bucket")
  ) {
    return {
      title: "Upload failed",
      message: "We couldn't upload this file. Please try again.",
      actionLabel: "Try Again",
    };
  }

  // 5. Enquiry & Lead Submissions
  if (normalized.includes("enquiry") || normalized.includes("visit request")) {
    return {
      title: "Enquiry not sent",
      message: "Your enquiry wasn't sent. Please try again.",
      actionLabel: "Try Again",
    };
  }

  // 6. Favorites
  if (normalized.includes("favorite") || normalized.includes("saved property")) {
    return {
      title: "Could not save property",
      message: "Couldn't save this property. Please try again.",
      actionLabel: "Try Again",
    };
  }

  // 7. Payments
  if (
    normalized.includes("payment") ||
    normalized.includes("razorpay") ||
    normalized.includes("stripe")
  ) {
    return {
      title: "Payment not completed",
      message: "Payment wasn't completed. Please try again.",
      actionLabel: "Try Again",
    };
  }

  // 8. Property details / Not Found
  if (
    normalized.includes("pgrst116") ||
    normalized.includes("row not found") ||
    normalized.includes("property not found")
  ) {
    return {
      title: "Property unavailable",
      message: "This property is no longer available.",
      actionLabel: "Browse Homes",
    };
  }

  // 9. Location Services
  if (
    normalized.includes("geolocation") ||
    normalized.includes("location permission") ||
    normalized.includes("user denied geolocation")
  ) {
    return {
      title: "Location unavailable",
      message: "Location access is unavailable. You can search by city or area instead.",
      actionLabel: "Select City",
    };
  }

  // 10. AI Assistant
  if (
    normalized.includes("gemini") ||
    normalized.includes("rag") ||
    normalized.includes("assistant")
  ) {
    return {
      title: "Assistant unavailable",
      message: "I'm having trouble responding right now. Please try again in a moment.",
      actionLabel: "Try Again",
    };
  }

  // Default server / general failure
  return {
    title: "Something went wrong",
    message: fallback || "We couldn't connect right now. Please try again.",
    actionLabel: "Try Again",
  };
}

/**
 * Displays a sanitized, user-friendly Sonner toast notification.
 */
export function showFriendlyErrorToast(error: unknown, fallback?: string): void {
  const { message } = parseFriendlyError(error, fallback);
  toast.error(message);
}
