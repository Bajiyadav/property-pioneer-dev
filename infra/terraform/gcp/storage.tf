# ==============================================================================
# Google Cloud Storage (Dual-Bucket Architecture)
# 1. Public Media Bucket: Property photos, floor plans, brochures (CDN ready)
# 2. Private Protected Bucket: KYC documents, Aadhaar/PAN, rental agreements
#    (Public Access Prevention enforced, 5-min pre-signed URLs, cost tiering)
# ==============================================================================

# Public Media Bucket
resource "google_storage_bucket" "public_media" {
  name                        = "seedha-public-media-${var.environment}-${var.project_id}"
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true

  cors {
    origin          = var.cors_allowed_origins
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      age = 7 # Delete failed / incomplete multipart uploads
    }
    action {
      type = "AbortIncompleteMultipartUpload"
    }
  }
}

# Public read IAM binding for public media bucket
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.public_media.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Private Protected Documents Bucket
resource "google_storage_bucket" "private_docs" {
  name                        = "seedha-private-docs-${var.environment}-${var.project_id}"
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced" # Strictly blocks any accidental public access

  cors {
    origin          = var.cors_allowed_origins
    method          = ["GET", "PUT", "HEAD", "OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  # Cost Control: Transition older agreements and archives to cheaper storage tiers
  lifecycle_rule {
    condition {
      age                = 90
      matches_prefix     = ["rental-agreements/"]
      matches_storage_class = ["STANDARD"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age                = 365
      matches_prefix     = ["rental-agreements/"]
      matches_storage_class = ["NEARLINE"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 3
    }
    action {
      type = "AbortIncompleteMultipartUpload"
    }
  }
}
