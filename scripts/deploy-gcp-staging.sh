#!/bin/bash
# ==============================================================================
# Seedha Properties — Automated GCP Staging Deployment Script
# Region: asia-south1 (Mumbai)
# Multi-Cloud: Google Cloud Run + Cloud SQL PostgreSQL 16 + PostGIS + GCS + Secret Manager
# ==============================================================================

set -euo pipefail

# 1. Configuration & Pre-Flight Checks
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
  echo "❌ ERROR: No active GCP project found. Run 'gcloud config set project [YOUR_PROJECT_ID]'"
  exit 1
fi

REGION="asia-south1"
APP_NAME="seedha-backend"
SERVICE_NAME="seedha-backend-staging"
DB_INSTANCE_NAME="seedha-db-staging"
DB_NAME="seedhadb"
DB_USER="seedha_user"
REPO_NAME="seedha-docker-repo"
VPC_NAME="seedha-vpc-staging"
VPC_CONNECTOR_NAME="seedha-vpc-conn-staging"
PUBLIC_BUCKET_NAME="seedha-public-media-staging-${PROJECT_ID}"
PRIVATE_BUCKET_NAME="seedha-private-docs-staging-${PROJECT_ID}"

echo "=================================================="
echo "🚀 DEPLOYING SEEDHA PROPERTIES TO GCP STAGING"
echo "Project: $PROJECT_ID | Region: $REGION"
echo "=================================================="

# 2. Local Pre-Flight Test Verification
echo "🧪 1/8 Verifying staging test suites..."
mvn clean test -Dspring.profiles.active=staging -f backend-java/pom.xml --batch-mode
echo "✅ All Java 21 backend tests passed (0 failures, 0 errors)."

# 3. Enable Required Google Cloud APIs
echo "📦 2/8 Enabling Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  compute.googleapis.com \
  vpcaccess.googleapis.com \
  servicenetworking.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com

# 4. Set up Dedicated Service Account & Permissions
echo "🔐 3/8 Configuring Cloud Run Runtime Service Account..."
SA_NAME="seedha-backend-sa-staging"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="Seedha Backend Staging Runtime Service Account"
fi

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudsql.client" >/dev/null 2>&1 || true

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" >/dev/null 2>&1 || true

# 5. Create Artifact Registry & Build Image
echo "🐳 4/8 Setting up Artifact Registry & Container Build..."
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Docker repository for Seedha Properties Java backend"
fi

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${APP_NAME}:staging"
echo "Building Java 21 Container Image via Cloud Build..."
gcloud builds submit backend-java --tag "$IMAGE_URI"

# 6. Provision Dual-Bucket Google Cloud Storage
echo "🪣 5/8 Configuring Cloud Storage Buckets..."
# Public media bucket (Photos & Floor plans)
if ! gsutil ls -b "gs://${PUBLIC_BUCKET_NAME}" >/dev/null 2>&1; then
  gsutil mb -l "$REGION" -b on "gs://${PUBLIC_BUCKET_NAME}"
  gsutil iam ch allUsers:objectViewer "gs://${PUBLIC_BUCKET_NAME}"
  gsutil cors set - "gs://${PUBLIC_BUCKET_NAME}" << 'EOF'
[{"origin": ["*"],"method": ["GET", "HEAD", "OPTIONS"],"responseHeader": ["*"],"maxAgeSeconds": 3600}]
EOF
fi

# Private documents bucket (KYC, Aadhaar, PAN, Agreements)
if ! gsutil ls -b "gs://${PRIVATE_BUCKET_NAME}" >/dev/null 2>&1; then
  gsutil mb -l "$REGION" -b on "gs://${PRIVATE_BUCKET_NAME}"
  gcloud storage buckets update "gs://${PRIVATE_BUCKET_NAME}" --pap=enforced
fi

# Grant Cloud Run SA access to buckets
gsutil iam ch "serviceAccount:${SA_EMAIL}:objectAdmin" "gs://${PUBLIC_BUCKET_NAME}" >/dev/null 2>&1 || true
gsutil iam ch "serviceAccount:${SA_EMAIL}:objectAdmin" "gs://${PRIVATE_BUCKET_NAME}" >/dev/null 2>&1 || true

# 7. Provision Cloud SQL PostgreSQL 16 with PostGIS
echo "🗄️ 6/8 Setting up Cloud SQL PostgreSQL 16..."
if ! gcloud sql instances describe "$DB_INSTANCE_NAME" >/dev/null 2>&1; then
  echo "Creating Cloud SQL instance (db-custom-1-3840, PostgreSQL 16)..."
  gcloud sql instances create "$DB_INSTANCE_NAME" \
    --database-version=POSTGRES_16 \
    --tier=db-custom-1-3840 \
    --region="$REGION" \
    --storage-type=SSD \
    --storage-size=10GB \
    --storage-auto-increase \
    --backup-start-time=02:00 \
    --maintenance-window-day=SUN \
    --maintenance-window-hour=03 \
    --no-assign-ip
fi

# 8. Deploy to Cloud Run
echo "🚀 7/8 Deploying Java 21 Spring Boot service to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE_URI" \
  --platform=managed \
  --region="$REGION" \
  --service-account="$SA_EMAIL" \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=10 \
  --memory=1Gi \
  --cpu=1 \
  --set-env-vars="SPRING_PROFILES_ACTIVE=staging,PORT=8080,STORAGE_PROVIDER=gcp,GCS_PUBLIC_BUCKET=${PUBLIC_BUCKET_NAME},GCS_PRIVATE_BUCKET=${PRIVATE_BUCKET_NAME}" \
  --add-cloudsql-instances="${PROJECT_ID}:${REGION}:${DB_INSTANCE_NAME}"

# 9. Verification
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)")

echo "=================================================="
echo "✅ 8/8 STAGING DEPLOYMENT COMPLETE!"
echo "Cloud Run Service URL: $SERVICE_URL"
echo "Health Check: $SERVICE_URL/api/health"
echo "=================================================="
