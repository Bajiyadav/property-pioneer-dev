# Urban Rental Flats (URF) — Complete Project Analysis

## Executive Summary

Urban Rental Flats (URF) is an API-first, modular real-estate platform built on **TanStack Start** (Vite + React 19 SSR) and **Supabase** (Postgres + Row-Level Security + Auth). The application serves anonymous home seekers looking for rental or purchase properties across India, while providing an authenticated dashboard for platform administrators to manage property approvals, customer enquiries, and security audit logs.

The architecture emphasizes security baseline primitives (rate-limiting, honeypots, Turnstile CAPTCHA, least-privilege column-level database grants) and modular extension (feature switchboard with ~100+ reserved capabilities across 10 domains).

---

## Technology Stack

| Layer                    | Primary Technology    | Version / Tooling                              |
| ------------------------ | --------------------- | ---------------------------------------------- |
| **Language**             | TypeScript            | `^5.8.3`                                       |
| **Frontend Core**        | React                 | `^19.2.0`                                      |
| **SSR Meta-Framework**   | TanStack Start        | `^1.168.26`                                    |
| **Routing**              | TanStack React Router | `^1.170.16`                                    |
| **Build Tool & Bundler** | Vite                  | `^8.0.16`                                      |
| **Server Engine**        | Nitro / h3            | `3.0.260603-beta`                              |
| **Database & Auth**      | Supabase (Postgres)   | `@supabase/supabase-js ^2.110.9`               |
| **State Caching**        | TanStack React Query  | `^5.101.1`                                     |
| **Styling**              | Tailwind CSS v4       | `@tailwindcss/vite ^4.2.1`                     |
| **UI Components**        | Radix UI Primitives   | Accordion, Dialog, Dropdown, Table, Tabs, etc. |
| **Validation**           | Zod                   | `^3.24.2`                                      |
| **Icons**                | Lucide React          | `^0.575.0`                                     |
| **Notifications**        | Sonner                | `^2.0.7`                                       |

---

## Project Structure

```text
property-pioneer-dev/
├── README.md
├── ARCHITECTURE.md
├── TODO.md
├── CHANGELOG.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── bunfig.toml / bun.lock
├── eslint.config.js / .prettierrc
├── docs/
│   ├── PROJECT_ANALYSIS.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── COMPONENTS.md
│   ├── AUTHENTICATION.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   ├── PERFORMANCE.md
│   └── SUMMARY.md
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 20260728193751_76e8b731-0721-4871-9e37-877d4d4a72d9.sql
│       ├── 20260729052711_d3d8dfc1-f3d9-460f-9f6c-fb49152c52ea.sql
│       ├── 20260729094121_fe6216d2-f966-4ec6-8ef4-4b184a8f2b30.sql
│       ├── 20260729184046_7ae3d68c-b0cf-4e89-a360-d917ad012a79.sql
│       ├── 20260730043953_7461f26f-01bd-4a8e-ac4f-7c6e49b96b3e.sql
│       ├── 20260730044133_bbde71b3-90d8-48a5-8c1c-f5ab0c746381.sql
│       ├── 20260804175920_da254c9c-2a6f-424f-88bc-36fa720b8ddd.sql
│       ├── 20260804175948_d923f827-e1f1-473b-bd2f-d5b5899e3825.sql
│       └── 20260805070818_fcc2375d-071a-48b4-a087-fc344765729e.sql
└── src/
    ├── server.ts
    ├── start.ts
    ├── router.tsx
    ├── routeTree.gen.ts
    ├── styles.css
    ├── assets/
    ├── config/
    │   ├── features.ts
    │   ├── platform.ts
    │   └── rbac.ts
    ├── integrations/
    │   └── supabase/
    │       ├── client.ts
    │       ├── client.server.ts
    │       ├── auth-middleware.ts
    │       ├── auth-attacher.ts
    │       └── types.ts
    ├── lib/
    │   ├── properties.ts
    │   ├── enquiries.ts
    │   ├── useFavorites.ts
    │   ├── security.server.ts
    │   ├── admin.functions.ts
    │   ├── admin.server.ts
    │   ├── error-capture.ts
    │   ├── error-page.ts
    │   ├── lovable-error-reporting.ts
    │   └── utils.ts
    ├── components/
    │   ├── BrandMark.tsx
    │   ├── PropertyCard.tsx
    │   ├── TurnstileWidget.tsx
    │   └── ui/
    └── routes/
        ├── __root.tsx
        ├── index.tsx
        ├── properties.tsx
        ├── properties.index.tsx
        ├── properties.$id.tsx
        ├── favorites.tsx
        ├── auth.tsx
        ├── sitemap[.]xml.ts
        ├── $.tsx
        └── _authenticated/
            ├── route.tsx
            └── admin.tsx
```

