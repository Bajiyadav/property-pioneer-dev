/**
 * Centralized Seedha Properties email templates. Import from here so every
 * transactional email uses the same branded layout and plain-text fallback.
 */
export {
  renderEmail,
  type EmailContent,
  type RenderedEmail,
  type EmailButton,
  type EmailInfoRow,
  type EmailHighlight,
  EMAIL_SENDER,
  EMAIL_SUPPORT_EMAIL,
} from "./renderEmail";
export {
  otpEmail,
  welcomeEmail,
  listingSubmittedEmail,
  propertyApprovedEmail,
  propertyEnquiryEmail,
  visitScheduledEmail,
  paymentSuccessEmail,
  planActiveEmail,
  loginSecurityEmail,
  securityNoticeEmail,
  EMAIL_PREVIEWS,
  type EmailTemplateKey,
} from "./templates";
