## v0.7.6 — 2026-08-16

### Fixes
- fix(cd): stop reporting success for deployments that never happened (7dabec0)

### Refactoring
- refactor(dashboard): use typed navigation for role redirects (9802bf8)

## v0.7.5 — 2026-08-16

### Fixes
- fix(ci): generate the lock with the npm major that CI actually runs (87d9a2f)

## v0.7.4 — 2026-08-16

### Fixes
- fix(ci): repair the lock entries npm prunes on non-wasm platforms (81dffb7)

## v0.7.3 — 2026-08-16

### Fixes
- fix(ci): resync package-lock so npm ci can install (07c746a)
- fix(routing): let the locality route actually render (4087ee0)
- fix(ui): stop the header overflowing at 320px (4f42c50)
- fix(db): make the video/location migration idempotent and collision-safe (22d5bbf)
- fix(property): survive the un-applied video/location migration (5f48796)

### Migration notes
- supabase/migrations/20260815131921_add_video_and_location_to_properties.sql

Apply with `supabase db push` before promoting.

## v0.7.2 — 2026-08-16

### Fixes
- fix(routing): remove conflicting splat route and streamline auth assertions (dfc4765)

## v0.7.1 — 2026-08-16

### Fixes
- fix(routing): support non-trailing slash on /rent/$city and normalize test matcher (cf4575c)

## v0.7.0 — 2026-08-16

### Features
- feat(ui): upgrade visual design system, enforce route security and audit marketing claims (4c810f3)

## v0.6.1 — 2026-08-15

### Fixes
- fix(e2e): stabilize LocationPicker hydration and assertion timings (96279d8)

## v0.6.0 — 2026-08-15

### Features

- feat: complete production rental platform with video tours, agent careers, and RLS (3fe5946)

### Migration notes

- supabase/migrations/20260815131921_add_video_and_location_to_properties.sql
- supabase/migrations/properties/20260815190000_add_extended_video_fields.sql
- supabase/migrations/properties/20260816000000_add_property_visits_and_agent_leads.sql
- supabase/migrations/users/20260816010000_add_agent_applications.sql

Apply with `supabase db push` before promoting.

## v0.5.0 — 2026-08-13

### Features

- feat(ci): upgrade to production-grade gated delivery architecture with release score (b741d62)

## v0.4.1 — 2026-08-13

### Fixes

- fix(cd): expand health check routes and set 404 handler for unknown routes (c4429b7)

## v0.4.0 — 2026-08-13

### Features

- feat(category): add dedicated category landing pages for buy, commercial, villas, plots, farm-lands (1bdc7e4)

## v0.3.6 — 2026-08-13

### Fixes

- fix(ci): update auth robots meta to index, follow and adjust performance threshold to 0.85 (c30910e)

## v0.3.5 — 2026-08-08

### Fixes

- fix(content): remove the last two fabricated service claims (6531043)

## v0.3.4 — 2026-08-08

### Fixes

- fix(cd): stop the health check failing every healthy deployment (83322f3)

## v0.3.3 — 2026-08-08

### Fixes

- fix(ci): stop the env validator failing unit tests in CI (79a5fcd)

## v0.3.2 — 2026-08-08

### Fixes

- fix(content): drop remaining pan-India framing from hero and site metadata (cef1af1)

## v0.3.1 — 2026-08-08

### Refactoring

- refactor: remove unbacked features and unearned claims across the product (365daf6)

## v0.3.0 — 2026-08-08

### Features

- feat(demo): seed a real Hyderabad catalogue; wire owner leads to live enquiries (51d74e6)

### Fixes

- feat(demo): seed a real Hyderabad catalogue; wire owner leads to live enquiries (51d74e6)

## v0.2.0 — 2026-08-08

### Features

- feat(expansion): make Bangalore roadmap cards informative; remove false claims (f6c41a8)

## v0.1.6 — 2026-08-08

### Refactoring

- refactor(product): remove unbacked promotional sections; make location search real (6360ed9)

## v0.1.5 — 2026-08-08

### Fixes

- fix(ui): remove the duplicate footer on the homepage (b5cd8ad)

## v0.1.4 — 2026-08-08

### Refactoring

- refactor(structure): move domain code into owning modules; drop empty scaffolding (a549c72)

## v0.1.3 — 2026-08-07

### Refactoring

- refactor(types): generate Supabase types from live schema; validate env at startup (c8e694b)

## v0.1.2 — 2026-08-07

### Fixes

- fix(ci): honour the server/client boundary convention; harden health check (005c494)

## v0.1.1 — 2026-08-07

### Fixes

- fix(ci): regenerate an out-of-sync package-lock (4e17d76)

## v0.1.0 — 2026-08-07

### Features

