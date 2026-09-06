## 📌 Summary of Changes

<!-- Provide a clear, concise overview of what this PR introduces or fixes. -->

- **Type of Change**:
  - [ ] 🚀 New Feature (`feat`)
  - [ ] 🐛 Bug Fix (`fix`)
  - [ ] 🛡️ Security / Compliance (`security`)
  - [ ] ⚡ Performance Optimization (`perf`)
  - [ ] 📱 Mobile App (`mobile`)
  - [ ] ☁️ Infrastructure / DevOps (`infra`)
  - [ ] 🧪 Tests / CI (`test`)
  - [ ] 📝 Documentation (`docs`)
- **Impacted Subsystems**:
  - [ ] Web Frontend (`src/`)
  - [ ] Flutter Mobile (`apps/mobile/`)
  - [ ] Java 21 / Spring Boot Backend (`backend-java/`)
  - [ ] Node.js / TanStack Server
  - [ ] PostgreSQL / PostGIS Migrations (`supabase/migrations/`)
  - [ ] Terraform GCP Infrastructure (`infra/terraform/`)
- **Related Issue(s)**: Closes #<!-- issue number -->

---

## 🎯 Motivation & Rationale

<!-- Why is this change necessary? What customer problem or business requirement does it solve? -->

---

## 🛡️ Mandatory Architectural Guardrails (AGENTS.md)

_All PR authors must verify compliance with project invariants before submitting:_

- [ ] **Homepage Design Lock**: Verified that the approved homepage hero, layout, copy, and styling are completely untouched.
- [ ] **Location-First Journey**: Verified that Buy, Rent, Commercial, and Property Search feeds remain strictly gated behind `State ➔ City ➔ Locality`.
- [ ] **Zero Secrets Committed**: Verified no passwords, JWT signing keys, Aadhaar/PAN data, or cloud API credentials are in code or logs.
- [ ] **PII & Contact Protection**: Verified that exact property GPS coordinates and owner contact numbers are never exposed to anonymous users.
- [ ] **Database Migration Safety**: Schema changes are additive and backwards-compatible with zero downtime.

---

## 🧪 Verification & Test Evidence

_Every commit must pass all local verification criteria:_

### Web Frontend

- [ ] `npm run typecheck` (0 errors)
- [ ] `npm run lint` (0 warnings/errors)
- [ ] `npm run test` (All 600+ Vitest tests passing)
- [ ] `npm run build` (Clean production SSR bundle)

### Mobile Flutter App

- [ ] `flutter analyze --no-fatal-infos` (0 issues)
- [ ] `flutter test` (All 171 unit & widget tests passing)

### Java 21 Enterprise Backend

- [ ] `mvn test -Dspring.profiles.active=staging` (0 failures / 0 errors)

---

## 📸 Visual Diffs & Media (If applicable)

|              Before              |              After               |
| :------------------------------: | :------------------------------: |
| _[Paste screenshot / recording]_ | _[Paste screenshot / recording]_ |

---

## 🚀 Post-Merge & Deployment Checklist

- [ ] Does this PR require new secrets in GCP Secret Manager or GitHub Actions?
- [ ] Does this PR require running DB migrations on Cloud SQL?
- [ ] Can this PR be safely rolled back if necessary?
