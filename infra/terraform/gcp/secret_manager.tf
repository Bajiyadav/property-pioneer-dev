# ==============================================================================
# Google Secret Manager
# Secure storage for DB credentials, JWT secrets, and payment API keys
# ==============================================================================

# Database Password Secret
resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.app_name}-db-password-${var.environment}"

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# JWT Signing Secret
resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "${var.app_name}-jwt-secret-${var.environment}"

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}

# Dedicated Service Account for Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = "${var.app_name}-backend-sa-${var.environment}"
  display_name = "Seedha Properties Cloud Run Runtime SA (${var.environment})"
}

# Grant Secret Manager accessor to Cloud Run SA
resource "google_secret_manager_secret_iam_member" "db_password_access" {
  secret_id = google_secret_manager_secret.db_password.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "jwt_secret_access" {
  secret_id = google_secret_manager_secret.jwt_secret.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant Cloud SQL Client permission to Cloud Run SA
resource "google_project_iam_member" "cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant Storage Object Admin on private docs to Cloud Run SA
resource "google_storage_bucket_iam_member" "private_docs_rw" {
  bucket = google_storage_bucket.private_docs.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant Storage Object Admin on public media to Cloud Run SA
resource "google_storage_bucket_iam_member" "public_media_rw" {
  bucket = google_storage_bucket.public_media.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}
