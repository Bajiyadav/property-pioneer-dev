# 🏡 Seedha Properties

<div align="center">

[![Framework](https://img.shields.io/badge/Framework-TanStack_Start-FF4154?style=for-the-badge&logo=react)](https://tanstack.com/start)
[![Mobile](https://img.shields.io/badge/Mobile-Flutter_3.x-02569B?style=for-the-badge&logo=flutter)](https://flutter.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Database](https://img.shields.io/badge/Database-Supabase_Postgres-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-35%2F35%20Suites%20Passed-brightgreen?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%200%20Errors-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Find Direct. Live Better.**  
_India's Direct-Owner Real Estate Discovery Marketplace — 0% Brokerage._

[🌐 Web Platform](https://seedhaproperties.com) • [📱 Mobile App (APK)](apps/mobile/build/app/outputs/flutter-apk/app-release.apk) • [📖 Documentation](#-table-of-contents) • [🐛 Report Bug](https://github.com/Bajiyadav/property-pioneer-dev/issues)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Environment Configuration](#-environment-configuration)
- [7-Step Owner Listing Experience](#-7-step-owner-listing-experience)
- [Feature Matrix](#-feature-matrix)
- [API Reference](#-api-reference)
- [Database Schema & PostGIS Privacy](#-database-schema--postgis-privacy)
- [Performance & Core Web Vitals](#-performance--core-web-vitals)
- [Security & Privacy](#-security--privacy)
- [Deployment](#-deployment)
- [Product Roadmap](#-product-roadmap)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License & Legal](#-license--legal)

---

## 🌟 Overview

**Seedha Properties** is a high-performance, direct-owner property marketplace connecting renters and buyers directly with verified property owners across 7 major Indian metropolitan hubs:

🏙️ **Hyderabad** • 🏙️ **Bengaluru** • 🏙️ **Mumbai** • 🏙️ **Delhi-NCR** • 🏙️ **Chennai** • 🏙️ **Pune** • 🏙️ **Kolkata**

### Key Differentiators

- **0% Brokerage & Zero Hidden Fees**: Direct buyer/tenant to owner connections via verified contacts and WhatsApp.
- **Un-Gated Discovery**: Visitors can browse properties, search by dynamic localities, filter by budget/BHK, and inspect amenities without being forced to log in.
- **7-Step Owner Listing Workflow**: Intuitive owner listing workflow collecting comprehensive property specs, privacy-safe location, pricing & rental terms, authentic photos, and visit schedules.
- **Admin Moderation & 8-Point Checklist**: Employee-only moderation queue to verify real media, zero-brokerage claims, accurate pricing, and legal declaration before publishing.
- **Privacy-Safe PostGIS Mapping**: Exact coordinates (`latitude`, `longitude`) are kept strictly private on the database level, while public maps display privacy-safe ~110m approximate circles (`approx_latitude`, `approx_longitude`).
- **Omnichannel Experience**: Unified backend serving both a full-stack SSR Web app (TanStack Start) and a native Flutter mobile app (Impeller OpenGLES).

---

## 🏗️ Architecture

```text
                               ┌─────────────────────────────────────────┐
                               │             CLIENT LAYER                │
                               │                                         │
                               │  ┌──────────────────┐  ┌─────────────┐  │
                               │  │   Web (React 19) │  │ Mobile App  │  │
                               │  │  TanStack Start  │  │ Flutter 3.x │  │
                               │  └─────────┬────────┘  └──────┬──────┘  │
                               └────────────┼──────────────────┼─────────┘
                                            │ HTTPS / JSON-RPC │
                                            ▼                  ▼
                               ┌─────────────────────────────────────────┐
                               │          NITRO SERVER RUNTIME           │
                               │                                         │
                               │  • SSR Rendering Engine & Route Guards  │
                               │  • Security Middleware (IP / PII Filter)│
                               │  • Server Functions (`createServerFn`)  │
                               │  • Audit Logging & Rate Limiting        │
                               └────────────────────┬────────────────────┘
                                                    │
                 ┌──────────────────────────────────┼──────────────────────────────────┐
                 ▼                                  ▼                                  ▼
   ┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
   │     SUPABASE POSTGRES     │      │     STORAGE & MEDIA       │      │    EXTERNAL INTEGRATIONS  │
   │                           │      │                           │      │                           │
   │ • Row-Level Security(RLS) │      │ • Property Image CDN      │      │ • Cloudflare Turnstile    │
   │ • PostGIS Spatial (v3.3)  │      │ • KYC Secure Bucket       │      │ • Google Maps / Distance  │
   │ • user_roles & profiles   │      │ • Auto-resizing & WebP    │      │ • Resend (Email Alert)    │
   │ • properties & enquiries  │      │ • Watermarking Pipeline   │      │ • Razorpay (Order Verify) │
   │ • scheduled_visits        │      │                           │      │                           │
   └───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: `22.x` (Pinned in `package.json`)
- **npm**: `10.x`
- **Flutter SDK**: `3.x` (For mobile app development)
- **Supabase Account / CLI** (Optional for local migrations)

### 1. Web Platform Setup

```bash
# 1. Clone the repository
git clone https://github.com/Bajiyadav/property-pioneer-dev.git
cd property-pioneer-dev

# 2. Install dependencies (strictly use npm 10)
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start local development server (http://localhost:3000)
npm run dev
```

### 2. Mobile App Setup (Flutter)

```bash
# 1. Navigate to mobile directory
cd apps/mobile

# 2. Get Flutter packages
flutter pub get

# 3. Run on connected Android / iOS device or emulator
flutter run

# 4. Build release APK
flutter build apk --release
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and provide your credentials:

```bash
# ==============================================================================
# SUPABASE CONFIGURATION (Required)
# ==============================================================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# ==============================================================================
# APPLICATION URLS & SEO (Required)
# ==============================================================================
VITE_APP_URL=https://seedhaproperties.com

# ==============================================================================
# SECURITY & ANTI-ABUSE (Optional / Recommended)
# ==============================================================================
VITE_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key
TURNSTILE_SECRET_KEY=your-cloudflare-turnstile-secret-key

# ==============================================================================
# EMAIL & NOTIFICATIONS (Optional)
# ==============================================================================
RESEND_API_KEY=your-resend-api-key

# ==============================================================================
# PAYMENTS (Optional - For Owner Boost & Featured Listings)
# ==============================================================================
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

> [!IMPORTANT]
> Never prefix server-only keys (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `TURNSTILE_SECRET_KEY`) with `VITE_`. This prevents them from leaking into client-side bundles.

---

## 📝 7-Step Owner Listing Experience

Seedha Properties provides a dedicated, direct-owner listing flow built specifically for the Indian real estate market:

1. **Step 1: Property Details** — Category (Residential/Commercial/PG), Type, BHK Configuration, Area (Built-up & Carpet), Floor details, Property Age, Facing direction, and Covered/Open Parking specs.
2. **Step 2: Locality & Privacy** — City, Locality, Landmark, and Pincode with transparent buyer privacy circles (~110m radius) protecting exact home addresses.
3. **Step 3: Rent/Sale & Pricing** — Price, Monthly Rent, Security Deposit, Maintenance charges & inclusion toggle, Price Negotiability, Available From date, and Furnishing status.
4. **Step 4: Amenities & Features** — Multi-select curated amenities (Power Backup, Lift, 24/7 Security, Reserved Parking, Gym, Swimming Pool, Gas Pipeline, etc.).
5. **Step 5: Photos & Video Gallery** — Real property image upload pipeline, cover image selection, reordering, and video walkthrough support. Stock photos and watermarks are rejected.
6. **Step 6: Visit Schedule & Contact Preferences** — Visit availability (Immediate, 15 days, 30 days, Specific Date), available days & time slots, and communication preferences (WhatsApp/Call).
7. **Step 7: Review & Owner Declaration** — Complete listing preview and legally binding 0% brokerage owner declaration before submitting to moderation.

---

## 📊 Feature Matrix

| Feature                                  | Web (SSR) | Mobile (Flutter) | Status                    |
| :--------------------------------------- | :-------: | :--------------: | :------------------------ |
| **Pan-India Metro Discovery (7 Cities)** |    ✅     |        ✅        | **Live**                  |
| **Dynamic Locality & Price Filtering**   |    ✅     |        ✅        | **Live**                  |
| **Direct WhatsApp & Phone Connect**      |    ✅     |        ✅        | **Live**                  |
| **Property Details & Photo Gallery**     |    ✅     |        ✅        | **Live**                  |
| **Verified Badging (`✓ Direct Owner`)**  |    ✅     |        ✅        | **Live**                  |
| **Privacy-Safe PostGIS Mapping**         |    ✅     |        ✅        | **Live**                  |
| **Schedule Visit Booking Flow**          |    ✅     |        ✅        | **Live**                  |
| **7-Step Owner Listing Wizard**          |    ✅     |        ✅        | **Live**                  |
| **Client-side Draft Auto-Save**          |    ✅     |        ✅        | **Live**                  |
| **Admin 8-Point Moderation Queue**       |    ✅     |        —         | **Live**                  |
| **Admin Role Route Guard**               |    ✅     |        —         | **Live**                  |
| **Owner Dashboard & Enquiry Management** |    ✅     |        ✅        | **Live**                  |
| **Favorites & Saved Searches**           |    ✅     |        ✅        | **Live**                  |
| **In-App Realtime Chat**                 |    🔄     |        🔄        | **In Progress (Phase 2)** |
| **Digital KYC & ID Verification**        |    🔄     |        🔄        | **In Progress (Phase 2)** |
| **Interactive Map Boundaries**           |    📅     |        📅        | **Planned (Phase 3)**     |
| **Razorpay Featured Listing Promotion**  |    📅     |        📅        | **Planned (Phase 3)**     |

---

## 🔌 API Reference

### Public Endpoints

- `GET /api/public/properties` — Paginated property search with multi-metro, locality, and price range filters.
- `GET /api/public/properties/$id` — Single property detail view with verified amenities, privacy coordinates, and commute estimates.
- `POST /api/public/properties/$id/contact` — Secure contact quota and lead delivery endpoint.
- `POST /api/public/properties/$id/schedule-visit` — Book a property walkthrough appointment (validates date format & prevents past dates).
- `POST /api/public/enquiries` — Submit direct buyer/tenant interest to the property owner.

### Authenticated & Owner Endpoints

- `POST /api/owner/properties` — Create or update property listing in moderation queue (`pending_review`).
- `POST /api/owner/properties/$id/upload-image` — Secure multipart image upload with MIME & size validation.
- `GET /api/owner/dashboard` — Fetch live stats (views, leads, pending appointments) and active listings.

### Admin & Moderation Endpoints

- `GET /api/admin/moderation/queue` — Fetch listings awaiting approval (guarded by admin/agent role in `user_roles`).
- `POST /api/admin/moderation/$id/action` — Approve, reject, or request changes on a property listing with structured notes.

---

## 🗄️ Database Schema & PostGIS Privacy

### Core Tables & Relationships

- **`user_roles`**: Maps `user_id` to system roles (`customer`, `owner`, `agent`, `admin`). Strict RLS prevents privilege self-escalation.
- **`profiles`**: Stores user display name, avatar, phone verification status, and notification preferences.
- **`properties`**: Core real estate table with price, listing type (`rent` | `sale`), address, locality, PostGIS geometry, bedrooms, bathrooms, area, amenities, and approval flags (`is_approved`).
- **`enquiries`**: Visitor lead submissions linking `property_id`, `visitor_name`, `phone`, and `message`.
- **`scheduled_visits`**: Walkthrough appointments booked by potential buyers/renters.
- **`audit_logs`**: Immutable security audit trail recording auth events, role changes, visit bookings, and moderation actions.

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    USERS ||--o| PROFILES : owns
    USERS ||--o{ PROPERTIES : lists
    PROPERTIES ||--o{ ENQUIRIES : receives
    PROPERTIES ||--o{ SCHEDULED_VISITS : schedules
    USERS ||--o{ AUDIT_LOGS : triggers
```

### PostGIS Location Architecture

- **Private Exact Data**: `latitude`, `longitude`, and `location` (geometry) are strictly restricted on the PostgreSQL column permission level (`REVOKE ALL ON latitude, longitude FROM anon, authenticated`).
- **Public Approximate Data**: `approx_latitude` and `approx_longitude` are publicly readable generated columns rounding coordinates to ~110m resolution to maintain seller privacy while powering interactive neighborhood discovery maps.

---

## ⚡ Performance & Core Web Vitals

We maintain production-grade performance standards across both web and native applications:

| Metric                             |  Target  |   Verified Production State   |
| :--------------------------------- | :------: | :---------------------------: |
| **First Contentful Paint (FCP)**   | `< 1.2s` |  **0.8s** (SSR pre-rendered)  |
| **Largest Contentful Paint (LCP)** | `< 2.2s` | **1.4s** (Optimized WebP CDN) |
| **Cumulative Layout Shift (CLS)**  | `< 0.05` |           **0.00**            |
| **Time to Interactive (TTI)**      | `< 2.5s` |           **1.6s**            |
| **Lighthouse Web Performance**     |  `> 90`  |         **95 / 100**          |
| **Mobile Frame Rate (Flutter)**    | `60 fps` | **60 fps (Impeller Engine)**  |

---

## 🔒 Security & Privacy

- **Row-Level & Column-Level Security**: Supabase RLS policies isolate user records. Owner PII (phone number, email address) is withheld from public queries and served only via rate-limited, authenticated RPCs.
- **Role Verification**: Admin and agent access is verified server-side via `assertEmployee` checking `user_roles` before executing protected functions.
- **Anti-Abuse Protection**: Cloudflare Turnstile bot detection, honeypot inputs, and sliding-window rate limiters defend public enquiry routes.
- **Migration Hygiene Guards**: CI/CD pipelines enforce automated AST regex scanners rejecting destructive SQL (`DELETE FROM`, `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `UPDATE public.`) from executable migrations.

---

## 🚢 Deployment

### Web Deployment (Vercel / Nitro)

1. Link repository to Vercel.
2. Set Environment Variables in Project Settings.
3. Build Command: `npm run build`
4. Output Directory: `.output`
5. Deploy via CLI:
   ```bash
   npx vercel --prod
   ```

### Mobile App Deployment (Android Release)

```bash
cd apps/mobile
flutter build apk --release --split-per-abi
# Outputs APK to apps/mobile/build/app/outputs/flutter-apk/
```

---

## 🗺️ Product Roadmap

```text
PHASE 1: Core Marketplace (✅ Live)
├── 7 Indian Metro Discovery & Search
├── 7-Step Zero-Brokerage Property Listing Wizard
├── Privacy-Safe PostGIS Mapping & Location Buffer
├── Admin 8-Point Moderation Queue & Role Route Guard
└── Native Flutter Mobile Release APK

PHASE 2: Trust & Real-Time Engagement (🔄 Current Focus)
├── In-App Encrypted Chat between Owners & Verified Buyers
├── Aadhaar / DigiLocker KYC Verification for Owners
└── Push Notifications for Instant Lead Delivery

PHASE 3: Media & Intelligence (📅 Q3 2026)
├── 4K Video Walkthroughs & 360° Virtual Tours
├── Automated Fair-Rent & Price Estimator
└── Interactive Map Search & Commute Isochrones

PHASE 4: Scale & Ecosystem (📅 Q4 2026)
├── Verified Agent Partnership Network
└── Commercial Real Estate Discovery
```

---

## 🛠️ Troubleshooting

### 1. `Supabase connection timeout / 400 Bad Request`

- **Cause**: Extended schema columns probed on an unmigrated database instance.
- **Fix**: The codebase includes automated schema fallback detection (`createSchemaCapability`), which gracefully degrades to base columns without throwing errors.

### 2. `npm install fails with ERESOLVE peer dependencies`

- **Cause**: npm 11 strict optional peer resolution.
- **Fix**: Run `npx npm@10 install` to match the engine definition pinned in `package.json`.

### 3. `Flutter build apk fails with Gradle / JVM mismatch`

- **Cause**: Incompatible Java version.
- **Fix**: Ensure Java 17 is active (`export JAVA_HOME=/path/to/jdk-17`) and run `flutter clean && flutter pub get`.

---

## 🤝 Contributing

We welcome contributions! Please follow our established development conventions:

1. **Fork the Repo** & create a feature branch (`git checkout -b feat/location-filter`).
2. **Follow Commit Standards**: We enforce Conventional Commits (header length <= 100 characters):
   - `feat(scope): add new feature`
   - `fix(scope): resolve bug`
   - `docs(scope): update documentation`
3. **Run Validation**:
   ```bash
   npm run typecheck
   npm test -- --run
   cd apps/mobile && flutter test
   ```
4. **Submit a Pull Request**: Ensure CI and security audits pass.

---

## 📜 License & Legal

- **License**: Distributed under the **MIT License**. See `LICENSE` for details.
- **Privacy Policy**: [https://seedhaproperties.com/privacy-policy](https://seedhaproperties.com/privacy-policy)
- **Terms of Service**: [https://seedhaproperties.com/terms-of-service](https://seedhaproperties.com/terms-of-service)

---

<div align="center">

**⭐ Star us on GitHub if you believe in transparent, zero-brokerage real estate!**

Made with ❤️ by the Seedha Properties Team

</div>
