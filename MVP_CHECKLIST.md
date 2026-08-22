# SEEDHA PROPERTIES MVP - MUST-HAVE CHECKLIST (🔴 Critical Path)

## 1. CORE ENGINE (Product Must-Work)

- [x] Web: Property search with basic filters (location, intent, property type)
- [x] Web: Property detail pages (photos, pricing, amenities, location map)
- [x] Web: Multi-step property listing wizard (Start Now flow)
- [ ] Mobile: Property listing form/wizard parity with web
- [ ] Mobile: Property search and detail views
- [x] Database schemas and relations for properties, users, and media

## 2. SECURITY & TRUST (Must-Have for Launch)

- [x] Web: Authentication (signup, login, OTP, password reset, role-based routing)
- [ ] Mobile: Authentication (OTP verification, password reset, phone format, redirect guards)
- [x] Row Level Security (RLS) - prevent unauthorized data access/modifications on Supabase
- [ ] Owner KYC upload/verification flow (for fraud prevention)

## 3. OPERATIONAL STABILITY (Must Not Crash)

- [x] Web: Global error boundaries and auth state preservation
- [x] CI/CD pipeline for automated deployments (Vercel)
- [ ] Database backups (Supabase automated daily backups enabled on Pro plan)
- [ ] Centralized error logging (e.g. Sentry/Crashlytics) for web and mobile

## 4. UX & PERFORMANCE (Must Be Usable)

- [x] Web: Mobile responsive design (Tailwind)
- [x] Web: Property photos upload and load correctly via Supabase Storage
- [ ] Mobile: Responsive layouts for smaller devices and tablets
- [ ] Mobile: Image loading/caching optimized

## 5. BUSINESS OPERATIONS (Must Manage Real Estate)

- [x] Property approval workflow (unapproved → approved status)
- [x] Admin dashboard to review and approve listings
- [x] Customer enquiry submission system for properties
- [ ] Owner/agent contact system (lead routing)

---

**Status Summary:**

- Total Must-Have Items: 19
- Currently Implemented: 11
- Remaining Before MVP: 8
- Estimated Priority Order:
  1. Mobile Authentication Parity
  2. Mobile Core Journey (Search & Details)
  3. Owner KYC Verification
  4. Lead Routing / Contact System
  5. Operational Monitoring (Logs/Backups)
