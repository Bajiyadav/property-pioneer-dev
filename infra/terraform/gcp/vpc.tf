# ==============================================================================
# VPC Network & Private Connectivity
# Ensures Cloud SQL is strictly private (port 5432 closed to 0.0.0.0/0)
# Cloud Run communicates with Cloud SQL via Serverless VPC Access Connector
# ==============================================================================

resource "google_compute_network" "vpc" {
  name                    = "${var.app_name}-vpc-${var.environment}"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
  description             = "Dedicated VPC network for Seedha Properties ${var.environment}"
}

# Subnet for Serverless VPC Access Connector
resource "google_compute_subnetwork" "connector_subnet" {
  name                     = "${var.app_name}-connector-sub-${var.environment}"
  ip_cidr_range            = "10.8.0.0/28"
  region                   = var.region
  network                  = google_compute_network.vpc.id
  private_ip_google_access = true
}

# Serverless VPC Access Connector (connecting Cloud Run to private Cloud SQL)
resource "google_vpc_access_connector" "connector" {
  name          = "${var.app_name}-vpc-conn-${var.environment}"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.8.0.0/28"

  min_instances = 2
  max_instances = 3
  machine_type  = "e2-micro"

  depends_on = [google_compute_subnetwork.connector_subnet]
}

# Reserved internal IP block for Cloud SQL private services peering
resource "google_compute_global_address" "private_ip_address" {
  name          = "${var.app_name}-private-ip-${var.environment}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

# Private connection between VPC and Google Managed Services (Cloud SQL)
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}
