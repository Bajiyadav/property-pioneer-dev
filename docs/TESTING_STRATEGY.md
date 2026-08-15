# Urban Rental Flats (URF) — Comprehensive Testing Strategy

> **Document Type:** Quality Assurance & Test Engineering Framework  
> **Repository:** `property-pioneer-dev`  
> **Target Tooling:** Vitest, Playwright, Supabase Local CLI, k6, Lighthouse

---

## Executive Summary

This document details the multi-layered testing strategy for Urban Rental Flats (URF). The goal is to achieve **85%+ code coverage** on core business logic, **100% coverage** on security/authorization primitives, and ensure **zero-regression deployments** via automated CI/CD pipelines.

```
       +---------------------------------------+
       |        User Acceptance Testing        |
       +---------------------------------------+
       |         End-to-End (Playwright)       |
       +---------------------------------------+
       |     Performance & Load (k6/Lighthouse)|
       +---------------------------------------+
       |      Security & Pen-Testing Suite     |
       +---------------------------------------+
       |    API & Integration (Supabase Local) |
       +---------------------------------------+
       |        Unit Tests (Vitest / RTL)      |
       +---------------------------------------+
```

---

## 1. Unit Testing Plan

- **Objective**: Verify isolated business logic, data transformers, price formatters, and Zod validation schemas.
- **Framework**: Vitest (`@vitest/runner`) + React Testing Library (`@testing-library/react`).
- **Scope**:
  - `src/lib/properties.ts`: Price formatting (`formatPrice`), badge status generators, property search filter logic.
  - `src/lib/enquiries.ts`: Zod schema validation (`enquiryInputSchema`) verifying phone number formats, email validation, and required field rules.
  - `src/lib/useFavorites.ts`: Custom hook state manipulation, localStorage get/set operations, wishlist toggling.
  - `src/config/features.ts`: Feature switchboard flag resolution and runtime environment overrides.
- **Target Coverage**: >= 85% Statements, 90% Functions.

### Execution Command:

```bash
npm run test:unit
```

---

## 2. Integration Testing Plan

- **Objective**: Validate interactions between TanStack Start server functions, Supabase DB queries, and authorization middleware.
- **Framework**: Vitest with Supabase CLI local emulator (`supabase start`).
- **Scope**:
  - `src/integrations/supabase/auth-middleware.ts`: Verifies `requireSupabaseAuth` correctly extracts JWT claims and attaches authenticated context.
  - `src/lib/security.server.ts`: Validates rate-limiting sliding windows against local Postgres instance, verifying IP burst and daily phone limits block requests accurately.
  - `src/lib/admin.server.ts`: Verifies `loadOverview`, `updatePropertyStatus`, and `loadAuditLogs` execute under service role authorization.
- **Environment**: Isolated Supabase Postgres Docker container populated with migration scripts (`supabase/migrations/`).

### Execution Command:

```bash
npm run test:integration
```

---

## 3. API Testing Plan

- **Objective**: Ensure public REST endpoints and server function RPCs adhere strictly to API specifications, status codes, and security rules.
- **Framework**: Supertest / HTTP Client scripts against Nitro test server instance.
- **Scope**:
  - `POST /api/public/enquiries`:
    - Valid submission (200 OK + database insertion).
    - Honeypot trigger (200 OK silent absorb + no DB insertion).
    - Quick submit timer < 2.5s (400 Bad Request rejection).
    - Invalid phone/email payload (400 Bad Request with Zod issue details).
    - Rate limit threshold exceeded (429 Too Many Requests).
  - `GET /sitemap.xml`: Validates XML content-type and presence of approved listing URLs.
  - Server RPC Endpoints (`checkIsAdmin`, `getAdminProperties`): Verification of 401 Unauthorized responses when unauthenticated.

### Execution Command:

```bash
npm run test:api
```

---

## 4. End-to-End (E2E) Testing Plan

