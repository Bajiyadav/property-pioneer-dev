output "cloud_run_url" {
  description = "The publicly accessible HTTPS URL of the Cloud Run backend service."
  value       = google_cloud_run_v2_service.backend.uri
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL instance connection name for Cloud SQL Auth Proxy."
  value       = google_sql_database_instance.postgres.connection_name
}

output "cloud_sql_private_ip" {
  description = "Private IP address of the Cloud SQL instance inside the VPC."
  value       = google_sql_database_instance.postgres.private_ip_address
}

output "public_media_bucket" {
  description = "Name of the public media GCS bucket (photos, floor plans)."
  value       = google_storage_bucket.public_media.name
}

output "private_docs_bucket" {
  description = "Name of the private documents GCS bucket (KYC, rental agreements)."
  value       = google_storage_bucket.private_docs.name
}

output "vpc_connector_name" {
  description = "Name of the Serverless VPC Access Connector."
  value       = google_vpc_access_connector.connector.name
}

output "artifact_registry_repository" {
  description = "Docker repository URI in Artifact Registry."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.name}"
}
