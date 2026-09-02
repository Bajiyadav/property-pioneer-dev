# Seedha Properties — Production Readiness Checklist

> **Document Type:** Pre-Launch & Operational Production Audit Checklist  
> **Repository:** `property-pioneer-dev`  
> **Target Audience:** DevOps Engineers, Lead Architects, Security Auditors & System Administrators

---

## 1. Authentication Checklist

- [ ] **JWT Key Rotation**: Supabase JWT secret is cryptographically secure and rotated annually.
- [ ] **Token Expiration**: Access token lifetime set to 3600s (1 hour) with automatic refresh token rotation.
- [ ] **Client Token Attacher**: Client middleware (`auth-attacher.ts`) automatically injects Bearer JWT header into all TanStack Start RPC calls.
- [ ] **Secure Storage**: JWT tokens stored securely in client storage (HttpOnly cookies or encrypted localStorage).
- [ ] **Session Revalidation**: Server middleware (`requireSupabaseAuth`) revalidates session claims on every privileged RPC call.
- [ ] **Password Security**: Password strength policy enforced (min 8 chars, uppercase, lowercase, special character).
- [ ] **Rate Limiting on Auth**: Supabase Auth rate limits active for login and signup attempts.

---

## 2. Authorization & Access Control Checklist

- [ ] **Route Guard Placement**: Admin role check (`checkIsAdmin`) executed inside `src/routes/_authenticated/route.tsx` `beforeLoad` function before component mounting.
- [ ] **Row-Level Security (RLS)**:
  - [ ] `public.properties`: Approved listings readable by public; all write operations restricted to service-role or admin.
  - [ ] `public.enquiries`: Deny-all RLS policy (`USING (false)`); inserts/selects executed strictly via `supabaseAdmin` service role key.
  - [ ] `public.audit_logs`: Deny-all RLS policy (`USING (false)`); audit logs executed strictly via `supabaseAdmin`.
  - [ ] `public.user_roles`: Read access restricted to authenticated user for own record (`user_id = auth.uid()`).
- [ ] **Column-Level Security (CLS)**: Owner contact details (`owner_name`, `phone`, `whatsapp`, `email`) explicitly `REVOKE`'d from `anon` and `authenticated` roles.
- [ ] **Security Definer Function Permissions**: Functions (`has_role`, `check_is_admin`) `REVOKE`'d from `PUBLIC` and `anon` execution.
- [ ] **Admin Assertion Helper**: All server RPC endpoints invoke `assertAdmin(context)` prior to database mutations.

---

## 3. Database Checklist

- [ ] **Database Indexes**:
  - [ ] Index on `properties(is_approved, created_at DESC)`.
  - [ ] Index on `properties(city, is_approved)`.
  - [ ] Index on `enquiries(created_at DESC)`.
  - [ ] Index on `audit_logs(created_at DESC)`.
  - [ ] Foreign key index on `user_roles(user_id)`.
- [ ] **Connection Pooling**: Supabase PgBouncer connection pooling configured in Transaction Mode for high concurrency.
- [ ] **Migration Scripts**: All SQL scripts in `supabase/migrations/` verified and applied cleanly (`npx supabase db push`).
- [ ] **Prepared Statements**: All database interactions utilize parameterized queries preventing SQL injection.

---

## 4. Performance & Core Web Vitals Checklist

- [ ] **Server-Side Pagination**: Listing endpoints execute Postgres `.range()` pagination (max 24 items per page).
- [ ] **Image Optimization**:
  - [ ] Unsplash and cover images appended with `?auto=format&w=600&q=80` params.
  - [ ] Image tags include `loading="lazy"` and explicit `width`/`height` bounds.
  - [ ] Hero image preloaded in `<head>`.
- [ ] **Client State Caching**: React Query `staleTime` configured to 5 minutes (300,000ms) for public property listings.
- [ ] **Bundle Size Optimization**: Code splitting verified via TanStack Router automatic route splitting.
- [ ] **Lighthouse Performance Score**: Target score >= 90 achieved on Mobile and Desktop viewports.

---

## 5. SEO Checklist

- [ ] **Meta Titles & Descriptions**: Unique title and meta description tags rendered for homepage, property index, and detail pages.
- [ ] **Canonical URL**: Dynamic canonical tag configured using `import.meta.env.VITE_APP_URL`.
- [ ] **JSON-LD Schema**: Validated `Residence` schema rendered on property detail pages (`properties.$id.tsx`).
- [ ] **Dynamic XML Sitemap**: Sitemap route operational at `/sitemap.xml` returning valid XML listing approved routes.
- [ ] **OpenGraph & Twitter Cards**: Social media image, title, and description tags present on all public routes.
- [ ] **Robots.txt**: Operational `robots.txt` disallowing `/admin` and pointing to `/sitemap.xml`.

---

## 6. Accessibility (a11y) Checklist

- [ ] **ARIA Labels**: Descriptive ARIA labels on icon buttons (e.g. wishlist heart toggle, mobile nav menu).
- [ ] **Keyboard Navigation**: Focus outlines visible; modals dismissible via `Escape` key.
- [ ] **Color Contrast**: Color contrast ratio >= 4.5:1 maintained across dark/light UI tokens.
- [ ] **Form Labeling**: All input fields bound to `<label>` elements via `htmlFor`.