- **Objective**: Simulate full user journeys in real browser engines (Chromium, Firefox, WebKit) to verify UI behavior, navigation, and state persistence.
- **Framework**: Playwright (`@playwright/test`).
- **Key User Journeys**:
  1. **Public Property Discovery Flow**:
     - Visitor lands on homepage (`/`).
     - Uses search bar to filter by city "Bengaluru".
     - Navigates to property detail page (`/properties/prop-1`).
     - Toggles listing favorite button (verifies local storage update).
     - Submits lead enquiry form; verifies success toast notification.
  2. **Admin Authentication & Management Flow**:
     - Admin navigates to `/auth` and logs in with admin credentials.
     - Redirected to `/admin` dashboard.
     - Verifies metric counters render accurately.
     - Toggles property approval status from `Approved` to `Pending`.
     - Verifies change reflects immediately in listing table and audit log table.
  3. **Unauthorized Access Protection Flow**:
     - Unauthenticated visitor attempts to navigate directly to `/_authenticated/admin`.
     - System intercepts navigation and redirects user to `/auth`.

### Execution Command:

```bash
npx playwright test
```

---

## 5. Security Testing Plan

- **Objective**: Identify OWASP Top 10 vulnerabilities, authorization bypass risks, and data leakage channels.
- **Framework**: OWASP ZAP (Zed Attack Proxy) + Custom Security Suite.
- **Focus Areas**:
  - **Column-Level Security (CLS) Audit**: Attempting to query `owner_phone`, `owner_email`, `owner_whatsapp` using publishable key (`anon` role); verifying Postgres denies column access.
  - **Row-Level Security (RLS) Audit**: Attempting direct SQL `INSERT` or `SELECT` on `enquiries` table using client Supabase keys; verifying 0 rows returned.
  - **CSRF & XSS Protection Audit**: Injecting script payloads (`<script>alert(1)</script>`) into lead message form fields; verifying strict string sanitization and React JSX escaping.
  - **Rate Limit Resilience**: Bombarding lead submission endpoint with 100 concurrent requests from single IP; verifying system returns HTTP 429 after threshold.

### Execution Command:

```bash
npm run test:security
```

---

## 6. Performance Testing Plan

- **Objective**: Measure client-side rendering speed, network payload efficiency, and Core Web Vitals.
- **Framework**: Google Lighthouse CI (`@lhci/cli`).
- **Key Metrics & SLAs**:
  - **Largest Contentful Paint (LCP)**: <= 1.2s
  - **Interaction to Next Paint (INP)**: <= 50ms
  - **Cumulative Layout Shift (CLS)**: <= 0.05
  - **Time to First Byte (TTFB)**: <= 150ms
  - **First Contentful Paint (FCP)**: <= 0.8s

### Execution Command:

```bash
npx lhci autorun
```

---

## 7. Load & Stress Testing Plan

- **Objective**: Evaluate platform stability, memory retention, and response times under high concurrent user traffic.
- **Framework**: k6 by Grafana.
- **Load Profiles**:
  - **Baseline Load Test**: 100 Virtual Users (VUs) browsing properties for 10 minutes. SLA: 99% of requests respond in <200ms.
  - **Spike Test**: Ramp from 10 VUs to 1,000 VUs in 30 seconds to simulate a viral social marketing push. SLA: Zero server crashes, error rate < 1%.
  - **Endurance Stress Test**: 300 VUs executing continuous lead submissions for 2 hours to detect Node memory leaks or DB connection exhaustion.

### k6 Test Script Example (`tests/load/enquiry_spike.js`):

```js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 100 },
    { duration: "1m", target: 500 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<300"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const res = http.get("https://staging.urbanrentalflats.com/properties");
  check(res, { "status is 200": (r) => r.status === 200 });
  sleep(1);
}
```

### Execution Command:

```bash
k6 run tests/load/enquiry_spike.js
```

---

## 8. User Acceptance Testing (UAT) Plan

- **Objective**: Validate platform usability, visual accuracy, and business workflows with actual real estate stakeholders (Property Owners, Tenants, Agency Admins).
- **Execution Checklist**:
  - [ ] **Tenant Persona**: Complete rental search using price slider, filter by 2 BHK, view details, save listing to favorites, submit enquiry.
  - [ ] **Owner Persona**: Register account, fill multi-step property upload wizard, attach 5 photos, view pending listing status in dashboard.
  - [ ] **Admin Persona**: Log in to admin console, review pending owner listing, inspect lead submission audit logs, approve listing for public display.
  - [ ] **Device Compatibility**: Verify pixel-perfect rendering across iPhone 15 Pro, Samsung Galaxy S24, iPad Air, and 4K Desktop viewports.
