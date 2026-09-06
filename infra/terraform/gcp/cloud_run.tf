# ==============================================================================
# Google Cloud Run (Java 21 / Spring Boot 3)
# Autoscaling (1-10 instances), Auto-HTTPS, Connected to Private Cloud SQL
# ==============================================================================

resource "google_cloud_run_v2_service" "backend" {
  name     = "${var.app_name}-backend-${var.environment}"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloud_run_sa.email

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    scaling {
      min_instance_count = var.cloud_run_min_instances
      max_instance_count = var.cloud_run_max_instances
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.name}/${var.app_name}-backend:${var.environment}"

      resources {
        limits = {
          cpu    = var.cloud_run_cpu
          memory = var.cloud_run_memory
        }
      }

      ports {
        container_port = 8080
      }

      env {
        name  = "SPRING_PROFILES_ACTIVE"
        value = var.environment
      }

      env {
        name  = "PORT"
        value = "8080"
      }

      env {
        name  = "DB_USERNAME"
        value = "seedha_user"
      }

      env {
        name  = "DATABASE_URL"
        value = "jdbc:postgresql://${google_sql_database_instance.postgres.private_ip_address}:5432/seedhadb"
      }

      env {
        name  = "STORAGE_PROVIDER"
        value = "gcp"
      }

      env {
        name  = "GCS_PUBLIC_BUCKET"
        value = google_storage_bucket.public_media.name
      }

      env {
        name  = "GCS_PRIVATE_BUCKET"
        value = google_storage_bucket.private_docs.name
      }

      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.jwt_secret.secret_id
            version = "latest"
          }
        }
      }

      startup_probe {
        initial_delay_seconds = 15
        timeout_seconds       = 3
        period_seconds        = 10
        failure_threshold     = 5
        http_get {
          path = "/api/health"
          port = 8080
        }
      }

      liveness_probe {
        initial_delay_seconds = 30
        timeout_seconds       = 3
        period_seconds        = 15
        failure_threshold     = 3
        http_get {
          path = "/api/health"
          port = 8080
        }
      }
    }
  }

  depends_on = [
    google_sql_database_instance.postgres,
    google_vpc_access_connector.connector,
    google_secret_manager_secret_version.db_password,
    google_secret_manager_secret_version.jwt_secret
  ]
}

# Public invoker for Seedha backend API (accessible by Web and Flutter apps)
resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  name     = google_cloud_run_v2_service.backend.name
  location = google_cloud_run_v2_service.backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
