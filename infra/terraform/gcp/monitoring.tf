# ==============================================================================
# Google Cloud Monitoring & Proactive Alerting
# Uptime check on /api/health and high-severity alarms
# ==============================================================================

# Uptime check config for Cloud Run API health
resource "google_monitoring_uptime_check_config" "health_check" {
  display_name = "${var.app_name}-uptime-check-${var.environment}"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/api/health"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = replace(google_cloud_run_v2_service.backend.uri, "https://", "")
    }
  }
}

# Alert policy: Cloud Run 5xx Error Rate > 1%
resource "google_monitoring_alert_policy" "cloud_run_5xx" {
  display_name = "${var.app_name}-cloudrun-5xx-errors-${var.environment}"
  combiner     = "OR"

  conditions {
    display_name = "Cloud Run 5xx error rate exceeds 1%"
    condition_threshold {
      filter          = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"${google_cloud_run_v2_service.backend.name}\" AND metric.type = \"run.googleapis.com/request_count\" AND metric.labels.response_code_class = \"5xx\""
      duration        = "300s" # 5 minutes
      comparison      = "COMPARISON_GT"
      threshold_value = 5

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }
}

# Alert policy: Cloud SQL High CPU Usage (> 80%)
resource "google_monitoring_alert_policy" "cloud_sql_cpu" {
  display_name = "${var.app_name}-cloudsql-high-cpu-${var.environment}"
  combiner     = "OR"

  conditions {
    display_name = "Cloud SQL CPU utilization exceeds 80%"
    condition_threshold {
      filter          = "resource.type = \"cloudsql_database\" AND resource.labels.database_id = \"${var.project_id}:${google_sql_database_instance.postgres.name}\" AND metric.type = \"cloudsql.googleapis.com/database/cpu/utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.80

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }
}
