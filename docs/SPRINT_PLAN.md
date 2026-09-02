# Seedha Properties — Development Sprint Plan

> **Document Type:** Execution Sprint Schedule & Deliverables  
> **Repository:** `property-pioneer-dev`  
> **Target Cycle:** 2-Week Sprint Cadence

---

## Executive Overview

This sprint plan breaks down the immediate engineering backlog into actionable 2-week development sprints. It prioritizes P0 production blockers in Sprints 1 and 2, followed by P1 performance/security enhancements and P2 feature additions.

---

## Sprint 1: Security & Route Authorization Hardening

- **Focus**: Eliminate critical security vulnerabilities and administrative authorization flaws.
- **Estimated Effort**: 10 Story Points (1 Week)
- **Features**:
  - Admin Route Guard Verification (`_authenticated/route.tsx`)
  - HTTP Security Response Headers (`src/server.ts`)
  - Canonical Environment Variable Configuration (`import.meta.env.VITE_APP_URL`)

### Tasks:

1. Refactor `src/routes/_authenticated/route.tsx` to call `checkIsAdmin` inside `beforeLoad` using Supabase authentication context.
2. Implement HTTP security headers in Nitro server entry handler: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
3. Replace hardcoded `https://property-pioneer-dev.lovable.app` fallback in `properties.$id.tsx` and `properties.index.tsx` with dynamic `import.meta.env.VITE_APP_URL`.
4. Update `src/lib/useFavorites.ts` to use key `urf:favorites` with legacy key migration logic.

### Deliverables:

- Secured admin route guard preventing unauthorized component tree mounting.
- Verified HTTP security response headers on all server responses.
- Clean canonical tags dynamically reflecting deployment domain.
- Wishlist local storage key aligned with platform branding.

### Risks:

- Modifying `beforeLoad` in root authenticated layout could trigger redirect loops if session state is stale.
- Strict CSP headers might block external Unsplash hero images if domain directives are misconfigured.

### Acceptance Criteria:

- Non-admin logged-in users navigating to `/_authenticated/admin` are redirected to `/auth` or shown forbidden error BEFORE component mount.
- SecurityHeaders test suite passes verifying CSP and frame options headers.
- Wishlist favorites persist correctly across browser refreshes under `urf:favorites`.

---

## Sprint 2: Server-Side Pagination & DB Aggregations

- **Focus**: Eliminate client-side and server-side in-memory memory bottlenecks.
- **Estimated Effort**: 13 Story Points (2 Weeks)
- **Features**:
  - Supabase Database Server-Side Search & Pagination
  - Postgres SQL Aggregations for Admin Overview Metrics
  - DB Indexing for Property Sorting

### Tasks:

1. Refactor `fetchProperties()` in `src/lib/properties.ts` to accept `page`, `limit`, `city`, `search`, `minPrice`, `maxPrice` query parameters.
2. Update `src/routes/properties.index.tsx` to bind search bar and filter dropdown controls to TanStack Router URL search params schema.
3. Write Postgres migration creating composite index `CREATE INDEX idx_properties_search ON public.properties(is_approved, city, price, created_at DESC);`.
4. Refactor `loadOverview()` in `src/lib/admin.server.ts` to execute database-level `COUNT(*)` queries instead of loading full row arrays into Node memory.

### Deliverables:

- Server-side paginated property listing endpoint returning max 24 items per page.
- URL-driven search filtering enabling link sharing for filtered search results.
- Optimized admin dashboard loader using SQL aggregations.

### Risks:

- URL query parameter parsing in TanStack Router must handle undefined or invalid number inputs gracefully without throwing runtime errors.

### Acceptance Criteria:

- `properties.index.tsx` fetches only the requested page of 24 records from Supabase Postgres.
- Admin overview dashboard loads in <100ms regardless of total listing volume in database.
- Search queries execute with sub-50ms latency using Postgres B-Tree indexes.

---

## Sprint 3: Rate Limit Optimization & Cloudflare Turnstile

- **Focus**: Enhance lead API performance and bot protection.
- **Estimated Effort**: 8 Story Points (1 Week)
- **Features**:
  - Parallelized Postgres Rate-Limit Execution
  - Production Turnstile CAPTCHA Integration
  - Audit Event Security Alerts

