# 🛡️ Seedha Properties — Release, Rollback, Backup & Disaster Recovery Runbook

---

## 1. Safe Release Versioning Standard

Every release across the Seedha Properties ecosystem is strictly traceable back to a single immutable Git commit SHA:

| Component                       | Versioning Pattern                    | Traceability Source              | Example                          |
| ------------------------------- | ------------------------------------- | -------------------------------- | -------------------------------- |
| **Web Frontend (Vercel)**       | Semantic Version `vMAJOR.MINOR.PATCH` | `package.json` + Git Release Tag | `v0.143.0` (`28d1bef`)           |
| **Java 21 Backend (Container)** | Image tag `:git-<sha>` + SemVer       | `pom.xml` + Git Commit SHA       | `seedha-backend:git-28d1bef`     |
| **Flutter Mobile**              | `version: X.Y.Z+BUILD`                | `apps/mobile/pubspec.yaml`       | `1.0.0+143`                      |
| **Database Schema**             | Sequential SQL scripts                | `scripts/migrations/00X_*.sql`   | `005_document_file_security.sql` |

> [!IMPORTANT]
> **Immutable Container Tagging**: Container images deployed to Cloud Run or ECS Fargate MUST NEVER use `latest` as the primary production deployment reference. Every task definition / revision references an exact immutable tag (`:git-<sha>`).

---

## 2. Staging-First Release Pipeline

```
Developer Branch
   │
   ▼
Pull Request & Automated Quality Gate (TypeScript, Vitest, Flutter, Maven 67/67 PASS)
   │
   ▼
Security Hygiene & Secret Scanning (.github/workflows/security.yml)
   │
   ▼
Staging Automated Deployment (Vercel Preview + Java Cloud Run / ECS Staging)
   │
   ▼
Staging Health & Smoke Verification (/api/health, /api/health/readiness)
   │
   ▼
Real Customer Journey Audit (Location-First, Browse, Contact, Auth, KYC)
   │
   ▼
Authorized Production Promotion (Manual Review Approval Gate)
   │
   ▼
Production Deployment & Live Health Verification
```

---

## 3. Application Rollback Runbook

### Scenario A: Web Frontend Incident (Vercel)

If a newly deployed frontend version exhibits critical regressions:

1. **Identify Target**: Locate previous known-good deployment URL via Vercel CLI or GitHub Action output (`needs.deploy.outputs.previous`).
2. **Execute Instant Promotion**:
   ```bash
   npx vercel promote <PREVIOUS_DEPLOYMENT_URL> --token="$VERCEL_TOKEN" --yes
   ```
3. **Verify Health**: Check `https://seedhaproperties.com/` multi-route health (`/`, `/buy`, `/rent`, `/notifications`).
4. **Log Incident**: Create GitHub issue with incident label, affected commit, and root cause analysis.

### Scenario B: Java Backend Incident (ECS / Cloud Run)

If a backend release container fails health checks:

1. **Rollback Container Revision**:
   - **Google Cloud Run**:
     ```bash
     gcloud run services update-traffic seedha-backend --to-revisions=PREVIOUS_REVISION=100 --region=asia-south1
     ```
   - **AWS ECS Fargate**:
     ```bash
     aws ecs update-service --cluster seedha-cluster --service seedha-backend-service --task-definition seedha-backend:PREVIOUS_REVISION
     ```
2. **Verify Readiness**:
   ```bash
   curl -s -f https://api.seedhaproperties.com/api/health/readiness || exit 1
   ```

---

## 4. Database Migration Safety & Expand-Contract Policy

### Principles

- **No Destructive Operations**: `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, and sweeping `DELETE` are strictly forbidden in any release paired with application changes.
- **Expand-Contract Lifecycle**:
  1. **Expand**: Add new nullable columns or tables. Deploy new application code that writes to both old and new columns.
  2. **Backfill**: Asynchronously backfill historical data.
  3. **Switch**: Update application to read exclusively from new columns.
  4. **Contract**: In a subsequent release, drop unused legacy columns after verifying zero traffic.
- **Lock Timeouts**: Every migration must specify `SET lock_timeout = '5s';` to prevent blocking live client connections.

---

## 5. Database Backup & Point-in-Time Recovery (PITR)

- **Provider Managed Backups**:
  - **Neon Staging / Production**: Continuous Write-Ahead Log (WAL) archiving with **7-day Point-in-Time Recovery (PITR)** and automated daily snapshots.
  - **Google Cloud SQL**: Automated daily backups (02:00 IST), binary logging enabled for point-in-time recovery to any second within 7 days.
- **Disaster Restore Procedure**:
  1. Create a new database branch / instance from the desired recovery timestamp (`gcloud sql backups restore` or Neon branch PITR).
  2. Validate critical tables (`properties`, `users`, `notifications`, `kyc_documents`, `property_visits`).
  3. Update application connection string secrets.
  4. Perform health check verification (`/api/health/readiness`).

---

## 6. File & Object Storage Backup & Security

- **Storage Architecture**:
  - **Public Media (`/property_images/`)**: Optimized WebP/JPEG photos served via CDN.
  - **Private Documents (`/kyc_documents/`, `/agreements/`)**: Encrypted at rest (AES-256 / KMS), Uniform Bucket-Level Access, served exclusively via 15-minute presigned URLs.
- **Resilience & Versioning**:
  - **S3 / GCS Bucket Versioning**: Enabled to protect against accidental deletion or overwrite.
  - **Soft Delete / Retention**: 30-day object version retention lifecycle before permanent purge.

---

## 7. Disaster Recovery (DR) Metrics

| Metric                             | Target                                           | Current Measured / Supported Capability                                      |
| ---------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| **RPO (Recovery Point Objective)** | **<= 5 minutes**                                 | Supported via Continuous WAL Archiving / Cloud SQL PITR                      |
| **RTO (Recovery Time Objective)**  | **<= 15 minutes** (App) / **<= 30 minutes** (DB) | Supported via Traffic Splitting, Instant Vercel Rollback & Managed Branching |

---

## 8. Release Verification Checklist

### Pre-Release

- [ ] `mvn clean test -Dspring.profiles.active=staging` (67/67 PASS, 0 failures)
- [ ] `flutter test` (146/146 PASS, 0 failures)
- [ ] `flutter analyze` (0 warnings, 0 errors)
- [ ] `npm run typecheck` (0 errors)
- [ ] CI Secret hygiene check (`.github/workflows/security.yml`) PASS
- [ ] Staging health check (`/api/health/readiness`) returns HTTP 200

### Release Execution

- [ ] Record Git Commit SHA and Release Tag (`vX.Y.Z`)
- [ ] Deploy immutable container tag (`seedha-backend:git-<sha>`)
- [ ] Record previous known-good deployment artifact for rollback

### Post-Release

- [ ] Multi-route health check (`/`, `/buy`, `/rent`, `/notifications`)
- [ ] Live customer journey test (Search, Location Gate, Enquiry, KYC)
- [ ] Sentry / Error monitoring logs checked for 15 minutes post-deploy
