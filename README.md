# Seedha Properties

[![Framework](https://img.shields.io/badge/Framework-TanStack_Start-FF4154?style=flat-square&logo=react)](https://tanstack.com/start)
[![Flutter](https://img.shields.io/badge/Mobile-Flutter_3.x-02569B?style=flat-square&logo=flutter)](https://flutter.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Database](https://img.shields.io/badge/Database-Supabase_Postgres-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

**Find Direct. Live Better.** — A direct-owner property discovery marketplace across major Indian metropolitan hubs (**Hyderabad, Bengaluru, Mumbai, Delhi-NCR, Chennai, Pune, Kolkata**). Renters and buyers connect directly with verified owners; the platform takes zero brokerage.

**Production Web:** <https://seedhaproperties.com>  
**Mobile Native App:** Flutter release bundle located at `apps/mobile/build/app/outputs/flutter-apk/app-release.apk`

---

## Status at a Glance

| Area                              | Status              | Notes                                                                                                                                                                           |
| :-------------------------------- | :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Visitor Discovery & Search**    | ✅ **Working**      | Pan-India discovery without forced login. Dynamic filters by city, locality, price, BHK, and listing type (Rent / Buy / Commercial).                                            |
| **Property Details & Amenities**  | ✅ **Working**      | High-resolution photo galleries, verified amenities, commute estimators, EMI calculator, and verification badges (`✓ Direct Owner`, `✓ Owner Verified`, `✓ Property Verified`). |
| **Authentication & Roles**        | ✅ **Working**      | 4-tier role architecture (`customer`, `owner`, `agent`, `admin`) with server-side role resolution and automatic landing routing.                                                |
| **Admin Route Guard**             | ✅ **Working**      | Enforced at route level in `_authenticated/route.tsx` before rendering protected content.                                                                                       |
| **List Property (6-Step Wizard)** | ✅ **Working**      | Location chips, property details, pricing, photo upload validation, owner contact, and server-side submission into moderation queue (`pending_review`).                         |
| **Scheduled Visits**              | ✅ **Working**      | Integrated with `/api/public/properties/$id/schedule-visit`, audit-logged, and routed to the owner calendar.                                                                    |
| **Contact Owner & Enquiries**     | ✅ **Working**      | Server-side owner PII masking (`owner_phone`/`owner_email` protected) with direct lead delivery to the Owner Dashboard.                                                         |
| **Owner Dashboard**               | ✅ **Working**      | Real-time management of Active listings, Pending verifications, Drafts, Enquiries, and Scheduled Visits.                                                                        |
| **Mobile Flutter Client**         | ✅ **Working**      | Native cross-platform app with Impeller graphics engine, multi-metro selector, search, and direct contact.                                                                      |
| **Unit & Integration Tests**      | ✅ **26/26 Passed** | **173 passed tests** across web modules, plus **10/10 Flutter test suites** passing.                                                                                            |
| **TypeScript Strictness**         | ✅ **0 Errors**     | Strict typecheck (`tsc --noEmit`) passes cleanly.                                                                                                                               |

---

## Architecture & Tech Stack

### Web Platform

- **Meta-Framework:** TanStack Start (SSR) on Nitro server runtime.
- **Routing:** TanStack Router with type-safe file-based routing and beforeLoad route guards.
- **State & Data Fetching:** TanStack Query + Supabase client with RPC server functions (`createServerFn`).
- **UI & Styling:** React 19, Tailwind CSS v4, Radix UI primitives, Lucide icons, Sonner toasts, and Framer Motion micro-interactions.

### Mobile Platform (`apps/mobile`)

- **Framework:** Flutter 3.x with Dart.
- **Graphics Backend:** Impeller OpenGLES / Metal rendering.
- **State Management:** Provider / Service architecture mirroring web API contracts.

### Backend & Security

- **Database:** Supabase PostgreSQL with strict Row-Level Security (RLS) policies.
- **Security & PII Protection:** Owner phone and email are never exposed to anonymous feeds; access is guarded behind authenticated RPCs and rate-limited endpoints.
- **Anti-Abuse:** Turnstile bot verification, honeypots, and audit logging.

---

## Quickstart

### Prerequisites

- Node.js **22.x** and npm **10.x** (pinned in `engines`).
- Flutter SDK (for mobile development in `apps/mobile/`).

### Web Development

```bash
# Clone the repository
git clone https://github.com/Bajiyadav/property-pioneer-dev.git
cd property-pioneer-dev

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run local development server (http://localhost:3000)
npm run dev
```

### Verification & Testing

```bash
# Run strict TypeScript typechecking
npm run typecheck

# Run Vitest test suite (26 test files, 173 tests)
npm test -- --run

# Build production SSR bundle
npm run build

# Run Flutter mobile tests
cd apps/mobile && flutter test
```

---

## Environment Configuration

| Variable                                           | Required | Purpose                                                    |
| :------------------------------------------------- | :------- | :--------------------------------------------------------- |
| `VITE_SUPABASE_URL`                                | Yes      | Supabase client URL                                        |
| `VITE_SUPABASE_PUBLISHABLE_KEY`                    | Yes      | Supabase anonymous public key                              |
| `SUPABASE_URL`                                     | Yes      | Server-side Supabase client URL                            |
| `SUPABASE_SERVICE_ROLE_KEY`                        | Yes      | Server-side admin moderation, lead routing, and PII access |
| `VITE_APP_URL`                                     | Yes      | Canonical domain URL for OpenGraph and sitemaps            |
| `RESEND_API_KEY`                                   | Optional | Transactional security notifications                       |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`          | Optional | Featured listing boost payments                            |
| `VITE_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Optional | Bot verification                                           |

---

## Repository Structure

```text
src/
├── app/                  # Layout shells, global header menus, navigation
├── components/ui/        # Radix / shadcn reusable primitives
├── config/               # App metadata, role definitions, metro constants
├── hooks/                # Custom React hooks
├── integrations/         # Supabase client configurations & generated types
├── modules/              # Domain-driven feature modules
│   ├── admin/            # Moderation dashboard, user management, audit review
│   ├── authentication/   # Auth lifecycle, role resolution, route guards
│   ├── enquiry/          # Contact owner & lead delivery
│   ├── interactions/     # Scheduled visits, favorites, reviews
│   ├── owner/            # 6-step listing wizard, owner dashboard, analytics
│   └── property/         # Discovery, search, filters, detail pages, maps
├── routes/               # TanStack file-based routes and /api endpoints
└── shared/               # Cross-cutting stores, brand mark, utility functions

apps/
└── mobile/               # Native Flutter application for iOS & Android
    ├── lib/              # Flutter screens, widgets, models, services
    └── test/             # Flutter unit & widget tests (10 test suites)

tests/
├── unit/                 # 26 Vitest test suites (173 unit/integration tests)
└── e2e/                  # Playwright browser end-to-end suites
```

---

## Conventions & Rules

- **Conventional Commits:** Enforced via `commitlint` (header length <= 100 characters).
- **Git History Integrity:** Avoid squashing or rewriting published git history (protects Lovable synchronization). Always pull with `git pull --no-rebase origin main` before pushing.
- **Data Honesty:** Never expose mock or fabricated analytics as real metrics. Real data is queried from live Supabase tables or clearly labeled.

---

## License

MIT License.
