# Urban Rental Flats (URF) — Enterprise Risk Register

> **Document Type:** Comprehensive Technical & Operational Risk Assessment  
> **Repository:** `property-pioneer-dev`  
> **Target Audience:** CTO, Lead Architects, Security Engineers & DevOps Leads

---

## Executive Overview

This Risk Register identifies, analyzes, and establishes mitigation strategies for all technical, security, operational, financial, and product risks associated with Urban Rental Flats (URF).

Risk Severity is computed using the standard matrix: **Severity = Impact x Probability**.

---

## 1. Technical & Architectural Risks

| Risk ID   | Risk Description                                                                                                                 | Category  | Impact (1-5) | Prob (1-5) | Severity Score    | Mitigation Strategy                                                 | Contingency Plan                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------ | ---------- | ----------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **TR-01** | **Browser Memory Exhaustion on Large Datasets**: Client-side filtering in `properties.index.tsx` loads full dataset into memory. | Technical | 4 (High)     | 4 (High)   | **16 (Critical)** | Implement server-side pagination (`.range()`) in Supabase fetchers. | Fallback to hard limit (max 50 rows) in initial query response.  |
| **TR-02** | **Server OOM Crash in Admin Overview**: `loadOverview()` loads full table rows into Node.js memory.                              | Technical | 4 (High)     | 3 (Med)    | **12 (High)**     | Replace JS array filtering with Postgres SQL `COUNT(*)` functions.  | Restart Nitro server process automatically on high memory alert. |
| **TR-03** | **Database Connection Starvation**: High concurrency exhausts available Postgres connection pool.                                | Technical | 5 (Critical) | 2 (Low)    | **10 (Medium)**   | Enable PgBouncer connection pooling in Transaction Mode.            | Increase connection pool limits dynamically in Supabase config.  |
| **TR-04** | **Server Function RPC Timeout**: Slow DB queries block server rendering or client RPC calls.                                     | Technical | 3 (Med)      | 3 (Med)    | **9 (Medium)**    | Enforce 5s timeout on all server function RPC handlers.             | Return graceful cached data fallback when RPC times out.         |

---

## 2. Security & Compliance Risks

| Risk ID   | Risk Description                                                                               | Category | Impact (1-5) | Prob (1-5) | Severity Score    | Mitigation Strategy                                                              | Contingency Plan                                                        |
| --------- | ---------------------------------------------------------------------------------------------- | -------- | ------------ | ---------- | ----------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **SR-01** | **Admin Dashboard Authorization Bypass**: Admin check executed post-mount allows UI render.    | Security | 5 (Critical) | 3 (Med)    | **15 (Critical)** | Move `checkIsAdmin` verification to route `beforeLoad` guard.                    | Revoke service role key permissions if unauthenticated access detected. |
| **SR-02** | **Automated Bot Lead Form Spam**: Bot script bypasses form rate limits.                        | Security | 3 (Med)      | 4 (High)   | **12 (High)**     | Enforce honeypot input, submit timer (`MIN_SUBMIT_MS`), and Turnstile CAPTCHA.   | Block offending IP ranges at Cloudflare WAF edge layer.                 |
| **SR-03** | **Owner Contact Detail Data Leak**: Public role bypasses Column-Level Security.                | Security | 5 (Critical) | 1 (Low)    | **5 (Low)**       | Postgres CLS explicitly `REVOKE`s contact columns from `anon` & `authenticated`. | Enable automated daily RLS/CLS security audit scripts.                  |
| **SR-04** | **Cross-Site Scripting (XSS)**: Malicious HTML injected into property titles or lead messages. | Security | 4 (High)     | 2 (Low)    | **8 (Medium)**    | Enforce React JSX auto-escaping, Zod input sanitization, and CSP headers.        | Sanitize DOM output using DOMPurify before rendering raw HTML.          |

---

## 3. Operational & Infrastructure Risks

| Risk ID   | Risk Description                                                                          | Category    | Impact (1-5) | Prob (1-5) | Severity Score  | Mitigation Strategy                                                      | Contingency Plan                                                |
| --------- | ----------------------------------------------------------------------------------------- | ----------- | ------------ | ---------- | --------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| **OR-01** | **Primary Database Region Outage**: Hosted Supabase primary instance experiences outage.  | Operational | 5 (Critical) | 2 (Low)    | **10 (Medium)** | Enable Supabase Point-in-Time Recovery (PITR) and multi-region replicas. | Trigger emergency DNS failover to read-replica database.        |
| **OR-02** | **Deployment Build Failure**: Misconfigured env variables break production build.         | Operational | 4 (High)     | 2 (Low)    | **8 (Medium)**  | Enforce automated CI build check and type check (`tsc --noEmit`) on PRs. | Roll back to previous container image deployment tag instantly. |
| **OR-03** | **Unoptimized Image Bandwidth Cost Spike**: High resolution images exhaust CDN bandwidth. | Operational | 3 (Med)      | 3 (Med)    | **9 (Medium)**  | Append WebP width/quality parameters (`?w=600&q=80`) on image URLs.      | Set Cloudflare CDN rate limits and cache rules.                 |

---

## 4. Product & Financial Risks

| Risk ID   | Risk Description                                                                                  | Category  | Impact (1-5) | Prob (1-5) | Severity Score | Mitigation Strategy                                                          | Contingency Plan                                                     |
| --------- | ------------------------------------------------------------------------------------------------- | --------- | ------------ | ---------- | -------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **FR-01** | **Payment Webhook Signature Forgery**: Fake webhook events credit listing boosts without payment. | Financial | 4 (High)     | 2 (Low)    | **8 (Medium)** | Validate HMAC SHA256 signatures on all incoming Razorpay/Stripe webhooks.    | Audit order state against gateway REST API before fulfilling boosts. |
| **PR-01** | **Low Property Supply Acquisition**: Lack of direct owner submissions hampers platform growth.    | Product   | 4 (High)     | 3 (Med)    | **12 (High)**  | Launch self-service owner portal with free initial listing upload incentive. | Partner with local real estate agencies for bulk listing ingestion.  |

---

## 5. Risk Monitoring & Review Schedule

1. **Weekly Security & Performance Review**: Automated audit log inspection checking rate-limit breach frequency.
2. **Monthly Dependency Scan**: Automated Dependabot dependency audit identifying outdated npm packages.
3. **Quarterly Disaster Recovery Simulation**: Simulated primary DB outage executing PITR restoration verification.
