# Seedha Properties — Security Review & Audit Report

## Executive Security Summary

- **Overall Security Score**: **88 / 100**
- **Audit Target**: Seedha Properties Platform Codebase
- **Status**: Passed Baseline Audit — Zero Critical SQL Injection or Unauthenticated Data Leakage Vulnerabilities Found.

---

## Detailed Security Vector Evaluation

### 1. Authentication & JWT Validation (**Score: 90/100**)

- **Strengths**: Supabase Auth handles password hashing (bcrypt/argon2) and token signing (RS256). Server RPC middleware (`auth-middleware.ts`) strictly validates claims using `supabase.auth.getClaims(token)` and checks for `sub` claims before proceeding.
- **Recommendations**: Enforce short JWT expiration windows (15 minutes) and automatic token rotation.

### 2. Authorization & Role-Based Access Control (**Score: 82/100**)

- **Strengths**: Roles stored in isolated `user_roles` table. Database function `has_role` restricts execution to `service_role`. `assertAdmin` helper enforces role presence before server functions execute privileged logic.
- **Weaknesses**: In `src/routes/_authenticated/admin.tsx`, the role check (`checkIsAdmin`) occurs inside component `useQuery` after layout mounting rather than inside route `beforeLoad`.
- **Recommendations**: Perform role validation inside `_authenticated/route.tsx`'s `beforeLoad` function.

### 3. Column-Level & Row-Level Database Security (**Score: 95/100**)

- **Strengths**: Outstanding design. Owner contact information (`owner_name`, `owner_phone`, `owner_whatsapp`, `owner_email`) is explicitly REVOKED from `anon` and `authenticated` roles via Postgres Column-Level Security. `enquiries` and `audit_logs` tables have deny-all client RLS policies (`USING (false)`), making them inaccessible except via `service_role`.

### 4. Input Validation & Injection Controls (**Score: 92/100**)

- **SQL Injection**: Parameterized SQL queries via Supabase JS client and Supabase RPCs eliminate traditional SQL injection risks.
- **Input Validation**: Shared Zod schemas (`enquiryInputSchema`) validate all client submissions with strict string trimming, UUID format checks, and length caps.

### 5. Cross-Site Scripting (XSS) & CSRF Protection (**Score: 88/100**)

- **XSS**: React 19 automatically escapes string values rendered in JSX. `PropertyStructuredData` uses `dangerouslySetInnerHTML` for JSON-LD, but only passes JSON-stringified sanitized database values.
- **CSRF**: TanStack Start natively enforces CSRF protection for `serverFn` RPC mutations to prevent cross-site request forgery.

### 6. Anti-Abuse & Denial of Service (DoS) Controls (**Score: 92/100**)

- **Rate Limiting**: Postgres-backed sliding-window engine enforces 5 rules per IP, per property, and per phone number.
- **Honeypot**: Hidden `company` field absorbs automated bot submissions silently.
- **Submit Timing**: Rejects form submissions faster than 2.5 seconds (`MIN_SUBMIT_MS = 2500`).
- **CAPTCHA**: Optional Cloudflare Turnstile CAPTCHA verification.

---

## Security Vulnerabilities & Risk Rating Matrix

| Risk ID   | Vulnerability Description                                                       | Severity | Remediation                                                |
| --------- | ------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------- |
| `SEC-001` | Admin role check executed in component `useQuery` instead of route `beforeLoad` | Medium   | Move role check to `_authenticated/route.tsx` `beforeLoad` |
| `SEC-002` | `nestwise:favorites` localStorage key discrepancy                               | Low      | Standardize key name to `urf:favorites`                    |
| `SEC-003` | hardcoded canonical URLs referencing Lovable cloud domain                       | Low      | Use dynamic domain configuration via environment variable  |

---

## Actionable Security Recommendations

1. **Move Admin Role Check to Route Guard**: Update `_authenticated/route.tsx` to query `user_roles` during SSR pre-load.
2. **Implement Security Headers**: Configure HTTP response headers (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`) in Nitro / Vite server configuration.
3. **Set Up Automated Audit Alerts**: Trigger Slack/Email alerts when `audit_logs` records multiple `enquiry.rate_limited` or `enquiry.rejected` events from a single IP block.
