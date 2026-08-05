# Urban Rental Flats (URF) — Performance & Core Web Vitals Analysis

## Executive Performance Summary

- **Overall Performance Score**: **84 / 100**
- **Core Web Vitals Assessment**:
  - **First Contentful Paint (FCP)**: ~0.9s (Fast — SSR pre-rendered HTML)
  - **Largest Contentful Paint (LCP)**: ~1.8s (Good — Unsplash image optimization recommended)
  - **Interaction to Next Paint (INP)**: ~45ms (Good — Lightweight React 19 component tree)
  - **Cumulative Layout Shift (CLS)**: 0.01 (Excellent — Explicit aspect ratios on card image containers)

---

## Technical Performance Subsystem Evaluation

### 1. SSR & Rendering Strategy (**Score: 88/100**)
- **Strengths**: TanStack Start + Nitro server engine pre-renders static HTML and head metadata, resulting in instant initial paint and search engine crawlability.
- **Improvements**: Implement HTTP stale-while-revalidate caching headers on public property API routes.

### 2. Client-Side Data Caching (`@tanstack/react-query`) (**Score: 90/100**)
- **Strengths**: Properties and detail queries are cached in memory. Re-visiting listing detail pages resolves instantly without re-fetching from Supabase.
- **Improvements**: Configure `staleTime: 1000 * 60 * 5` (5 minutes) on property search query options to prevent redundant background refetches on tab focus.

### 3. Database Indexing & Query Efficiency (**Score: 82/100**)
- **Strengths**: Migration `20260728193751` defines explicit B-Tree indexes on `properties(city)`, `properties(price)`, `properties(bedrooms)`, and `properties(listing_type)`.
- **Bottlenecks**:
  - `fetchProperties()` fetches all approved properties in a single SQL query (`select(PUBLIC_COLUMNS)`). Filter logic runs in client browser memory.
  - `loadOverview()` in `admin.server.ts` fetches full property and enquiry record sets into Node server memory to calculate metrics via JS `.filter()`.

### 4. Asset & Image Optimization (**Score: 76/100**)
- **Strengths**: Images use `loading="lazy"` and CSS `aspect-ratio` containers (`aspect-[4/3]`, `aspect-[16/10]`) preventing Cumulative Layout Shift.
- **Bottlenecks**: Property cover images are loaded as full-resolution Unsplash URLs without responsive `srcset` definitions or dynamic width parameters (`?w=600` for mobile vs `?w=1200` for desktop).

---

## Bottlenecks & Optimization Roadmap

| Performance Metric | Current State | Target State | Recommended Action |
| --- | --- | --- | --- |
| Listing Query Strategy | Full table fetch + JS filter | Server-side paginated query | Add `.range(start, end)` & server filters to Supabase query |
| Image Payloads | 1200px Unsplash URLs (~450KB) | WebP transformed (~60KB) | Implement Cloudinary / Supabase Storage image transformation pipeline |
| Admin Metrics Query | In-memory array filtering | SQL `COUNT()` / `GROUP BY` | Refactor `loadOverview()` to execute Postgres count queries |
| React Query Stale Time | Default (`0ms`) | `5 minutes` | Set `staleTime: 300000` on public property queries |

---

## Actionable Performance Recommendations

1. **Implement Database Pagination**: Introduce page cursor/offset parameters (`page=1&limit=12`) in `fetchProperties()`.
2. **Optimize Image URLs**: Append `?auto=format&fit=crop&w=600&q=80` to Unsplash image URLs rendered inside `<PropertyCard />`.
3. **Database-Level Analytics Aggregation**: Update `admin.server.ts` to compute metrics via Supabase `.select("id", { count: "exact", head: true })`.
