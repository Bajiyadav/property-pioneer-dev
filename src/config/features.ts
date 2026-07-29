/**
 * URF Feature Registry — the plug-and-play switchboard for the platform.
 *
 * Every module on the roadmap is declared here with an explicit lifecycle
 * stage. UI and routing read from this registry, so a future feature can be
 * turned on by flipping `enabled` (or a runtime override) without touching
 * layout, theme, or components.
 *
 * Stages:
 *  - "live"     shipped and enabled
 *  - "beta"     shipped behind a flag, off by default
 *  - "planned"  architecture reserved, no implementation yet
 */

export type FeatureStage = "live" | "beta" | "planned";

export type FeatureDomain =
  | "owner"
  | "customer"
  | "agent"
  | "builder"
  | "admin"
  | "communication"
  | "payments"
  | "security"
  | "performance"
  | "future";

export interface FeatureDefinition {
  key: FeatureKey;
  domain: FeatureDomain;
  label: string;
  stage: FeatureStage;
  /** Default on/off. Runtime overrides can flip this without a code change. */
  enabled: boolean;
  /** Optional env var that must be present for the feature to work. */
  requires?: string[];
}

const DEFS = [
  // ── Property Owner Portal ───────────────────────────────────────────────
  ["owner.upload", "owner", "Mobile-first property upload", "planned", false],
  ["owner.cameraCapture", "owner", "Upload from phone camera", "planned", false],
  ["owner.multiImage", "owner", "Multiple image upload", "planned", false],
  ["owner.reorderImages", "owner", "Drag & reorder images", "planned", false],
  ["owner.coverImage", "owner", "Set cover image", "planned", false],
  ["owner.drafts", "owner", "Save as draft / publish later", "planned", false],
  ["owner.editListing", "owner", "Edit listings", "planned", false],
  ["owner.statusManagement", "owner", "Mark rented / sold", "planned", false],
  ["owner.duplicateListing", "owner", "Duplicate listing", "planned", false],
  ["owner.enquiryInbox", "owner", "View enquiries", "planned", false],
  ["owner.analytics", "owner", "Property analytics", "planned", false],
  ["owner.whatsappEnquiry", "owner", "WhatsApp enquiry button", "planned", false],
  ["owner.shareListing", "owner", "Share listing", "beta", false],
  ["owner.qrCode", "owner", "QR code for property", "planned", false],

  // ── Customer ────────────────────────────────────────────────────────────
  ["customer.search", "customer", "Property search", "live", true],
  ["customer.advancedSearch", "customer", "Advanced search filters", "live", true],
  ["customer.wishlist", "customer", "Wishlist / saved homes", "live", true],
  ["customer.enquiry", "customer", "Enquiry form", "live", true],
  ["customer.aiSearchSuggestions", "customer", "AI search suggestions", "planned", false],
  ["customer.recentSearches", "customer", "Recent searches", "planned", false],
  ["customer.savedSearches", "customer", "Saved searches", "planned", false],
  ["customer.compare", "customer", "Compare properties", "planned", false],
  ["customer.nearbySchools", "customer", "Nearby schools", "planned", false],
  ["customer.nearbyHospitals", "customer", "Nearby hospitals", "planned", false],
  ["customer.nearbyMetro", "customer", "Nearby metro", "planned", false],
  ["customer.nearbyBus", "customer", "Nearby bus stations", "planned", false],
  ["customer.mapView", "customer", "Map view", "planned", false],
  ["customer.streetView", "customer", "Street view", "planned", false],
  ["customer.contactOwner", "customer", "Contact owner", "planned", false],
  ["customer.scheduleVisit", "customer", "Schedule visit", "planned", false],
  ["customer.requestCallback", "customer", "Request callback", "planned", false],
  ["customer.similarProperties", "customer", "Similar properties", "planned", false],
  ["customer.recentlyViewed", "customer", "Recently viewed", "planned", false],
  ["customer.recommendations", "customer", "Property recommendations", "planned", false],

  // ── Agent Portal ────────────────────────────────────────────────────────
  ["agent.dashboard", "agent", "Agent dashboard", "planned", false],
  ["agent.clients", "agent", "Manage clients", "planned", false],
  ["agent.leads", "agent", "Manage leads", "planned", false],
  ["agent.listings", "agent", "Manage listings", "planned", false],
  ["agent.commissions", "agent", "Commission tracking", "planned", false],
  ["agent.team", "agent", "Team management", "planned", false],
  ["agent.performance", "agent", "Performance analytics", "planned", false],

  // ── Builder Portal ──────────────────────────────────────────────────────
  ["builder.residentialProjects", "builder", "Residential projects", "planned", false],
  ["builder.commercialProjects", "builder", "Commercial projects", "planned", false],
  ["builder.gallery", "builder", "Project gallery", "planned", false],
  ["builder.constructionStatus", "builder", "Construction status", "planned", false],
  ["builder.unitAvailability", "builder", "Unit availability", "planned", false],
  ["builder.brochure", "builder", "Brochure download", "planned", false],
  ["builder.rera", "builder", "RERA details", "planned", false],

  // ── Admin Panel ─────────────────────────────────────────────────────────
  ["admin.dashboard", "admin", "Admin dashboard", "planned", false],
  ["admin.users", "admin", "User management", "planned", false],
  ["admin.owners", "admin", "Owner management", "planned", false],
  ["admin.agents", "admin", "Agent management", "planned", false],
  ["admin.builders", "admin", "Builder management", "planned", false],
  ["admin.propertyApproval", "admin", "Property approval", "planned", false],
  ["admin.propertyVerification", "admin", "Property verification", "planned", false],
  ["admin.reports", "admin", "Report management", "planned", false],
  ["admin.analytics", "admin", "Analytics dashboard", "planned", false],
  ["admin.revenue", "admin", "Revenue dashboard", "planned", false],
  ["admin.featuredListings", "admin", "Featured listings", "planned", false],
  ["admin.cms", "admin", "CMS management", "planned", false],
  ["admin.blog", "admin", "Blog management", "planned", false],
  ["admin.banners", "admin", "Banner management", "planned", false],
  ["admin.notifications", "admin", "Notification management", "planned", false],

  // ── Communication ───────────────────────────────────────────────────────
  ["comms.email", "communication", "Email notifications", "planned", false],
  ["comms.whatsapp", "communication", "WhatsApp notifications", "planned", false],
  ["comms.push", "communication", "Push notifications", "planned", false],
  ["comms.sms", "communication", "SMS notifications", "planned", false],
  ["comms.contactForms", "communication", "Contact forms", "live", true],
  ["comms.ownerChat", "communication", "Chat with owner", "planned", false],
  ["comms.aiChatbot", "communication", "AI chatbot", "planned", false],

  // ── Payments ────────────────────────────────────────────────────────────
  ["payments.razorpay", "payments", "Razorpay", "planned", false],
  ["payments.stripe", "payments", "Stripe", "planned", false],
  ["payments.subscriptions", "payments", "Subscription plans", "planned", false],
  ["payments.premiumListings", "payments", "Premium listings", "planned", false],
  ["payments.featuredProperties", "payments", "Featured properties", "planned", false],
  ["payments.agentSubscriptions", "payments", "Agent subscriptions", "planned", false],
  ["payments.builderSubscriptions", "payments", "Builder subscriptions", "planned", false],

  // ── Security ────────────────────────────────────────────────────────────
  ["security.inputValidation", "security", "Server-side input validation", "live", true],
  ["security.rateLimiting", "security", "Rate limiting", "live", true],
  ["security.honeypot", "security", "Honeypot + timing checks", "live", true],
  ["security.auditLogs", "security", "Audit logs", "live", true],
  ["security.turnstile", "security", "Cloudflare Turnstile", "beta", false],
  ["security.jwtAuth", "security", "JWT authentication", "planned", false],
  ["security.rbac", "security", "Role-based access control", "beta", false],
  ["security.secureUploads", "security", "Secure image uploads", "planned", false],

  // ── Performance ─────────────────────────────────────────────────────────
  ["perf.lazyLoading", "performance", "Lazy loading", "live", true],
  ["perf.optimizedImages", "performance", "Optimized images", "live", true],
  ["perf.seo", "performance", "SEO metadata", "live", true],
  ["perf.sitemap", "performance", "Sitemap", "live", true],
  ["perf.robots", "performance", "Robots.txt", "live", true],
  ["perf.schemaOrg", "performance", "Schema.org structured data", "live", true],
  ["perf.infiniteScroll", "performance", "Infinite scrolling", "planned", false],

  // ── Future ready ────────────────────────────────────────────────────────
  ["future.pwa", "future", "Progressive Web App", "planned", false],
  ["future.androidApp", "future", "Android app", "planned", false],
  ["future.iosApp", "future", "iOS app", "planned", false],
  ["future.aiRecommendations", "future", "AI property recommendations", "planned", false],
  ["future.aiDescriptions", "future", "AI description generator", "planned", false],
  ["future.voiceSearch", "future", "Voice search", "planned", false],
  ["future.ocrDocuments", "future", "OCR document scanning", "planned", false],
  ["future.kyc", "future", "KYC verification", "planned", false],
  ["future.digitalAgreements", "future", "Digital agreements", "planned", false],
  ["future.rentalPayments", "future", "Rental payments", "planned", false],
  ["future.i18n", "future", "Multi-language support", "planned", false],
  ["future.multiCity", "future", "Multi-city expansion", "beta", true],
  ["future.multiState", "future", "Multi-state expansion", "planned", false],
  ["future.franchise", "future", "Franchise model", "planned", false],
] as const;

export type FeatureKey = (typeof DEFS)[number][0];

export const FEATURES: Record<FeatureKey, FeatureDefinition> = Object.fromEntries(
  DEFS.map(([key, domain, label, stage, enabled]) => [
    key,
    { key, domain, label, stage, enabled } as FeatureDefinition,
  ]),
) as Record<FeatureKey, FeatureDefinition>;

/**
 * Runtime overrides, e.g. `VITE_FEATURES="owner.upload,customer.mapView"`.
 * Lets staging enable a module without a rebuild of the component tree.
 */
function runtimeOverrides(): Set<string> {
  const raw =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FEATURES) || "";
  return new Set(
    String(raw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

const OVERRIDES = runtimeOverrides();

export function isFeatureEnabled(key: FeatureKey): boolean {
  if (OVERRIDES.has(key)) return true;
  if (OVERRIDES.has(`!${key}`)) return false;
  return FEATURES[key]?.enabled ?? false;
}

export function featuresByDomain(domain: FeatureDomain): FeatureDefinition[] {
  return Object.values(FEATURES).filter((f) => f.domain === domain);
}