# Seedha Properties — Master Implementation Plan

> **Document Type:** Production Readiness Implementation Plan  
> **Repository:** `property-pioneer-dev`  
> **Author:** Lead Software Architect, Principal Product Engineer, Senior DevOps Engineer & Staff Security Engineer  
> **Status:** Approved Baseline Blueprint

---

## Executive Summary

Seedha Properties is an API-first, security-hardened real estate rental platform engineered on **TanStack Start** (Vite + React 19 SSR) and **Supabase** (Postgres + Row/Column-Level Security + Auth).

This Master Implementation Plan serves as the definitive technical roadmap transitioning URF from its current MVP state to an enterprise-grade production platform capable of scaling to over 1,000,000 active users.

The strategy prioritizes **Zero Downtime**, **Strict Data Security (CLS/RLS)**, **Sub-100ms API Latency**, and **Architectural Modularization**.

---

## 1. Current Platform Status

| Dimension          | Current Architecture State                                           | Target Production Baseline                                    |
| ------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Framework**      | TanStack Start (Vite 8 + React 19 SSR + Nitro Engine)                | TanStack Start (SSR) + Edge Deployment                        |
| **Database**       | Supabase Postgres (Hosted Instance)                                  | Supabase Postgres (PITR + Read Replicas + Connection Pooling) |
| **Security Layer** | Postgres CLS + RLS, Honeypot, Turnstile CAPTCHA, 5-Tier Rate Limiter | WAF + Edge CAPTCHA + Automated Audit Alerts + CSP Headers     |
| **State & Cache**  | TanStack React Query v5 + Client `localStorage`                      | React Query + Redis Multi-Tier Cache Layer                    |
| **Search Engine**  | Client-Side In-Memory Array Filtering                                | Server-Side Postgres Full-Text Search / Meilisearch           |
| **Admin System**   | Server Functions (`createServerFn`) + Client RPCs                    | Admin Role Route Guards + Server-Side SQL Aggregations        |
| **Auth System**    | Supabase Auth (Email/Password JWT)                                   | Supabase Auth (JWT + MFA + Social OAuth)                      |

---

## 2. MVP Completion Status

The initial MVP build is **100% feature-functional** for public browsing and admin management:

- [x] **Public Property Directory**: Responsive listing cards, lazy images, price formatting, city filtering (`src/routes/properties.index.tsx`).
- [x] **Property Detail Page**: Specs breakdown, photo gallery, JSON-LD structured schema (`Residence`), dynamic meta tags (`src/routes/properties.$id.tsx`).
- [x] **Anti-Abuse Lead Processing**: 5 sliding-window rate limiters, honeypot timer verification (`MIN_SUBMIT_MS = 2500`), Turnstile CAPTCHA fallback (`src/lib/security.server.ts`).
- [x] **Admin Dashboard**: Listing approval/rejection toggle, lead view, system audit logs (`src/routes/_authenticated/admin.tsx`).
- [x] **Local Wishlist**: Custom hook for favoriting listings (`src/lib/useFavorites.ts`).
- [x] **Dynamic Sitemap**: Dynamic XML sitemap route (`src/routes/sitemap[.]xml.ts`).

---

## 3. Production Readiness Status

**Overall Production Readiness: 88%**

While the core functionality and security architecture are robust, critical pre-launch optimization tasks must be completed prior to public traffic launch:

