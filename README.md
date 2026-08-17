# Seedha Properties

[![Framework](https://img.shields.io/badge/Framework-TanStack_Start-FF4154?style=flat-square&logo=react)](https://tanstack.com/start)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Database](https://img.shields.io/badge/Database-Supabase_Postgres-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

A direct-owner property marketplace for Hyderabad. Renters and buyers contact owners
themselves over WhatsApp; the platform takes no commission on rent and no brokerage.

**Production:** <https://seedhaproperties.com> (`www` redirects to the apex)

---

## Status at a glance

| Area                                                      | State                                         |
| --------------------------------------------------------- | --------------------------------------------- |
| Public site — search, listings, detail pages, legal pages | Working                                       |
| Authentication — 4 roles, server-verified sessions        | Working                                       |
| Admin moderation — approve / feature / reject listings    | Working                                       |
| Owner listing via the onboarding modal                    | Working                                       |
| Owner listing via the 6-step wizard                       | **Does not persist — see Known gaps**         |
| Owner contact (WhatsApp enquiries)                        | Works for new listings only — see Known gaps  |
| Dashboards (customer / owner / agent / admin)             | Partly fixture data — see Known gaps          |
| Paid assistance plans                                     | Built, **disabled** until Razorpay keys exist |
| CI + Security workflows                                   | Green                                         |
| CD (migrations + deploy)                                  | **Blocked on `SUPABASE_DB_URL`**              |

Read [Known gaps](#known-gaps) before assuming a feature is finished. Several
surfaces look complete and are not.

---

## Tech stack

- **Meta-framework** — TanStack Start (SSR) on Nitro, TanStack Router (file-based,
  type-safe), TanStack Query for caching and RPC via `createServerFn`.
- **UI** — React 19, TypeScript, Tailwind CSS v4, Radix primitives, Lucide icons,
  Sonner toasts, Framer Motion.
- **Data** — Supabase Postgres with Row-Level _and_ Column-Level Security. Owner PII
  (`owner_phone`, `owner_name`, `owner_email`) is withheld from the `anon` and
  `authenticated` grants and reachable only through the server-side contact route.
- **Auth** — Supabase Auth (ES256 JWTs). Roles come from the `user_roles` table and
  are resolved server-side; a client can never assert its own role.
- **Anti-abuse** — Cloudflare Turnstile, Postgres sliding-window rate limits,
  honeypot fields and submission-timing checks on enquiry forms.
- **Payments** — Razorpay (orders created server-side, HMAC signature verification).

The build configuration lives in this repo. It previously came from
`@lovable.dev/vite-tanstack-config`; `vite.config.ts` now wires the plugins directly.

---

## Quickstart

### Prerequisites

Node **22.x** and npm **10.x**. Both are pinned in `engines`, and the npm pin is
deliberate: npm 10 and 11 disagree about optional peer dependencies and produce
lockfiles the other rejects, which broke CI three times. Use `npx npm@10 install` if
your default npm is newer.

```bash
git clone https://github.com/Bajiyadav/property-pioneer-dev.git
cd property-pioneer-dev
npm install
cp .env.example .env      # then fill in the values below
npm run dev               # http://localhost:3000
```

### Environment

`.env.example` documents every variable, what breaks without it, and where to find
it. The essentials:

| Variable                                           | Required | Purpose                                            |
| -------------------------------------------------- | -------- | -------------------------------------------------- |
| `VITE_SUPABASE_URL`                                | Yes      | Browser Supabase client                            |
| `VITE_SUPABASE_PUBLISHABLE_KEY`                    | Yes      | Browser Supabase client                            |
| `SUPABASE_URL`                                     | Yes      | Server Supabase client                             |
| `SUPABASE_SERVICE_ROLE_KEY`                        | Yes      | Admin portal, enquiries, owner PII reads           |
| `VITE_APP_URL`                                     | Yes      | Canonical URLs, Open Graph, JSON-LD, `sitemap.xml` |
| `SUPABASE_DB_URL`                                  | For CD   | Applying migrations. Currently unset — see below   |
| `RESEND_API_KEY`                                   | Optional | Sign-in security emails                            |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`          | Optional | Enables plan purchases                             |
| `VITE_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Optional | CAPTCHA on enquiries                               |

Unset optional variables degrade honestly rather than silently: email delivery
reports `unconfigured` instead of claiming a send, and the plans UI disables its
buttons instead of opening a checkout that cannot settle.

`SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` are server-only. Never give
either a `VITE_` prefix — that would ship them to the browser.

---

## Scripts

```bash
npm run dev            # dev server
npm run build          # production build
npm run typecheck      # tsc --noEmit
npm run lint           # eslint --fix
npm test               # vitest run  (14 files, 107 tests)
npm run test:coverage  # vitest with coverage
npm run test:e2e       # playwright  (see the note below)
```

### Testing

Unit tests run locally with no services. **E2E tests run against a deployed URL, not
localhost** — the app is SSR plus Supabase, so testing a real deployment is what
proves a release. Point them wherever you need:

```bash
E2E_BASE_URL=https://seedhaproperties.com npx playwright test
npx playwright test responsive --project=mobile        # one suite, one device
```

The auth-lifecycle suites need `QA_*_EMAIL` / `QA_*_PASSWORD` credentials and skip
with an explicit message when absent, rather than passing vacuously.

The `responsive` suite is worth understanding before changing card layouts. It
asserts overflow at **three** levels, because each one hides the others:

| Level          | Catches                                 | Blind to                                |
| -------------- | --------------------------------------- | --------------------------------------- |
| `document`     | page-wide horizontal scroll             | anything a container absorbs or clips   |
| stat **row**   | a grid track expanding past its share   | truncation, and clipping by an ancestor |
| stat **value** | `truncate` silently ellipsising a price | track expansion                         |
| **card**       | content clipped by `overflow-hidden`    | truncation inside a fitting card        |

Three separate production bugs got through by being measured at the wrong level.

---

## Repository layout

```text
src/
├── app/            # layout shells, header menus
├── components/ui/  # shadcn/Radix primitives
├── config/         # app metadata, roles, plans, feature flags, platform constants
├── hooks/          # shared React hooks
├── integrations/   # Supabase clients, auth middleware, generated types
├── modules/        # feature modules, each owning its components + services
│   ├── admin/          agent/        analytics/   audit/
│   ├── authentication/ billing/      customer/    dashboard/
│   ├── enquiry/        interactions/ legal/       marketing/
│   ├── owner/          property/
├── routes/         # file-based routes, incl. /api/* server routes
└── shared/         # cross-module components, services, stores

supabase/migrations/  # 8 SQL migrations (several unapplied — see Known gaps)
tests/unit/           # 14 vitest files
tests/e2e/            # 8 playwright suites
docs/                 # 34 deep-dive documents
.github/workflows/    # ci, cd, security, release, preview, performance, deps
```

---

## Deployment

Hosted on Vercel, built on Node 22. Pushing to `main` triggers CI, Security and
Release. **CD currently fails**, deliberately: it refuses to report success for
migrations it did not apply, and `SUPABASE_DB_URL` is not configured. Until that is
set, production deploys are done manually:

```bash
npx vercel --prod
```

---

## Known gaps

Documented rather than hidden, because each of these looks finished from the UI.

**1. `SUPABASE_DB_URL` is unset.** This blocks the most important item on the list: a
written-but-unapplied migration that stops a self-registering user from granting
themselves any role, including `admin`. It also blocks CD and five other migrations.

```bash
npx vercel env add SUPABASE_DB_URL production
```

**2. The 6-step listing wizard does not save anything.** `/list-property/wizard`
writes to a client-side store and shows "submitted successfully… reviewed within 2-4
hours". No record is created, no moderator can see it, the listing never appears. The
`OwnerOnboardingModal` path _does_ persist correctly. Wiring the wizard to the same
server function is in progress and depends on the unapplied migrations.

**3. Existing listings have no owner phone.** `owner_phone` was never written by any
code path, so the contact endpoint fell back to a hard-coded number belonging to
nobody. That fallback is removed and the field is now required on new listings, but
rows created earlier need backfilling before their "Get Owner Details" works.

**4. Dashboards render fixture data as if it were real.** The admin user list and
audit log, the owner activity feed, the customer bookings and chart, and the agent
leads, clients and **commission figures** are all hardcoded arrays. The agent
commissions matter most — they show money that does not exist.

**5. Paid plans are built but disabled.** Cards, GST maths and Razorpay order
creation are done and tested; the buttons stay disabled until `RAZORPAY_KEY_ID` and
`RAZORPAY_KEY_SECRET` are set. Plan entitlement storage needs an `owner_plans` table,
so it waits on gap 1. Note that the plans promise a named relationship manager —
please do not enable payments before that person exists.

**6. Social links are absent.** The footer and JSON-LD previously pointed at the
previous brand's handles. They were removed rather than guessed at; add real ones
when the accounts exist.

---

## Conventions

- Conventional Commits, enforced by commitlint. `semantic-release` cuts versions.
- Husky runs lint-staged on commit, and `typecheck` + `test` before push.
- Commit messages here explain **why**, not just what — several record a bug's root
  cause and the reason a fix is shaped the way it is. Please keep that up; it is how
  the non-obvious constraints in this codebase stay discoverable.
- Never claim in the UI something the platform does not do. Fabricated testimonials,
  an unearned "verified ownership" guarantee and invented integrations have all been
  removed once already, and tests now assert some of them stay gone.

---

## License

MIT.