---

## Folder Breakdown

- `src/config/`: System switchboard and configuration domain contracts (`features.ts`, `platform.ts`, `rbac.ts`).
- `src/integrations/supabase/`: Client and server Supabase SDK initializers, JWT validation middleware, client RPC token attacher, and database types.
- `src/lib/`: Domain query helpers (`properties.ts`, `enquiries.ts`), client state hooks (`useFavorites.ts`), server-only security primitives (`security.server.ts`), and admin RPC handlers (`admin.functions.ts`, `admin.server.ts`).
- `src/components/`: Reusable UI components (`BrandMark`, `PropertyCard`, `TurnstileWidget`) and 46 Radix UI primitive wrappers under `ui/`.
- `src/routes/`: TanStack Router file-based route definitions for public pages, search pages, detail pages, authentication, and admin dashboard.

---

## Dependency Graph

```text
[src/routes] ──> [src/components] ──> [src/lib] ──> [src/integrations/supabase]
      │                   │                 │                   │
      └───────────────────┴─────────────────┴───────────────────┴──> [src/config]
```

---

## Component & Page Hierarchy

- **Root Layout (`__root.tsx`)**:
  - `SiteHeader`: Navigation bar with brand logo, browse, favorites, and auth link.
  - `Outlet`: Mounts active route component.
  - `SiteFooter`: Footer with copyright and brand tagline.
  - `Toaster`: Sonner notification container.
- **Page Hierarchy**:
  - `/` (`index.tsx`): Hero search bar, popular cities, featured listings.
  - `/properties` (`properties.tsx` -> `properties.index.tsx`): Multi-field property filter form and listing card grid.
  - `/properties/$id` (`properties.$id.tsx`): Photo gallery, property specs, save button, enquiry modal, `Residence` JSON-LD script.
  - `/favorites` (`favorites.tsx`): Saved homes grid reading from `localStorage`.
  - `/auth` (`auth.tsx`): Sign in / Sign up form handling Supabase Auth.
  - `/_authenticated/admin` (`admin.tsx`): Protected admin layout containing tabs for Overview Metrics, Listings Approval, Customer Enquiries, and Security Audit Logs.

---

## Route Structure

| Path                    | File Path                             | Route Type   | Protection                     |
| ----------------------- | ------------------------------------- | ------------ | ------------------------------ |
| `/`                     | `src/routes/index.tsx`                | Page         | Public                         |
| `/properties`           | `src/routes/properties.tsx`           | Layout       | Public (Search validation)     |
| `/properties/`          | `src/routes/properties.index.tsx`     | Page         | Public                         |
| `/properties/$id`       | `src/routes/properties.$id.tsx`       | Page         | Public (Loader pre-fetch)      |
| `/favorites`            | `src/routes/favorites.tsx`            | Page         | Public (Client state)          |
| `/auth`                 | `src/routes/auth.tsx`                 | Page         | Public (Redirect if signed in) |
| `/_authenticated`       | `src/routes/_authenticated/route.tsx` | Layout Guard | Authenticated (`getUser()`)    |
| `/_authenticated/admin` | `src/routes/_authenticated/admin.tsx` | Page         | Admin Role (`checkIsAdmin`)    |
| `/api/public/enquiries` | `src/routes/api/public/enquiries.ts`  | API POST     | Public (Anti-abuse protected)  |
| `/sitemap.xml`          | `src/routes/sitemap[.]xml.ts`         | API GET      | Public                         |
| `/*`                    | `src/routes/$.tsx`                    | Catch-all    | Public (404)                   |

---

## State Management & Workflows

