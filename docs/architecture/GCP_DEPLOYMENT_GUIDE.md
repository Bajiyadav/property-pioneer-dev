# 🛡️ Seedha Properties — GCP Deployment & Operations Guide

This guide details the complete infrastructure deployment process for **Seedha Properties** on Google Cloud Platform (GCP) in `asia-south1` (Mumbai).

---

## 1. 🏛️ Architecture Overview

```
Flutter Mobile App \
                     ───> HTTPS / REST v2 ───> Google Cloud Run (Java 21 / Spring Boot 3)
React Web App      /                           │  (Min 1, Max 10 instances, Auto-HTTPS)
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
     Serverless VPC Access           Dual-Bucket GCS                 Secret Manager
               │                  ┌─────────────────────┐         (DB Passwords, JWT,
               ▼                  │ Public Media Bucket │          Razorpay, Turnstile)
        Cloud SQL PostgreSQL 16   │ (CDN, allUsers:view)│
             + PostGIS 3.4        ├─────────────────────┤
     (Private IP, Port 5432       │ Private Docs Bucket │
      closed to 0.0.0.0/0)        │ (PAP, 5-min presign)│
                                  └─────────────────────┘
```

---

## 2. 📁 Infrastructure Assets

All infrastructure-as-code and deployment automation files are located in the repository:

| File / Directory                                                                                                                                                        | Purpose                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`infra/terraform/gcp/`](file:///Users/bajiyadav/.gemini/antigravity/scratch/property-pioneer-dev/infra/terraform/gcp)                                                  | Complete Terraform modules (VPC, Cloud SQL, Cloud Run, GCS, Secret Manager, Monitoring) |
| [`infra/terraform/gcp/terraform.tfvars.example`](file:///Users/bajiyadav/.gemini/antigravity/scratch/property-pioneer-dev/infra/terraform/gcp/terraform.tfvars.example) | Staging variable configurations                                                         |
| [`cloudbuild.yaml`](file:///Users/bajiyadav/.gemini/antigravity/scratch/property-pioneer-dev/cloudbuild.yaml)                                                           | Google Cloud Build pipeline (Test ➔ Container Build ➔ Deploy)                           |
| [`scripts/deploy-gcp-staging.sh`](file:///Users/bajiyadav/.gemini/antigravity/scratch/property-pioneer-dev/scripts/deploy-gcp-staging.sh)                               | Automated staging deployment script                                                     |

---

## 3. 🚀 Deployment Options

### Option A: Terraform Infrastructure-as-Code (Recommended for Production & Staging)

1. **Authenticate to GCP**:

   ```bash
   gcloud auth login
   gcloud auth application-default login
   gcloud config set project [YOUR_PROJECT_ID]
   ```

2. **Initialize Terraform State Bucket**:

   ```bash
   gsutil mb -l asia-south1 gs://seedha-terraform-state-[YOUR_PROJECT_ID]
   ```

3. **Deploy Resources**:
   ```bash
   cd infra/terraform/gcp
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your project ID

   terraform init -backend-config="bucket=seedha-terraform-state-[YOUR_PROJECT_ID]"
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

### Option B: Automated Staging Script

For rapid automated deployment directly using `gcloud`:

```bash
chmod +x scripts/deploy-gcp-staging.sh
./scripts/deploy-gcp-staging.sh
```

---

## 4. 🗄️ Database Migrations on Cloud SQL

Because Cloud SQL has its public IP disabled (port 5432 is strictly private), apply migrations using the **Cloud SQL Auth Proxy**:

```bash
# 1. Start Cloud SQL Auth Proxy in a background terminal
cloud-sql-proxy [PROJECT_ID]:asia-south1:[INSTANCE_NAME] --port 5433

# 2. Run migrations against localhost:5433
DATABASE_URL="postgresql://seedha_user:[PASSWORD]@127.0.0.1:5433/seedhadb" \
  node scripts/run-migration.mjs
```

---

## 5. 💰 Cost Control Best Practices

1. **Cloud Run Autoscaling**:
   - Staging: Min 1 instance (eliminates Java cold starts while keeping costs under ₹1,500/month).
   - Off-peak dev: Min 0 instances allowed if completely inactive.
2. **Cloud Storage (GCS) Dual-Bucket Tiering**:
   - Public media uploads abort failed/incomplete multipart uploads after 7 days.
   - Private rental agreements transition automatically to `NEARLINE` storage after 90 days and `COLDLINE` after 365 days (saving up to 70% storage cost).
3. **Cloud SQL Tuning**:
   - Default staging uses `db-custom-1-3840` (1 vCPU, 3.75 GB RAM) with SSD auto-increase.
   - Nightly off-peak automated backups at 02:00 IST with 7-day retention.
4. **Artifact Registry Retention**:
   - Cleanup policy keeps only the 10 most recent tagged container images and automatically purges untagged intermediate layers older than 14 days.

---

## 6. 🚨 Health Check & Observability Verification

After deployment, verify the services:

```bash
# Health probe verification
curl -f https://[SERVICE_URL]/api/health

# Actuator metrics probe
curl -f https://[SERVICE_URL]/actuator/health
```
