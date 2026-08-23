/**
 * Seedha Properties — transactional email templates.
 *
 * ONE template per email type, each returning { subject, htmlBody, textBody } via
 * the shared `renderEmail` layout so every email carries the same Seedha design.
 * Callers pass already-available data (name from profile/auth, IDs from the
 * record) — templates never ask for anything and never invent contact details.
 *
 * Business logic that decides WHEN to send lives in the existing services; these
 * only decide HOW an email looks.
 */

import { APP_URL } from "@/config/app";
import { renderEmail, type RenderedEmail } from "./renderEmail";

const url = (path: string) => `${APP_URL}${path.startsWith("/") ? path : `/${path}`}`;

// ── A. Email OTP ────────────────────────────────────────────────────────────
export function otpEmail(input: {
  userName?: string | null;
  otp: string;
  expiry: string;
}): RenderedEmail {
  return renderEmail({
    subject: "Your Seedha Properties verification code",
    preheader: "Your one-time verification code",
    title: "Verify your email",
    greetingName: input.userName,
    tone: "security",
    intro: ["Your verification code is:"],
    highlight: { label: "Verification code", value: input.otp },
    outro: [`This code will expire in ${input.expiry}.`],
    securityNotes: [
      "For your security, do not share this code with anyone.",
      "Seedha Properties will never ask you to share your OTP.",
      "If you did not request this code, you can safely ignore this email.",
    ],
  });
}

// ── B. Welcome / account created ─────────────────────────────────────────────
export function welcomeEmail(input: { userName?: string | null }): RenderedEmail {
  return renderEmail({
    subject: "Welcome to Seedha Properties",
    preheader: "Your Seedha Properties account is ready",
    title: "Welcome to Seedha Properties",
    greetingName: input.userName,
    intro: ["Your account has been successfully created.", "You can now:"],
    infoRows: [
      { label: "Browse properties", value: "Explore verified 0% brokerage homes" },
      { label: "Save properties", value: "Shortlist homes across devices" },
      { label: "Contact owners", value: "Reach verified owners directly" },
      { label: "Schedule visits", value: "Plan walkthroughs that suit you" },
      { label: "List your property", value: "Publish your own listing for free" },
      { label: "Manage activity", value: "Track your enquiries and listings" },
    ],
    cta: { label: "Explore Properties", url: url("/properties") },
  });
}

// ── C. Property listing submitted ────────────────────────────────────────────
export function listingSubmittedEmail(input: {
  userName?: string | null;
  propertyTitle: string;
  locality: string;
  city: string;
  listingId: string;
  status: string;
  requiresVerification?: boolean;
}): RenderedEmail {
  const outro = input.requiresVerification
    ? [
        "Your listing will be reviewed by our team before it goes live. We will email you once it has been approved.",
      ]
    : [];
  return renderEmail({
    subject: "Your property listing has been submitted",
    preheader: "We received your property listing",
    title: "Your property listing has been submitted",
    greetingName: input.userName,
    intro: ["Your property listing has been successfully submitted."],
    infoRows: [
      { label: "Property", value: input.propertyTitle },
      { label: "Location", value: `${input.locality}, ${input.city}` },
      { label: "Listing ID", value: input.listingId },
      { label: "Status", value: input.status },
    ],
    cta: { label: "View Your Listing", url: url(`/properties/${input.listingId}`) },
    outro,
  });
}

// ── D. Property approved / live ──────────────────────────────────────────────
export function propertyApprovedEmail(input: {
  userName?: string | null;
  propertyTitle: string;
  location: string;
  listingId: string;
  status?: string;
}): RenderedEmail {
  return renderEmail({
    subject: "Your property is now live on Seedha Properties",
    preheader: "Your property is now visible to users",
    title: "Your property is now live",
    greetingName: input.userName,
    intro: ["Your property is now visible to users on Seedha Properties."],
    infoRows: [
      { label: "Property", value: input.propertyTitle },
      { label: "Location", value: input.location },
      { label: "Listing status", value: input.status ?? "Live" },
    ],
    cta: { label: "View Property", url: url(`/properties/${input.listingId}`) },
  });
}