- feat(owner): real listing CRUD with image upload; migrate to new Supabase project (5caa11a)
- feat(services): implement interactive price calculator, before/after slider, expandable checklists, 8-stage timeline, and 10-field booking form (7014518)
- feat(property): add Ask Urban AI assistant, locality scores, and interactive visit scheduler to property details page (1167e33)
- feat(auth): implement enterprise password rules checklist, password strength meter, mobile OTP verification, and customer identity engine (1f5632d)
- feat(pages): add 7 dedicated product landing pages for Buy, Commercial, Plots, Villas, Farm Lands, PG Hostels, and Home Services (339e07c)
- feat(master): complete startup platform elevation with zero dead links, expansion waitlist, home services, and EMI calculators (5139518)
- feat(property): add flagship Luxury Duplex Villa Vinayak Nagar Madhapur listing with room breakdown, specifications, and locality hubs (fdd5a65)
- feat(dashboards): create production-grade role-based dashboard system for Customer, Owner, Agent, and Admin with demo switcher (1666658)
- feat(property-details): upgrade property detail page with sticky back bar, action controls, lightbox, and neighborhood insights (3249f2f)
- feat(proptech): add Interactive Leaflet Map Search, Urban AI Natural Language Search, Schedule Visit Walkthrough, and Digital Rental Agreement Builder (a3618b2)
- feat(discover): add full-screen Discover Experience drawer for live categories with Hyderabad locality matrix and budget filters (3bb5c4f)
- feat(modals): add interactive category, service, expansion city modals and owner onboarding wizard (85f6e24)
- feat(services): add Apple/Stripe inspired infinite marquee Services showcase and Pan-India expansion roadmap (3096877)
- feat(hyderabad): upgrade Urban Properties platform to Hyderabad launch standards with role-based auth redirection and 17 storytelling sections (61fa2ce)
- feat: updates for production build and documentation (ad2748c)

### Fixes

- fix(admin): show genuinely pending listings in the moderation queue (4f7a464)
- fix(ssr,a11y): eliminate hydration mismatch on property pages; label form inputs (319ff73)
- fix(owner): remove false 'Listing Submitted Successfully' claim (587b589)
- fix(admin): wire moderation actions to the real server function (d570023)
- fix(dashboards): resolve auth blocker, schema drift and env gaps; rebuild all four portals (89ff8e9)
- fix(imports): add missing ExpansionWaitlistModal and HomeServicesModal imports to __root.tsx (c1abe79)
- fix(boundary): replace old text error page with DEV stack diagnostics and permanent customer data fallbacks (974d33b)
- fix(brand): implement UrbanLogoIcon SVG fallback so logo icon is 100% visible on production (4a8c019)
- fix(imports): complete production audit and resolve missing LayoutGrid, MapPin, PropertyMapView, Link, ArrowRight, and Search imports (0209aa1)
- fix(category-modal): restore missing useState and UI component imports in CategoryModal.tsx (a37fc04)
- fix(properties): import useState from react in properties.index.tsx to resolve ReferenceError (e82b532)
- fix(property-card): add defensive null checks to PropertyCard images array and fallback fields (d32ce56)
- fix(router): add null safety checks to property filtering in dashboard and properties routes to prevent ErrorComponent crashes (71cff04)

### Refactoring

- refactor(architecture): feature-first modules, split oversized files, group migrations (2852d78)
- refactor(architecture): extract pages from route files into feature modules (017bafd)
- refactor: remove unused modules, fix dashboards, update footer, production cleanup (068de0a)

# Changelog

All notable changes to the **Urban Rental Flats (URF)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-05

### Added

- **TanStack Start & React 19 Architecture**: Migrated project to TanStack Start SSR meta-framework powered by Vite 8 and Nitro server engine.
- **Supabase Integration**:
  - Client-side Supabase proxy (`client.ts`) with publishable key and `localStorage` session persistence.
  - Server-side admin client (`client.server.ts`) with `service_role` key to bypass RLS for trusted operations.
  - RPC authentication middleware (`auth-middleware.ts`) and client bearer token attacher (`auth-attacher.ts`).
- **Database Migrations & Security Baseline**:
  - Implemented 9 SQL migration scripts in `supabase/migrations/`.
  - Added `properties`, `enquiries`, `audit_logs`, and `user_roles` tables with custom enums (`property_type`, `listing_type`, `property_status`, `app_role`).
  - Applied Column-Level Security (CLS) to `properties` table revoking owner contact information (`owner_name`, `owner_phone`, `owner_whatsapp`, `owner_email`) from `anon` and `authenticated` roles.
  - Configured deny-all Row-Level Security policies on `enquiries` and `audit_logs` for client roles.
  - Created `has_role` database function restricted to `service_role`.
- **Anti-Abuse Engine (`/api/public/enquiries`)**:
  - Postgres sliding-window rate limiting engine enforcing 5 rules across IP, property, and phone scopes.
  - Form submit timing verification (`MIN_SUBMIT_MS = 2500`).
  - Honeypot field inspection (`company`).
  - Optional Cloudflare Turnstile CAPTCHA verification (`verifyTurnstile`).
  - Audit logging to `public.audit_logs`.
- **Admin Dashboard (`/_authenticated/admin`)**:
  - Real-time overview metrics (Total, Approved, Pending, Featured, Rent/Sale, 7-day enquiry activity, City distribution).
  - Listing approval & featured toggle table.
  - Customer lead enquiry inbox.
  - Security activity audit log table.
- **Public Frontend Pages**:
  - Homepage (`/`) with hero search, popular cities, and featured listings.
  - Property Browse (`/properties`) with real-time multi-field filter bar.
  - Property Detail (`/properties/$id`) with gallery switcher, specs grid, save button, enquiry modal, and `Residence` JSON-LD schema.
  - Saved Homes (`/favorites`) reading from client local storage.
  - Authentication page (`/auth`) handling Supabase Email/Password sign in and sign up.
- **Platform Configuration & Feature Switchboard**:
  - Feature registry (`src/config/features.ts`) declaring ~100+ feature flags across 10 domains with runtime overrides (`VITE_FEATURES`).
  - Data-driven expansion config (`src/config/platform.ts`) with 13 Indian cities, 10 states, 7 locales, and monetization SKUs.
  - Role-Based Access Control matrix (`src/config/rbac.ts`).
