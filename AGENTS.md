<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

# 🛡️ Seedha Properties — Mandatory Global Architectural & Safety Rules

These rules are permanent guardrails for all development and deployment tasks across the Seedha Properties platform.

---

## 1. 🛑 Product & UX Invariants (Non-Negotiable)

- **Homepage Visual Design Lock**:
  - NEVER modify, redesign, restyle, or change the approved homepage layout, colors, copy, or hero components.
- **Mandatory Location-First UX Flow**:
  - The user journey MUST ALWAYS require: `State ➔ City ➔ Confirmed Location ➔ Location-Gated Browsing/Search`.
  - The following features must remain strictly location-gated until a valid State and City are selected:
    - **Buy** listings feed
    - **Rent** listings feed
    - **Commercial** listings feed
    - **Property Search** and locality filters
  - Direct URL manipulation or manual API calls must never bypass server-side location scoping.

---

## 2. ☁️ Multi-Cloud Architecture (Google Cloud & AWS Guidelines)

- **Google Cloud Platform (GCP) — Recommended & Cost-Effective**:
  - **Compute**: Google Cloud Run (Containerized Java 21 / Spring Boot 3 or Node.js) with auto-scaling (1–10 instances) and auto-managed HTTPS.
  - **Database**: Cloud SQL for PostgreSQL 16 with PostGIS 3.4 (`asia-south1` Mumbai region).
  - **Storage**: Google Cloud Storage (GCS) with 5-minute pre-signed upload/download URLs and Uniform Bucket-Level Access.
  - **Cache**: Cloud Memorystore for Redis.
- **AWS Alternative**:
  - **Compute**: AWS ECS Fargate + ALB.
  - **Database**: AWS RDS PostgreSQL 16 + PostGIS 3.4.
  - **Storage**: Amazon S3 with Block Public Access and KMS encryption.
- **Database Network Security**:
  - PostgreSQL port 5432 MUST NEVER be exposed to `0.0.0.0/0`. Inbound traffic is strictly restricted to application container security boundaries or Cloud SQL Auth Proxy.

---

## 3. 🚨 Proactive Error Prevention & Rule Enforcement

If an action or proposal violates any of these patterns, **STOP and correct it immediately**:

1. **Never commit or log secrets**: Never print, commit, or expose passwords, JWT signing secrets, API keys, Aadhaar numbers, PAN cards, or cloud access keys in chat, source code, or Docker images.
2. **Do not delete working backends prematurely**: Keep the existing TypeScript backend and Java 21 Spring Boot backend operational in parallel until staging functional parity is proven.
3. **No Unproven Claims**: Never claim _"10M users supported"_ or _"sub-5ms latency"_ without executing repeatable, recorded load tests (`npm run benchmark:load`). Distinguish between _capacity design target_ and _measured live capacity_.
4. **Clean Decoupled Architecture**: Always ensure React Web (`src/`) and Flutter Mobile (`apps/mobile/`) communicate via standard `/api/v2/*` REST endpoints so the backend remains cloud-agnostic and language-agnostic.

---

## 4. 🔄 Git Safety & Lovable Synchronization

- Always pull using: `git pull --no-rebase origin main`.
- **Pre-Push Verification Standard**:
  - Always ensure `mvn clean test -Dspring.profiles.active=staging` passes with **0 failures / 0 errors**.
  - Always ensure `npm run typecheck` passes with **0 errors**.
  - When pushing commits after verifying the above criteria, use `git push --no-verify origin main` to prevent legacy Supabase egress quota network timeouts during local pre-push vitest hooks.
- **Repository Safe Queries**:
  - For non-unique-constrained attributes in staging data (such as user phone), use `findFirstBy<Field>OrderByCreatedAtDesc` to prevent `NonUniqueResultException`.
- Maintain a clean, linear git history without force pushes.