### Tasks:

1. Refactor 5 sequential count queries in `src/routes/api/public/enquiries.ts` to execute in parallel via `Promise.all()`.
2. Provision production `VITE_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in environment config.
3. Implement `sendSecurityAlert()` utility in `src/lib/security.server.ts` triggering webhook alerts on repeated rate-limit breaches.
4. Enforce Zod schema bounds `max(10)` on property `images` array length.

### Deliverables:

- Lead enquiry submission API responding in <100ms.
- Verified Cloudflare Turnstile CAPTCHA verification on public lead form.
- Automated security webhook alerts for DDoS or spam spikes.

### Risks:

- Third-party Turnstile API network latency could impact form submission if verification timeout is not enforced.

### Acceptance Criteria:

- `/api/public/enquiries` responds in <100ms on valid submissions.
- Form submissions rejected if Turnstile verification fails or honeypot field is filled.
- Security alert webhooks trigger cleanly when rate limit thresholds are exceeded.

---

## Sprint 4: CDN Image Pipeline & UI Asset Pruning

- **Focus**: Optimize media delivery and prune repository code bloat.
- **Estimated Effort**: 5 Story Points (1 Week)
- **Features**:
  - Image WebP Optimization Pipeline
  - Unused UI Primitive Component Audit

### Tasks:

1. Create `formatImageUrl()` helper appending `?auto=format&w=600&q=80` to listing image URLs.
2. Update `<PropertyCard />` and property gallery components to use dynamic image formatting and lazy loading.
3. Audit `src/components/ui/` and remove unreferenced Radix component wrappers (e.g., `calendar.tsx`, `resizable.tsx`).
4. Update `README.md` to accurately reflect TanStack Start, Supabase, and Tailwind v4 architecture.

### Deliverables:

- 70% reduction in listing card image payload sizes.
- Cleaned component directory with zero dead code wrappers.
- Accurate repository README documentation.

### Risks:

- Ensure image formatter handles non-Unsplash fallback images cleanly without breaking image rendering.

### Acceptance Criteria:

- Page load image payloads reduced from ~4MB to <800KB on properties index route.
- All remaining components in `src/components/ui/` have verified import references.

---

## Sprint 5: Property Owner Listing Upload Portal

- **Focus**: Enable self-service property submissions by owners.
- **Estimated Effort**: 13 Story Points (2 Weeks)
- **Features**:
  - Mobile-First Multi-Step Listing Creation Form
  - Cloudinary / Supabase Storage Photo Upload Integration
  - Owner Dashboard & Listing Status Toggle

### Tasks:

1. Build `/owner` route hierarchy and multi-step property wizard form (`owner.upload` feature flag).
2. Integrate storage upload API with client-side image compression.
3. Add `owner_id` column and owner RLS policies to `public.properties`.
4. Implement listing status toggle (`Available`, `Rented`, `Under Maintenance`).

### Deliverables:

- Functional owner dashboard allowing property listing submissions and management.
- Secure direct image upload to storage bucket.

### Risks:

- File size validation must prevent memory exhaustion during client compression of large mobile camera photos.

### Acceptance Criteria:

- Property owners can log in, submit a listing with up to 10 photos, and view listing approval status in their dashboard.
- RLS policies prevent owners from viewing or editing other owners' property listings.

---

## Sprint 6: Customer Experience Enhancements

- **Focus**: Increase user engagement with maps, comparisons, and saved searches.
- **Estimated Effort**: 8 Story Points (1 Week)
- **Features**:
  - Interactive Leaflet / Google Maps View
  - Listing Side-by-Side Comparison Drawer
  - Database-Synced User Favorites

### Tasks:

1. Build interactive map toggle on property search route displaying listing markers.
2. Create floating comparison bar allowing selection of up to 3 listings for spec comparison.
3. Create `public.user_favorites` table and sync local wishlist items to DB for logged-in users.

### Deliverables:

- Interactive map view for location-based search.
- Listing spec comparison drawer.
- Cloud-synced wishlist experience.

### Risks:

- Map tile loading must be lazy-loaded to prevent slowing down initial page render.

### Acceptance Criteria:

- Clicking property map marker opens property preview card with direct link to detail view.
- Wishlist favorites automatically sync to user account upon logging in.
