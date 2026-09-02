#!/bin/bash
# ==============================================================================
# Seedha Properties — Automated GCP Staging Deployment Script
# Region: asia-south1 (Mumbai)
# Multi-Cloud: Google Cloud Run + Cloud SQL PostgreSQL 16 + PostGIS
# ==============================================================================

set -euo pipefail

# 1. Configuration
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
PUBLIC_BUCKET_NAME="seedha-public-media-staging-${PROJECT_ID}"
PRIVATE_BUCKET_NAME="seedha-private-docs-staging-${PROJECT_ID}"

echo "=================================================="
echo "🚀 DEPLOYING SEEDHA PROPERTIES TO GCP STAGING"
echo "Project: $PROJECT_ID | Region: $REGION"
echo "=================================================="

# 2. Enable Required APIs
echo "📦 1/7 Enabling Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  compute.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com

# 3. Create Artifact Registry
echo "🐳 2/7 Setting up Artifact Registry..."
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Docker repository for Seedha Properties Java backend"
fi

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${APP_NAME}:staging"

# 4. Build and Push Container Image using Cloud Build
echo "🏗️ 3/7 Building Java 21 Container Image via Cloud Build..."
gcloud builds submit backend-java --tag "$IMAGE_URI"

# 5. Provision Cloud Storage Buckets
echo "🪣 4/7 Configuring Cloud Storage Buckets..."
# Public media bucket (Photos & Floor plans)
if ! gsutil ls -b "gs://${PUBLIC_BUCKET_NAME}" >/dev/null 2>&1; then
  gsutil mb -l "$REGION" -b on "gs://${PUBLIC_BUCKET_NAME}"
  gsutil iam ch allUsers:objectViewer "gs://${PUBLIC_BUCKET_NAME}"
fi

# Private documents bucket (KYC, Aadhaar, PAN, Agreements)
if ! gsutil ls -b "gs://${PRIVATE_BUCKET_NAME}" >/dev/null 2>&1; then
  gsutil mb -l "$REGION" -b on "gs://${PRIVATE_BUCKET_NAME}"
  # Ensure public access is completely blocked (no public IAM granted)
fi

# 6. Provision Cloud SQL PostgreSQL 16 with PostGIS
echo "🗄️ 5/7 Setting up Cloud SQL PostgreSQL 16..."
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

# 7. Deploy to Cloud Run
echo "🚀 6/7 Deploying Java 21 Spring Boot service to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE_URI" \
  --platform=managed \
  --region="$REGION" \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=5 \
  --memory=1Gi \
  --cpu=1 \
  --set-env-vars="SPRING_PROFILES_ACTIVE=staging,PORT=8080" \
  --add-cloudsql-instances="${PROJECT_ID}:${REGION}:${DB_INSTANCE_NAME}"

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)")

echo "=================================================="
echo "✅ STAGING DEPLOYMENT COMPLETE!"
echo "Cloud Run Service URL: $SERVICE_URL"
echo "Health Check: $SERVICE_URL/api/health"
echo "=================================================="