1. **Server State & Query Caching**: Handled via `@tanstack/react-query` (`QueryClientProvider` initialized in `router.tsx`). Key query keys: `["properties"]`, `["property", id]`, `["admin", "overview"]`, `["admin", "properties"]`, `["admin", "enquiries"]`, `["admin", "audit"]`.
2. **URL Search Parameter State**: Zod schema in `properties.tsx` handles fallback parsing for `q`, `city`, `listing`, `minPrice`, `maxPrice`, `beds`.
3. **Client-Side Wishlist State**: Managed via `useFavorites.ts` custom hook reading/writing JSON array to `window.localStorage` under key `nestwise:favorites`.

---

## Authentication & Authorization Flow

- **Authentication**: Email/Password handled via Supabase Auth (`supabase.auth.signInWithPassword`, `signUp`).
- **RPC Auth Token Attachment**: Client RPC middleware (`auth-attacher.ts`) reads current session token and attaches `Authorization: Bearer <token>` to all server function requests.
- **Server Function Auth Verification**: Server middleware (`auth-middleware.ts`) extracts Bearer token, verifies claims via `supabase.auth.getClaims()`, and attaches `userId` and `supabase` client to function context.
- **Authorization (RBAC)**: Role table `public.user_roles` (`user_id`, `role`). `checkIsAdmin` verifies `role = 'admin'` for `context.userId`.

---

## Database & API Flow

- **Database**: PostgreSQL hosted on Supabase.
- **Database Column-Level Security (CLS)**: `anon` and `authenticated` roles can SELECT public property columns, but REVOKED from accessing `owner_name`, `owner_phone`, `owner_whatsapp`, `owner_email`.
- **Service Role Bypass**: Server-side functions and API handlers import `supabaseAdmin` (`client.server.ts`) using `SUPABASE_SERVICE_ROLE_KEY` to perform privileged queries on `enquiries` and `audit_logs` (which have deny-all RLS for client roles).

---

## Property Listing & Admin Dashboard Flow

1. **Public Browsing Flow**: Anonymous user queries `fetchProperties()`. Client queries Supabase using publishable key. Approved listings return public columns only. User filters listings in browser memory or views detail page.
2. **Lead Submission Flow**: Visitor fills enquiry form on detail page. POST request sent to `/api/public/enquiries`. Handler validates Zod input, checks honeypot, verifies submission timer (`elapsedMs >= 2500`), checks Turnstile CAPTCHA, evaluates 5 sliding-window rate limits in Postgres, and inserts lead using `supabaseAdmin`.
3. **Admin Dashboard Flow**: Admin visits `/_authenticated/admin`. Route layout checks authentication. Component calls `checkIsAdmin`. Upon confirmation, dashboard loads overview metrics, pending property lists, customer leads, and security audit logs via server functions. Admin toggles approval/featured status via `updateAdminProperty` mutation.

---

## Build & Deployment Process

- **Build Tool**: Vite (`vite build`) using `@tanstack/router-plugin` and `@tailwindcss/vite`.
- **Runtime Server**: Nitro server engine executing `src/server.ts` entry handler.
- **Static Assets**: Pre-rendered static chunks served via Vite build pipeline.

---

## Observations & Recommendations

### Performance Observations

- **Client-Side In-Memory Search**: `fetchProperties()` fetches all approved properties in a single query; search filters run in-memory via `useMemo`. As property counts grow, initial payload size and client memory will scale linearly.
- **Admin Metrics In-Memory Aggregation**: `loadOverview()` loads all property and enquiry rows into server memory to count and filter using JS arrays.

### Security Observations

- **Strong Anti-Abuse Baseline**: Excellent protection using sliding-window Postgres rate limits, submit timing checks, honeypot fields, and Turnstile CAPTCHA.
- **Robust Database CLS & RLS**: Sensitivity of owner contact information is enforced at the database level by revoking column permissions.
- **Admin Guard Sub-optimality**: Role check (`checkIsAdmin`) occurs inside component `useQuery` rather than in route `beforeLoad`.

### Technical Debt & Recommendations

1. Move `checkIsAdmin` role verification into `_authenticated/route.tsx`'s `beforeLoad` function.
2. Rename `nestwise:favorites` localStorage key to `urf:favorites`.
3. Refactor client-side property search to use Supabase database-level pagination and filtering.
4. Replace JS array counting in `admin.server.ts` with SQL `COUNT(*)` aggregations.
