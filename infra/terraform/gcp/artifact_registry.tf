# ==============================================================================
# Google Artifact Registry
# Secure container repository for Java 21 Spring Boot images
# ==============================================================================

resource "google_artifact_registry_repository" "docker_repo" {
  repository_id = "${var.app_name}-docker-repo"
  location      = var.region
  format        = "DOCKER"
  description   = "Seedha Properties Java 21 container repository"

  # Cost Control: Automatic cleanup of stale / untagged container images
  cleanup_policies {
    id     = "keep-minimum-versions"
    action = "KEEP"
    most_recent_versions {
      package_name_prefixes = ["seedha"]
      keep_count            = 10
    }
  }

  cleanup_policies {
    id     = "delete-untagged"
    action = "DELETE"
    condition {
      tag_state  = "UNTAGGED"
      older_than = "1209600s" # 14 days
    }
  }
}
