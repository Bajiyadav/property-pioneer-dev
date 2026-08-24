import { describe, it, expect } from "vitest";
import { renderEmail } from "@/shared/services/email/renderEmail";
import {
  otpEmail,
  welcomeEmail,
  getEmailPreviews,
  type EmailTemplateKey,
} from "@/shared/services/email/templates";

const EMAIL_PREVIEWS = getEmailPreviews();

/**
 * Centralized email template suite. Verifies branding, HTML+text parity, name
 * handling, correct subjects, and that nothing sensitive/debug ever leaks into a
 * rendered email. Pure rendering only — no email is sent.
 */

const ALL = Object.entries(EMAIL_PREVIEWS) as [
  EmailTemplateKey,
  (typeof EMAIL_PREVIEWS)[EmailTemplateKey],
][];

describe("every template renders HTML + plain text with Seedha branding", () => {
  it.each(ALL)("%s has non-empty html and text", (_key, email) => {
    expect(email.subject.trim().length).toBeGreaterThan(0);
    expect(email.htmlBody).toContain("<!doctype html>");
    expect(email.htmlBody).toContain("<table"); // email-safe table layout
    expect(email.htmlBody).toContain("SEEDHA");
    expect(email.textBody.trim().length).toBeGreaterThan(0);
  });

  it.each(ALL)("%s carries the professional footer (©, site, privacy, terms)", (_key, email) => {
    expect(email.htmlBody).toContain("© ");
    expect(email.htmlBody).toContain("Privacy Policy");
    expect(email.htmlBody).toContain("Terms of Service");
    expect(email.htmlBody).toContain("support@seedhaproperties.com");
    expect(email.textBody).toContain("Privacy Policy");
    expect(email.textBody).toContain("Terms of Service");
  });

  it.each(ALL)("%s never leaks secrets, debug output, or raw internals", (_key, email) => {
    const blob = `${email.subject}\n${email.htmlBody}\n${email.textBody}`.toLowerCase();
    for (const bad of [
      "resend_api_key",
      "service_role",
      "process.env",
      "access_token",
      "refresh_token",
      "bearer ",
      "undefined",
      "[object object]",
      "stack trace",
    ]) {
      expect(blob).not.toContain(bad);
    }
  });
});

describe("subjects follow the approved naming, never the banned ones", () => {
  it("uses the specified subjects", () => {
    expect(EMAIL_PREVIEWS.otp.subject).toBe("Your Seedha Properties verification code");
    expect(EMAIL_PREVIEWS.welcome.subject).toBe("Welcome to Seedha Properties");
    expect(EMAIL_PREVIEWS.listing_submitted.subject).toBe(
      "Your property listing has been submitted",
    );
    expect(EMAIL_PREVIEWS.property_approved.subject).toBe(
      "Your property is now live on Seedha Properties",
    );
    expect(EMAIL_PREVIEWS.property_enquiry.subject).toBe("New enquiry for your property");
    expect(EMAIL_PREVIEWS.visit_scheduled.subject).toBe("Property visit scheduled");
    expect(EMAIL_PREVIEWS.payment_success.subject).toBe("Payment successful – Seedha Properties");
    expect(EMAIL_PREVIEWS.plan_active.subject).toBe("Your Seedha Properties plan is active");
  });

  it("no template uses a banned/dev subject", () => {
    const banned = ["Email Notification", "Test Email", "Supabase Email", "OTP", "New Message"];
    for (const [, email] of ALL) {
      expect(banned).not.toContain(email.subject);
    }
  });
});

describe("OTP email", () => {
  it("shows the OTP prominently in both html and text, with security guidance", () => {
    const email = otpEmail({ userName: "Priya", otp: "482913", expiry: "5 minutes" });
    expect(email.subject).toBe("Your Seedha Properties verification code");
    expect(email.htmlBody).toContain("482913");
    expect(email.textBody).toContain("482913");
    expect(email.htmlBody.toLowerCase()).toContain("do not share");
    expect(email.textBody).toContain("5 minutes");
    // Never asks for or exposes anything beyond the code.
    expect(email.htmlBody).toContain("Hello Priya,");
  });
});

describe("name handling (never re-ask; fall back to 'there')", () => {
  it("uses the provided name when present", () => {
    expect(welcomeEmail({ userName: "Aarav" }).htmlBody).toContain("Hello Aarav,");
  });
  it("falls back to 'Hello there,' when no name exists", () => {
    const noName = welcomeEmail({ userName: null });
    expect(noName.htmlBody).toContain("Hello there,");
    expect(noName.textBody).toContain("Hello there,");
    expect(welcomeEmail({}).htmlBody).toContain("Hello there,");
  });
});

describe("renderEmail escapes user-provided content (no HTML injection)", () => {
  it("escapes angle brackets in values", () => {
    const out = renderEmail({
      subject: "x",
      title: "x",
      greetingName: "<script>alert(1)</script>",
      infoRows: [{ label: "Message", value: "<b>hi</b>" }],
    });
    expect(out.htmlBody).not.toContain("<script>alert(1)</script>");
    expect(out.htmlBody).toContain("&lt;script&gt;");
    expect(out.htmlBody).toContain("&lt;b&gt;hi&lt;/b&gt;");
  });
});
