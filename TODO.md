# Urban Rental Flats (URF) — Task Backlog & Roadmap

## 🔴 High Priority Tasks (Pre-Production Fixes)

- [x] **Move Admin Role Check to Route Guard**:
  - Update `src/routes/_authenticated/route.tsx` to verify `public.user_roles` inside `beforeLoad` / route guard instead of waiting for component mounting in `admin.tsx`.
- [x] **Standardize Wishlist LocalStorage Key**:
  - Standardized on `urf:favorites` across the client storage adapters.
- [x] **Database Server-Side Search & Pagination**:
  - Refactored `fetchProperties()` (`src/lib/properties.ts`) and `properties.index.tsx` to accept page offset, limits, and server-side Supabase filter parameters (`.range()`, `.ilike()`).
- [x] **Environment Variable Canonical URLs**:
  - Dynamic domain variable `import.meta.env.VITE_APP_URL` / `APP_URL` across all routes.

---

## 🟡 Medium Priority Tasks (Growth & Scaling)

- [x] **SQL Aggregations for Admin Overview**:
  - Refactor `loadOverview()` in `src/lib/admin.server.ts` to execute Postgres `COUNT(*)` queries instead of loading full rows into Node memory.
- [ ] **Image Optimization Pipeline**:
  - Implement image resizing parameters (`?w=600&q=80`) on Unsplash URLs rendered in `<PropertyCard />` and detail gallery.
- [ ] **Security Response Headers**:
  - Configure `Content-Security-Policy`, `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff` in Nitro / Vite server entry (`src/server.ts`).
- [ ] **Clean Up Unused UI Primitives**:
  - Audit and prune unreferenced Shadcn/Radix UI wrappers in `src/components/ui/`.

---

## 🟢 Low Priority Tasks & Polish

- [ ] **Multi-Language Internationalization (i18n)**:
  - Wire reserved locale definitions in `src/config/platform.ts` (`hi`, `mr`, `ta`, `te`, `kn`, `bn`) into React translation provider.
- [ ] **Enable Cloudflare Turnstile CAPTCHA in Staging**:
  - Provision `VITE_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in deployment environment settings.
- [ ] **Sitemap Ping Automation**:
  - Implement automated ping to Google Search Console upon property approval.

---

## 🐞 Known Bugs & Tech Debt

- **Bug**: Unprivileged authenticated users can navigate to `/_authenticated/admin` and trigger initial component render before `checkIsAdmin` returns `false`.
- **Tech Debt**: In-memory array filtering in `properties.index.tsx` causes initial load to fetch full dataset regardless of user query filters.
- **Tech Debt**: `loadOverview()` loads all rows from `enquiries` table into server memory.

---

## 🔮 Future Features (Roadmap Phases)

- [ ] **Phase 2 — Owner Portal & Uploads**:
  - Mobile-first property creation form (`owner.upload` feature flag).
  - Photo upload directly to Cloudinary / Supabase Storage (`owner.multiImage`).
  - Listing status toggle (`Mark Rented / Sold`).
- [ ] **Phase 2 — Payment Integration**:
  - Razorpay provider adapter for owner listing boosts (`LISTING_BOOSTS`) and subscription SKUs (`PLANS`).
- [ ] **Phase 3 — Scale & AI Integration**:
  - AI-powered property description generator (`future.aiDescriptions`).
  - Google Maps nearby school, hospital, and transit overlays (`customer.nearbySchools`, `customer.mapView`).

---

## 📋 Production Release Checklist

- [ ] Environment variables configured (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
- [ ] Supabase migrations executed (`npx supabase db push`).
- [ ] Initial admin user created in `public.user_roles`.
- [ ] SSL certificate active on domain.
- [ ] Cloudflare Turnstile keys provisioned and verified.
- [ ] Rate limits tested on `/api/public/enquiries`.
- [ ] Sitemap accessible at `/sitemap.xml`.