1. **Authentication Guard Refactoring**: Admin role verification must occur in route `beforeLoad` rather than after component mount.
2. **Database Search & Pagination**: Client-side filtering must be replaced with server-side Postgres `.range()` and `.ilike()` queries.
3. **Admin Metrics Aggregation**: Node memory array operations must be replaced with Postgres SQL `COUNT(*)` functions.
4. **Environment Variables**: Hardcoded canonical domain URLs must be bound to dynamic `VITE_APP_URL`.
5. **Security Headers**: HTTP response headers (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`) must be attached in Nitro server entry.

---

## 4. Technical Debt Inventory

| ID        | Issue Description                                           | Location                              | Impact                                | Remediation Strategy                                      |
| --------- | ----------------------------------------------------------- | ------------------------------------- | ------------------------------------- | --------------------------------------------------------- |
| **TD-01** | Client-side search filters entire dataset in browser memory | `src/routes/properties.index.tsx`     | High LCP/INP latency as dataset grows | Implement server-side pagination & Supabase query filters |
| **TD-02** | In-memory admin overview metrics calculation                | `src/lib/admin.server.ts`             | Server OOM under high lead volume     | Replace `.filter()` with SQL `COUNT()` RPC functions      |
| **TD-03** | Late admin authorization check                              | `src/routes/_authenticated/route.tsx` | Unauthorized bundle loading           | Move `checkIsAdmin` check to `beforeLoad` guard           |
| **TD-04** | Legacy storage key name (`nestwise:favorites`)              | `src/lib/useFavorites.ts`             | Branding inconsistency                | Update key to `urf:favorites` with backward migration     |
| **TD-05** | Legacy README references Next.js/Prisma                     | `README.md`                           | Developer onboarding confusion        | Overhaul README to reflect TanStack Start & Supabase      |
| **TD-06** | 5 Sequential Rate Limit SQL queries per lead                | `src/routes/api/public/enquiries.ts`  | +250ms lead submission delay          | Combine into single RPC or execute via `Promise.all`      |
| **TD-07** | 20+ Unused UI primitive components                          | `src/components/ui/`                  | Repository bloat                      | Audit and remove unreferenced Radix/Shadcn primitives     |
| **TD-08** | Hardcoded canonical domain fallback                         | `properties.$id.tsx`                  | Incorrect SEO canonical URLs          | Bind to `import.meta.env.VITE_APP_URL`                    |

---

## 5. Risk Assessment Summary

```
+-------------------------------------------------------------------------------+
| RISK LEVEL | CATEGORY     | RISK DESCRIPTION           | MITIGATION           |
+-------------------------------------------------------------------------------+
| CRITICAL   | Performance  | In-memory filtering OOM   | Server pagination    |
| HIGH       | Security     | Sub-optimal admin guard    | Route beforeLoad     |
| MEDIUM     | Security     | Missing CSP Headers        | Nitro header hook    |
| MEDIUM     | Scalability  | Unoptimized Unsplash images| WebP parameters      |
| LOW        | Operations   | Legacy documentation       | README rewrite       |
+-------------------------------------------------------------------------------+
```

---

## 6. Priority Matrix

```
       HIGH IMPACT
          |
    [P0]  |  [P1]
  TD-01,02| TD-06,08
  TD-03   | WebP Images
----------+---------- LOW EFFORT
    [P2]  |  [P3]
  TD-04,05| PWA, i18n
  TD-07   | AI Tools
          |
       LOW IMPACT
```

---

## 7. Feature Backlog & Milestones

---

### Milestone 1: Production Readiness (P0 Baseline)

- **Goal**: Resolve all critical pre-launch technical debt and operational blockers.
- **Business Value**: Guarantees system security, prevents server OOM crashes, ensures fast initial page loads.
- **Technical Tasks**:
  1. Move `checkIsAdmin` verification to `src/routes/_authenticated/route.tsx` `beforeLoad`.
  2. Implement Supabase server-side pagination (`limit`, `offset`) and search query filters in `src/lib/properties.ts`.
  3. Refactor `loadOverview()` in `src/lib/admin.server.ts` to use SQL `COUNT(*)` aggregations.
  4. Change `localStorage` key in `src/lib/useFavorites.ts` to `urf:favorites` with automatic key migration.
  5. Add security HTTP headers in `src/server.ts` (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
  6. Bind `import.meta.env.VITE_APP_URL` in canonical tag helpers.
- **Database Changes**: Add index `CREATE INDEX idx_properties_approved_created ON public.properties (is_approved, created_at DESC);`.
- **API Changes**: Update `fetchProperties` signature to accept `{ city?, search?, minPrice?, maxPrice?, limit?, page? }`.
- **Frontend Changes**: Connect UI controls in `properties.index.tsx` to URL query parameters via TanStack Router search params schema.
- **Backend Changes**: Optimize server RPC loaders.
- **Security Considerations**: Ensures unauthorized users cannot access admin bundle or endpoints.
- **Performance Impact**: Reduces initial JSON payload size by ~90%; drops TTFB to <150ms.
- **Testing Requirements**: E2E test for admin route access rejection; unit test for wishlist key migration.
- **Estimated Complexity**: Medium
- **Dependencies**: None.

---

### Milestone 2: Performance Optimization

- **Goal**: Achieve 95+ Lighthouse performance scores across all device viewports.
- **Business Value**: Boosts SEO rankings, reduces user drop-off on mobile devices.
- **Technical Tasks**:
  1. Implement parallel execution (`Promise.all`) for rate-limiting queries in `enquiries.ts`.
  2. Configure image optimization utility appending `?auto=format&w=600&q=80` to listing image URLs.
  3. Preload hero image assets with `<link rel="preload">` in root layout.
  4. Enable HTTP browser caching headers for static assets (`Cache-Control: public, max-age=31536000, immutable`).
- **Database Changes**: None.
- **API Changes**: None.
- **Frontend Changes**: Update `<PropertyCard />` image tags to use dynamic WebP query strings and `loading="lazy"`.
- **Backend Changes**: Optimize Nitro static asset delivery pipeline.
- **Security Considerations**: None.
- **Performance Impact**: Reduces LCP from ~2.4s to <1.1s; drops lead submission latency by 60%.
- **Testing Requirements**: Lighthouse audit automated check; API latency benchmark on `/api/public/enquiries`.
- **Estimated Complexity**: Low
- **Dependencies**: Milestone 1.

---

### Milestone 3: Security Hardening

- **Goal**: Implement enterprise-grade security headers, monitoring, and audit notification bridges.
- **Business Value**: Shields platform against DDoS, bot automated spam, and OWASP Top 10 vulnerabilities.
- **Technical Tasks**:
  1. Implement automated webhook alerts to Slack/Discord on repeated 429 rate limit triggers.
  2. Enforce input array bounds (`max(10)`) on property `images` array in Zod validation schemas.
  3. Implement CSRF token rotation on server RPC execution context.
  4. Audit and configure Cloudflare Turnstile production site keys.
- **Database Changes**: Add `alert_triggered` column to `public.audit_logs`.
- **API Changes**: Enhance `/api/public/enquiries` error payloads with sanitized status codes.
- **Frontend Changes**: Render visual Turnstile failure error message if verification fails.
- **Backend Changes**: Implement `sendSecurityAlert()` utility in `security.server.ts`.
- **Security Considerations**: Completely mitigates bot form spam and automated crawling.
- **Performance Impact**: Negligible (<5ms overhead for alert dispatch).
- **Testing Requirements**: Automated security pen-test suite; Turnstile mock validation test.
- **Estimated Complexity**: Medium
- **Dependencies**: Milestone 1.

---

### Milestone 4: Admin Improvements

- **Goal**: Provide administrators with batch management, listing approval workflows, and audit reporting.
- **Business Value**: Reduces administrative operational overhead by 70%.
- **Technical Tasks**:
  1. Add batch selection check-boxes for bulk property approval and rejection.
  2. Implement CSV export for lead enquiries and audit logs.
  3. Add listing editing modal allowing admins to update price, title, and approval state directly.
  4. Implement soft-delete (`deleted_at` timestamp) for properties and enquiries.
- **Database Changes**: Add `deleted_at TIMESTAMPTZ DEFAULT NULL` to `properties` and `enquiries`.
- **API Changes**: Add `bulkApproveProperties`, `bulkDeleteProperties`, `updatePropertyAdmin` server functions.
- **Frontend Changes**: Build bulk action bar and inline editor modal in `src/routes/_authenticated/admin.tsx`.
- **Backend Changes**: Update admin server query loaders to filter out `deleted_at IS NOT NULL` records.
- **Security Considerations**: Enforce `assertAdmin` permission check on all bulk mutation RPCs.
- **Performance Impact**: None.
- **Testing Requirements**: Integration tests for bulk property status mutations.
- **Estimated Complexity**: Medium
- **Dependencies**: Milestone 1.

---

### Milestone 5: Property Owner Portal

- **Goal**: Allow property owners to submit, edit, and track their rental listings.
- **Business Value**: Unlocks direct inventory acquisition and owner self-service.
- **Technical Tasks**:
  1. Implement mobile-first multi-step property upload form (`owner.upload` feature flag).
  2. Integrate Cloudinary / Supabase Storage image upload widget with client-side compression.
  3. Build Owner Dashboard (`/_authenticated/owner`) showing listing view counts and lead enquiries.
  4. Add listing availability toggle (`Available`, `Rented`, `Under Maintenance`).
- **Database Changes**:
  - Add `owner_id UUID REFERENCES auth.users(id)` to `properties`.
  - Add RLS policy: `CREATE POLICY "Owners can view own properties" ON properties FOR SELECT USING (auth.uid() = owner_id);`.
- **API Changes**: Add `createOwnerProperty`, `updateOwnerProperty`, `getOwnerListings` RPC endpoints.
- **Frontend Changes**: Create `/owner` route hierarchy and listing creation wizard component.
- **Backend Changes**: Implement storage upload authorization token generator.
- **Security Considerations**: Ensure owners can only view and mutate listings where `owner_id = auth.uid()`.
- **Performance Impact**: Image upload compressed client-side before transmission.
- **Testing Requirements**: E2E test for owner sign-up, listing submission, and photo upload.
- **Estimated Complexity**: High
- **Dependencies**: Milestone 1, Milestone 4.

---

### Milestone 6: Customer Features

- **Goal**: Enhance tenant user experience with interactive maps, comparison tools, and saved searches.
- **Business Value**: Increases visitor session duration and lead conversion rates.
- **Technical Tasks**:
  1. Add interactive Leaflet / Google Maps view (`customer.mapView` feature flag).
  2. Implement side-by-side listing comparison drawer (compare up to 3 properties).
  3. Add WhatsApp direct contact button using listing owner configuration (`owner_whatsapp`).
  4. Implement DB wishlist sync (`public.user_favorites`) for signed-in users.
- **Database Changes**: Create table `public.user_favorites (user_id UUID, property_id UUID, created_at TIMESTAMPTZ, PRIMARY KEY (user_id, property_id));`.
- **API Changes**: Add `syncFavorites`, `getUserFavorites` endpoints.
- **Frontend Changes**: Add Map toggle on `/properties`, Comparison Floating Bar, and DB-synced favorite button.
- **Backend Changes**: Implement server favoriting endpoints.
- **Security Considerations**: RLS policy restricting `user_favorites` access to owning `user_id`.
- **Performance Impact**: Map lazy-loaded on user interaction; bundle size isolated via code-splitting.
- **Testing Requirements**: Unit test for favorite sync merge logic; E2E test for comparison tool.
- **Estimated Complexity**: Medium
- **Dependencies**: Milestone 1.

---

### Milestone 7: Agent Portal

- **Goal**: Empower real estate agencies to manage team members, listing portfolios, and client leads.
- **Business Value**: Opens B2B revenue channels with agency subscription models.
- **Technical Tasks**:
  1. Build Agency Team Management interface (`agent.team` feature flag).
  2. Add lead routing rules assigning incoming enquiries to specific agency agents.
  3. Implement agency branded listing pages displaying agency logo and agent badges.
- **Database Changes**:
  - Create table `public.agencies (id UUID, name TEXT, logo_url TEXT, created_at TIMESTAMPTZ);`.
  - Add `agency_id UUID REFERENCES public.agencies(id)` to `public.properties` and `public.user_roles`.
- **API Changes**: Add `getAgencyTeam`, `assignLeadToAgent`, `updateAgencyProfile` RPCs.
- **Frontend Changes**: Build `/agency` dashboard route with team member tables and lead assignment dropdowns.
- **Backend Changes**: Add agency level role check (`assertAgencyAdmin`).
- **Security Considerations**: Multi-tenant isolation ensuring agencies cannot access competitor listings or leads.
- **Performance Impact**: None.
- **Testing Requirements**: Multi-tenant RLS isolation integration test.
- **Estimated Complexity**: High
- **Dependencies**: Milestone 5.

---

### Milestone 8: Analytics & Reporting

- **Goal**: Deliver actionable real-time insights on listing engagement, lead conversion, and market trends.
- **Business Value**: Empowers owners/agents with performance data, driving platform retention.
- **Technical Tasks**:
  1. Integrate PostHog / Mixpanel client event tracking for search, detail view, and enquiry submission.
  2. Build Listing Performance Analytics dashboard displaying views, favorites, and lead conversion rates.
  3. Implement automated weekly email summaries to property owners detailing listing engagement.
- **Database Changes**: Create hyper-table / daily summary table `public.listing_daily_stats (property_id UUID, date DATE, views INT, favorites INT, leads INT, PRIMARY KEY(property_id, date));`.
- **API Changes**: Add `getListingAnalytics`, `trackListingEvent` endpoints.
- **Frontend Changes**: Add engagement charts on owner dashboard using recharts library.
- **Backend Changes**: Scheduled cron job aggregating daily raw events into `listing_daily_stats`.
- **Security Considerations**: Anonymize user IP addresses in analytics tracking payload.
- **Performance Impact**: Event tracking sent asynchronously via `navigator.sendBeacon`.
- **Testing Requirements**: Verification of event dispatch and daily cron aggregation accuracy.
- **Estimated Complexity**: Medium
- **Dependencies**: Milestone 5.

---

### Milestone 9: Monitization & Payments Integration

- **Goal**: Integrate payment gateways to monetize listing boosts, premium owner plans, and agent subscriptions.
- **Business Value**: Direct revenue generation via Razorpay / Stripe payment processing.
- **Technical Tasks**:
  1. Implement Razorpay provider adapter for listing boosts (`LISTING_BOOSTS` SKU in `src/config/platform.ts`).
  2. Build checkout drawer and payment verification webhook handler (`/api/public/webhooks/razorpay`).
  3. Implement featured listing priority sorting algorithm elevating paid listings.
- **Database Changes**:
  - Create table `public.orders (id UUID, user_id UUID, sku TEXT, amount NUMERIC, status TEXT, razorpay_order_id TEXT, created_at TIMESTAMPTZ);`.
  - Add `is_featured BOOLEAN DEFAULT FALSE`, `featured_until TIMESTAMPTZ` to `public.properties`.
- **API Changes**: Add `createPaymentOrder`, `verifyPaymentSignature` server endpoints.
- **Frontend Changes**: Build SKU pricing cards and Razorpay checkout modal.
- **Backend Changes**: Webhook listener verifying HMAC SHA256 payment signatures.
- **Security Considerations**: Cryptographic HMAC signature verification on all webhook callbacks.
- **Performance Impact**: Indexed sorting on `(is_featured DESC, created_at DESC)`.
- **Testing Requirements**: Mock payment flow unit tests; webhook signature verification tests.
- **Estimated Complexity**: High
- **Dependencies**: Milestone 5.

---

### Milestone 10: AI Features

- **Goal**: Embed generative AI capabilities to assist listing creation and property search.
- **Business Value**: Reduces listing creation friction by 80% and improves inquiry matching.
- **Technical Tasks**:
  1. Build AI property description generator using Gemini API (`future.aiDescriptions` feature flag).
  2. Add AI photo quality inspector identifying blurry or dark upload photos.
  3. Implement natural language search parser ("2 BHK flat under 25k in Indiranagar").
- **Database Changes**: None.
- **API Changes**: Add `generateAIDescription`, `inspectPhotoQuality` RPC server functions.
- **Frontend Changes**: Add "Generate with AI" button on property upload form.
- **Backend Changes**: Integration with `@google/genai` SDK using server-side API keys.
- **Security Considerations**: Strict prompt sanitization preventing prompt injection attacks.
- **Performance Impact**: AI calls executed asynchronously with loading skeletons.
- **Testing Requirements**: Mock API unit tests for Gemini endpoint responses.
- **Estimated Complexity**: Medium
- **Dependencies**: Milestone 5.

---

### Milestone 11: Scale to 10,000 Users

- **Goal**: Optimize platform database and server architecture to comfortably support 10,000 active daily users.
- **Business Value**: Maintains sub-100ms response times during regional user acquisition spikes.
- **Technical Tasks**:
  1. Configure Supabase connection pooling (Transaction Mode via PgBouncer / Supavisor).
  2. Add Redis / Upstash caching layer for public property list and detail read endpoints.
  3. Implement automated Sentry error reporting across SSR runtime and client browser.
- **Database Changes**: Add composite indexes on `properties(city, is_approved, price)`.
- **API Changes**: Wrap query fetchers with Redis `get`/`set` cache strategy (60s TTL).
- **Frontend Changes**: None.
- **Backend Changes**: Middleware cache interceptor.
- **Security Considerations**: Redis cache keys sanitized to avoid cache poisoning.
- **Performance Impact**: Cache hits return in <15ms without hitting primary Postgres DB.
- **Testing Requirements**: k6 load testing script executing 500 requests/sec.
- **Estimated Complexity**: Medium
- **Dependencies**: Milestones 1–3.

---

### Milestone 12: Scale to 100,000 Users

- **Goal**: Transition infrastructure to support 100,000 active daily users with multi-region delivery.
- **Business Value**: Guarantees platform stability across nationwide scale.
- **Technical Tasks**:
  1. Deploy Supabase Multi-Region Database Read Replicas.
  2. Transition static assets and photo delivery to dedicated Cloudflare R2 / AWS CloudFront CDN.
  3. Implement Meilisearch / Algolia for instant full-text search indexing.
- **Database Changes**: Setup Postgres logical replication to search indexer worker.
- **API Changes**: Search endpoint proxies requests directly to Meilisearch engine.
- **Frontend Changes**: Replace basic search bar with instant autocomplete command palette.
- **Backend Changes**: Event driven worker syncing Postgres property changes to Meilisearch.
- **Security Considerations**: Dedicated search API keys restricted to read-only search operations.
- **Performance Impact**: Full-text search latency reduced to <20ms for complex multi-filter queries.
- **Testing Requirements**: k6 load test simulating 5,000 concurrent users.
- **Estimated Complexity**: High
- **Dependencies**: Milestone 11.

---

### Milestone 13: Scale to 1,000,000 Users

- **Goal**: Enterprise scale architecture capable of handling 1M+ active users and high-concurrency peak traffic.
- **Business Value**: Unlocks nationwide real estate portal dominance with 99.99% availability.
- **Technical Tasks**:
  1. Decompose monolithic SSR API routes into specialized microservices (Auth, Search, Enquiries, Payments).
  2. Implement Kafka / RabbitMQ event queue for async lead processing and notifications.
  3. Deploy multi-region Kubernetes (EKS/GKE) clusters running Nitro server runners behind global load balancers.
- **Database Changes**: Shard `enquiries` and `audit_logs` tables by date/region; implement table partitioning.
- **API Changes**: Microservice gRPC / REST API gateway pattern.
- **Frontend Changes**: None.
- **Backend Changes**: Complete microservice architecture transition.
- **Security Considerations**: Zero-trust internal network service mesh (mTLS).
- **Performance Impact**: Distributed architecture supports 50,000+ requests/sec with zero single point of failure.
- **Testing Requirements**: Full chaos engineering and multi-region failover testing.
- **Estimated Complexity**: High
- **Dependencies**: Milestone 12.

---

## 8. Priority Ranking Rationale

### P0 — Critical Before Production

- **Move Admin Role Check to `beforeLoad`**: Direct security vulnerability; non-admin users could briefly view protected admin dashboard UI layouts before query resolution.
- **Implement Server-Side Database Search & Pagination**: Performance blocker; loading all properties into browser JS memory will freeze mobile devices as listing count exceeds 200.
- **Replace In-Memory Admin Aggregations with SQL `COUNT(*)`**: Server stability blocker; loading full table rows into Node memory causes high memory overhead under load.
- **Fix Hardcoded Canonical Domain URLs**: Critical SEO bug; hardcoded staging domains will ruin Google search engine indexing.

### P1 — Should Complete Before Launch

- **Add HTTP Security Response Headers**: Defends against clickjacking (`X-Frame-Options`) and cross-site scripting (`CSP`).
- **Image WebP URL Optimization**: Reduces mobile page payload sizes by 70%, directly improving LCP and Core Web Vitals.
- **Parallelize Rate-Limiting Count Queries**: Cuts enquiry API latency from ~300ms to ~60ms.
- **Provision Cloudflare Turnstile Keys**: Prevents automated bot submission spam on public lead forms.

### P2 — Can Be Completed After Launch

- **Standardize LocalStorage Key (`urf:favorites`)**: Brand cleanup; low user impact if key migration function is implemented.
- **Prune Unused UI Primitive Components**: Code hygiene; reduces repository file count without affecting runtime performance.
- **DB-Synced Wishlist for Logged-In Users**: Convenience feature; local storage fallback functions completely for guest browsing.
- **Property Owner Upload Portal**: Strategic milestone for direct listing supply acquisition post-launch.

### P3 — Future Enhancements

- **AI Description Generation & Photo Inspector**: Value-add automation.
- **Multi-Language Internationalization (i18n)**: Expansion capability for non-English regional markets.
- **PWA Capabilities**: Enhanced mobile offline experience.
