# Monitoring & Observability

## Current state (honest)

| Layer                | Status                                                           |
| -------------------- | ---------------------------------------------------------------- |
| Deploy health checks | ✅ `cd.yml` — HTTP + Playwright smoke on every production deploy |
| Synthetic monitoring | ✅ daily Lighthouse; E2E on every PR                             |
| Audit logging        | ✅ `audit_logs` (enquiries, moderation, auth outcomes)           |
| Error boundaries     | ✅ `CustomErrorBoundary` + server error page                     |
| Supabase logs        | ✅ Dashboard → Logs                                              |
| Vercel Analytics     | ⚠️ available, not enabled                                        |
| Sentry               | ❌ not integrated                                                |
| OpenTelemetry        | ❌ not integrated                                                |
| GA4                  | ❌ not integrated                                                |

## Why Sentry/OTel/GA4 are not wired up

Each adds a runtime dependency and a client-side script to every page, and the
brief for this change was explicitly _infrastructure only, do not change
functionality_. They are a deliberate follow-up, not an oversight. Recommended
order: **Sentry** (highest value — real user errors) → **Vercel Analytics**
(one toggle, Core Web Vitals from real traffic) → GA4 → OpenTelemetry.

Sentry, when added, should capture release version and commit SHA from the CD
workflow so errors attribute to a deploy.

## What to alert on

- Health check failure in `cd.yml` (already fails the deploy and rolls back)
- Supabase: connection saturation, RLS denials spiking, auth failure rate
- Lighthouse regression below the 0.90 budget
- `npm audit` critical on the weekly scan

## Logged today

Auth outcomes · enquiry submission and rate-limiting · admin moderation ·
storage uploads · server exceptions. Payments are not logged because payments
are not implemented.
