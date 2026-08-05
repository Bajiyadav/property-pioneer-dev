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