// ── E. Property enquiry (to owner) ───────────────────────────────────────────
export function propertyEnquiryEmail(input: {
  ownerName?: string | null;
  propertyTitle: string;
  location: string;
  enquirerName: string;
  message: string;
  enquiryUrl?: string;
}): RenderedEmail {
  return renderEmail({
    subject: "New enquiry for your property",
    preheader: "You have a new property enquiry",
    title: "New enquiry for your property",
    greetingName: input.ownerName,
    intro: ["You have received a new enquiry for your property."],
    infoRows: [
      { label: "Property", value: input.propertyTitle },
      { label: "Location", value: input.location },
      { label: "Enquirer", value: input.enquirerName },
      { label: "Message", value: input.message },
    ],
    cta: { label: "View Enquiry", url: input.enquiryUrl ?? url("/dashboard") },
    outro: [
      "For your safety, respond through Seedha Properties. We never share your private contact details without your consent.",
    ],
  });
}

// ── F. Visit scheduled ───────────────────────────────────────────────────────
export function visitScheduledEmail(input: {
  userName?: string | null;
  propertyTitle: string;
  date: string;
  time: string;
  location: string;
  visitorName?: string;
  visitUrl?: string;
}): RenderedEmail {
  const rows = [
    { label: "Property", value: input.propertyTitle },
    { label: "Date", value: input.date },
    { label: "Time", value: input.time },
    { label: "Location", value: input.location },
  ];
  if (input.visitorName) rows.push({ label: "Visitor", value: input.visitorName });
  return renderEmail({
    subject: "Property visit scheduled",
    preheader: "Your property visit is confirmed",
    title: "Property visit scheduled",
    greetingName: input.userName,
    intro: ["Your property visit has been scheduled."],
    infoRows: rows,
    cta: { label: "View Visit Details", url: input.visitUrl ?? url("/dashboard") },
  });
}

// ── G. Payment success ───────────────────────────────────────────────────────
export function paymentSuccessEmail(input: {
  userName?: string | null;
  planName: string;
  amount: string;
  transactionId: string;
  propertyTitle?: string;
  date: string;
  listingUrl?: string;
}): RenderedEmail {
  const rows = [
    { label: "Payment status", value: "Successful" },
    { label: "Plan", value: input.planName },
    { label: "Amount", value: input.amount },
    { label: "Transaction ID", value: input.transactionId },
  ];
  if (input.propertyTitle) rows.push({ label: "Property", value: input.propertyTitle });
  rows.push({ label: "Date", value: input.date });
  return renderEmail({
    subject: "Payment successful – Seedha Properties",
    preheader: "Your payment was successful",
    title: "Payment successful",
    greetingName: input.userName,
    intro: ["Thank you. Your payment has been received successfully."],
    infoRows: rows,
    cta: { label: "View Listing", url: input.listingUrl ?? url("/dashboard") },
    outro: [
      "This is your payment confirmation. A tax invoice, where applicable, is available in your account.",
    ],
  });
}

// ── H. Plan / promotion active ───────────────────────────────────────────────
export function planActiveEmail(input: {
  userName?: string | null;
  planName: string;
  propertyTitle: string;
  startDate: string;
  endDate: string;
  features: string[];
  manageUrl?: string;
}): RenderedEmail {
  return renderEmail({
    subject: "Your Seedha Properties plan is active",
    preheader: "Your plan is now active",
    title: "Your plan is active",
    greetingName: input.userName,
    intro: ["Your Seedha Properties plan is now active."],
    infoRows: [
      { label: "Plan", value: input.planName },
      { label: "Property", value: input.propertyTitle },
      { label: "Start date", value: input.startDate },
      { label: "End date", value: input.endDate },
      { label: "Features", value: input.features.join(", ") },
    ],
    cta: { label: "Manage Listing", url: input.manageUrl ?? url("/dashboard") },
  });
}