---

## 7. Error Handling Checklist

- [ ] **SSR Unhandled Error Catch**: Nitro server entry (`src/server.ts`) catches unhandled SSR errors and outputs sanitized HTML error page.
- [ ] **React Error Boundaries**: Component-level error boundary wrapped around major route layouts.
- [ ] **Sanitized API Errors**: Public API endpoints sanitize internal SQL error messages before returning 400/500 responses.
- [ ] **404 Catch-All Route**: Route `$.tsx` handles non-existent paths gracefully with back to home navigation.

---

## 8. Logging Checklist

- [ ] **Audit Logging Engine**: Lead creations, rate-limit triggers, and CAPTCHA rejections logged to `public.audit_logs`.
- [ ] **Structured Log Output**: Server functions produce structured JSON log entries including IP, user agent, and timestamp.
- [ ] **No Sensitive Data Logging**: Passwords, owner phone numbers, and JWT secret keys omitted from server logs.

---

## 9. Monitoring Checklist

- [ ] **Uptime Monitoring**: External ping monitoring service (BetterStack / Pingdom) configured for `/` and `/sitemap.xml`.
- [ ] **Error Tracking**: Sentry / Lovable error tracking active for client and server runtime exceptions.
- [ ] **Database Health Monitoring**: Supabase CPU, memory, IOPS, and disk usage alerts configured.

---

## 10. Analytics Checklist

- [ ] **Product Analytics**: Event tracking configured for property view, search filter apply, and lead submission.
- [ ] **Privacy Compliance**: Analytics configured without tracking PII; IP address anonymization enabled.

---

## 11. Database Backups Checklist

- [ ] **Automated Backups**: Supabase daily automated database backups active.
- [ ] **Point-In-Time Recovery (PITR)**: PITR enabled with 7-day retention window.
- [ ] **Backup Restoration Test**: Quarterly automated restore test verified on staging environment.

---

## 12. Disaster Recovery Checklist

- [ ] **Recovery Time Objective (RTO)**: RTO target < 1 hour established.
- [ ] **Recovery Point Objective (RPO)**: RPO target < 5 minutes established via PITR logs.
- [ ] **Failover Documentation**: Emergency DNS failover procedures documented in DevOps playbook.

---

## 13. Deployment Checklist

- [ ] **Node.js Environment**: Production runtime on Node.js v20+ LTS.
- [ ] **Build Command**: Clean production build executed (`npm run build`).
- [ ] **Asset Hashing**: Vite build outputs content-hashed JS/CSS filenames for cache busting.
- [ ] **Domain SSL**: Valid SSL/TLS certificate configured with HSTS enabled.

---

## 14. Environment Variables Checklist

- [ ] `VITE_SUPABASE_URL`: Valid production Supabase URL configured.
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`: Valid publishable API key configured.
- [ ] `SUPABASE_URL`: Server-side Supabase URL configured.
- [ ] `SUPABASE_SERVICE_ROLE_KEY`: Secret service role key set in server environment ONLY (never exposed to client).
- [ ] `VITE_APP_URL`: Production canonical domain URL set (`https://seedhaproperties.com`).
- [ ] `VITE_TURNSTILE_SITE_KEY`: Production Cloudflare Turnstile site key configured.
- [ ] `TURNSTILE_SECRET_KEY`: Production Turnstile secret key set in server environment.

---

## 15. Security Checklist

- [ ] **HTTP Response Headers**:
  - [ ] `Content-Security-Policy`: Restricts script, style, and iframe sources.
  - [ ] `X-Frame-Options`: Set to `DENY`.
  - [ ] `X-Content-Type-Options`: Set to `nosniff`.
  - [ ] `Referrer-Policy`: Set to `strict-origin-when-cross-origin`.
- [ ] **Anti-Abuse Safeguards**:
  - [ ] Honeypot hidden input validation active.
  - [ ] Form submission timer check (`MIN_SUBMIT_MS = 2500`) active.
  - [ ] 5 Sliding-window rate limiters operational on public endpoints.
- [ ] **Dependency Audit**: `npm audit` returns 0 critical or high vulnerabilities.

---

## 16. Testing Checklist

- [ ] **Unit Tests**: Core security logic, Zod validation schemas, and formatters covered by Vitest tests.
- [ ] **Integration Tests**: Supabase RPC functions and auth middleware verified in staging DB.
- [ ] **End-to-End (E2E) Tests**: Playwright scripts passing for lead submission, property detail navigation, and admin login.
- [ ] **Load Testing**: System load tested up to 500 requests/sec with 0 error rate.

---

## 17. CI/CD Pipeline Checklist

- [ ] **Automated Lint & Typecheck**: GitHub Actions runner executes `npm run lint` and `tsc --noEmit` on pull requests.
- [ ] **Automated Test Run**: CI pipeline executes unit test suite before allowing deployment merge.
- [ ] **Staging Auto-Deploy**: Commits to `main` auto-deploy to staging environment.
- [ ] **Production Tagged Release**: Production deployments triggered strictly on release tag creation.
