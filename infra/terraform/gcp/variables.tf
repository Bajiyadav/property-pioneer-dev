variable "project_id" {
  description = "The Google Cloud Project ID where resources will be provisioned."
  type        = string
}

variable "region" {
  description = "The GCP primary region (defaults to Mumbai asia-south1 per architecture rule)."
  type        = string
  default     = "asia-south1"
}

variable "environment" {
  description = "Deployment environment name (staging or prod)."
  type        = string
  default     = "staging"
}

variable "app_name" {
  description = "Base application name."
  type        = string
  default     = "seedha"
}

variable "db_tier" {
  description = "Cloud SQL machine tier (e.g. db-custom-1-3840 for staging, db-custom-2-7680 for production)."
  type        = string
  default     = "db-custom-1-3840"
}

variable "db_disk_size_gb" {
  description = "Initial database SSD disk size in GB."
  type        = number
  default     = 10
}

variable "cloud_run_min_instances" {
  description = "Minimum number of Cloud Run instances (1 recommended for staging/prod to eliminate cold starts)."
  type        = number
  default     = 1
}

variable "cloud_run_max_instances" {
  description = "Maximum number of Cloud Run instances for autoscaling (up to 10 per architecture rule)."
  type        = number
  default     = 10
}

variable "cloud_run_cpu" {
  description = "CPU allocated per Cloud Run container instance."
  type        = string
  default     = "1000m"
}

variable "cloud_run_memory" {
  description = "Memory allocated per Cloud Run container instance."
  type        = string
  default     = "1Gi"
}

variable "cors_allowed_origins" {
  description = "List of allowed frontend web and mobile origins."
  type        = list(string)
  default = [
    "https://seedhaproperties.com",
    "https://www.seedhaproperties.com",
    "https://staging.seedhaproperties.com",
    "http://localhost:5173",
    "http://localhost:3000"
  ]
}