// ── I. Sign-in security alert (replaces the inline login email) ───────────────
export function loginSecurityEmail(input: {
  userName?: string | null;
  email: string;
  role?: string;
  date: string;
  time: string;
}): RenderedEmail {
  const rows = [
    { label: "Account", value: input.email },
    { label: "Date", value: input.date },
    { label: "Time", value: input.time },
  ];
  if (input.role) rows.push({ label: "Access level", value: input.role.toUpperCase() });
  return renderEmail({
    subject: "New sign-in to your Seedha Properties account",
    preheader: "A new sign-in was detected",
    title: "New sign-in detected",
    greetingName: input.userName,
    tone: "security",
    intro: ["We detected a successful sign-in to your Seedha Properties account."],
    infoRows: rows,
    outro: ["If you initiated this sign-in, no further action is required."],
    securityNotes: [
      "If this wasn't you, change your password immediately.",
      `Then contact our security team at support@seedhaproperties.com.`,
    ],
  });
}

// ── J. Generic security notice (e.g. password changed) ───────────────────────
export function securityNoticeEmail(input: {
  userName?: string | null;
  action: string;
  date: string;
  time: string;
  guidance?: string;
}): RenderedEmail {
  return renderEmail({
    subject: "Security update on your Seedha Properties account",
    preheader: "A security-related change was made",
    title: "Security update on your account",
    greetingName: input.userName,
    tone: "security",
    intro: [`The following change was made to your account: ${input.action}.`],
    infoRows: [
      { label: "Change", value: input.action },
      { label: "Date", value: input.date },
      { label: "Time", value: input.time },
    ],
    outro: input.guidance ? [input.guidance] : [],
    securityNotes: [
      "If you did not make this change, reset your password immediately and contact support@seedhaproperties.com.",
    ],
  });
}

/** Type -> template metadata, for the local preview surface and tests. */
export type EmailTemplateKey =
  | "otp"
  | "welcome"
  | "listing_submitted"
  | "property_approved"
  | "property_enquiry"
  | "visit_scheduled"
  | "payment_success"
  | "plan_active"
  | "login_security"
  | "security_notice";

/**
 * Sample renders for local preview + tests. All data is fictional (the OTP is a
 * placeholder, never a real code) so nothing sensitive is ever produced here.
 */
export const EMAIL_PREVIEWS: Record<EmailTemplateKey, RenderedEmail> = {
  otp: otpEmail({ userName: "Aarav", otp: "482913", expiry: "5 minutes" }),
  welcome: welcomeEmail({ userName: "Aarav" }),
  listing_submitted: listingSubmittedEmail({
    userName: "Aarav",
    propertyTitle: "2 BHK Semi-Furnished Apartment",
    locality: "Madhapur",
    city: "Hyderabad",
    listingId: "SP-24812",
    status: "Under review",
    requiresVerification: true,
  }),
  property_approved: propertyApprovedEmail({
    userName: "Aarav",
    propertyTitle: "2 BHK Semi-Furnished Apartment",
    location: "Madhapur, Hyderabad",
    listingId: "SP-24812",
  }),
  property_enquiry: propertyEnquiryEmail({
    ownerName: "Aarav",
    propertyTitle: "2 BHK Semi-Furnished Apartment",
    location: "Madhapur, Hyderabad",
    enquirerName: "Priya",
    message: "Hi, is this available for an early-October move-in?",
  }),
  visit_scheduled: visitScheduledEmail({
    userName: "Aarav",
    propertyTitle: "2 BHK Semi-Furnished Apartment",
    date: "Saturday, 30 August 2026",
    time: "11:00 AM IST",
    location: "Madhapur, Hyderabad",
    visitorName: "Priya",
  }),
  payment_success: paymentSuccessEmail({
    userName: "Aarav",
    planName: "Featured Listing – 30 days",
    amount: "₹499",
    transactionId: "pay_SAMPLE1234",
    propertyTitle: "2 BHK Semi-Furnished Apartment",
    date: "24 August 2026",
  }),
  plan_active: planActiveEmail({
    userName: "Aarav",
    planName: "Featured Listing – 30 days",
    propertyTitle: "2 BHK Semi-Furnished Apartment",
    startDate: "24 August 2026",
    endDate: "23 September 2026",
    features: ["Top of search", "Featured badge", "Priority support"],
  }),
  login_security: loginSecurityEmail({
    userName: "Aarav",
    email: "aarav@example.com",
    role: "owner",
    date: "Sunday, 24 August 2026",
    time: "09:32 AM IST",
  }),
  security_notice: securityNoticeEmail({
    userName: "Aarav",
    action: "Your password was changed",
    date: "24 August 2026",
    time: "09:32 AM IST",
  }),
};
