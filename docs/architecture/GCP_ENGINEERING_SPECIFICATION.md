# 🛡️ Seedha Properties — GCP Engineering Specification & Architecture Audit Directive

> **STATUS**: FROZEN / AUDIT STAGE ONLY (DO NOT DEPLOY / DO NOT PROVISION RESOURCES)  
> **PRIMARY DIRECTIVE**: Finish and verify the full Seedha core product user experience before executing any cloud infrastructure migration.

---

## 1. 🛑 Mandatory Pre-requisite & Deployment Gate

1. **No Premature Cloud Provisioning**:
   - Earlier GCP attempts confirmed that provisioning without verified billing/networking blocks execution and wastes cycles.
   - **Do NOT deploy or provision Cloud SQL, Cloud Run, or VPC resources yet.**
2. **Product First Priority**:
   - The platform team must first complete, polish, and verify the end-to-end user journeys across Web and Flutter:
     $$\text{Search} \longrightarrow \text{Rent} \longrightarrow \text{Buy} \longrightarrow \text{Commercial} \longrightarrow \text{Property Details} \longrightarrow \text{Map} \longrightarrow \text{Owner} \longrightarrow \text{Enquiry} \longrightarrow \text{Visit} \longrightarrow \text{Payment}$$
3. **Evidence-Based Completion Standards**:
   - Creating cloud resources **does not** mean "GCP is ready".
   - Staging and production transitions require strict evidence progression:
     $$\mathbf{CODE\ READY} \longrightarrow \mathbf{STAGING\ VERIFIED} \longrightarrow \mathbf{SECURITY\ VERIFIED} \longrightarrow \mathbf{LOAD\ VERIFIED} \longrightarrow \mathbf{BACKUP\ RESTORE\ VERIFIED} \longrightarrow \mathbf{PRODUCTION\ READY}$$

---

## 2. 🏛️ Senior Developer Architecture Audit Brief

When the senior developer audits the GCP architecture, they must follow this exact requirement:

> _"Audit this GCP architecture before implementing it. Don't deploy anything. Verify every component, security boundary, network path, database version, storage policy, backup/DR design and actual current pricing. Keep the architecture simple and production-grade. Avoid Redis/Kafka/Kubernetes unless there is a demonstrated requirement. Preserve our Java 21/Spring Boot + PostgreSQL/PostGIS architecture and support both Flutter and Web."_

### Core Architectural Flow

```
Flutter App \
              ───> HTTPS / REST v2 ───> Cloud Run (Java 21 / Spring Boot 3)
Website     /                           │
                                        ├── Cloud SQL Connector ──> PostgreSQL + PostGIS
                                        ├── Object Storage (Public vs Private)
                                        ├── Secret Manager
                                        ├── Background Jobs
                                        └── Cloud Monitoring / Logging
Artifact Registry ──(Immutable Digest)──┘
```

### Spatial / Geo Location Flow

```
Customer
   │
   ▼
Device GPS Coordinates (Lat/Lng)
   │
   ▼
Seedha Java API (/api/v2/properties/nearby)
   │
   ▼
PostGIS Spatial Index (ST_DWithin / GiST index)
   │
   ▼
Property Search Results
   │
   ▼
MapLibre (Web & Flutter)
   │
   ▼
OSM-Derived Map Data & Vector Tiles
```

---

## 3. ⚠️ Architecture Guardrails & Corrections

### A. Cost Modeling — No Blind Fixed Estimates

- **Rule**: Do not promise or assume a fixed "$65–$95/month" budget.
- **Requirement**: Produce an accurate, region-specific cost estimate using the live Google Cloud Pricing Calculator once the machine sizes, IOPS, storage auto-expansion, network egress, and backup retention policies are formally finalized.
- **SLA Alert**: Shared-core instances (`db-f1-micro`, `db-g1-small`) are billed hourly but **are not covered by the Cloud SQL SLA**. Production workloads must be evaluated on dedicated instances with high availability (HA).

### B. No Premature Cache (Zero Redis by Default)

- Start with **PostgreSQL with proper B-tree and GiST spatial indexes**, combined with Spring Boot in-memory application caching (`CaffeineCacheManager`).
- **No Redis / Kafka / Kubernetes** until profiling and telemetry demonstrate a proven requirement under measured load.

### C. Native Cloud SQL Java Connector

- Rather than maintaining external Cloud SQL Auth Proxy sidecars, evaluate the **Cloud SQL Java Connector** (`com.google.cloud.sql:postgres-socket-factory`) native to Java 21 / Spring Boot.
- Evaluate private Google Access and VPC Serverless Connectors where direct internal IP routing is required.

### D. Supported PostgreSQL / PostGIS Versioning

- Do not blindly lock PostgreSQL 16 because of initial notes.
- Select the currently supported GCP Cloud SQL engine version that satisfies compatibility between:
  - Java 21 (Temurin / GraalVM)
  - Spring Boot 3.3+
  - Hibernate Spatial 6.x
  - PostGIS 3.4+

### E. Strict Storage Classification & Authorization

Never make storage "public" by default. Enforce a strict binary separation:

| Data Type                                 | Storage Tier             | Access Policy                                                      |
| :---------------------------------------- | :----------------------- | :----------------------------------------------------------------- |
| **Public Property Photos**                | Public Media Bucket      | Public read-optimized / CDN edge delivery                          |
| **Public Floor Plans & Brochures**        | Public Media Bucket      | Public read-optimized delivery                                     |
| **Customer KYC Documents**                | Private Protected Bucket | Authenticated backend authorization only                           |
| **Aadhaar / PAN Cards**                   | Private Protected Bucket | Zero public access; AES-256 / KMS encrypted; 5-min pre-signed URLs |
| **Identity Verification Cards**           | Private Protected Bucket | Strict role-gated admin/owner access                               |
| **Rental Agreement Drafts & Signed PDFs** | Private Protected Bucket | Short-lived signed URLs for landlord & tenant                      |
| **Internal Verification Documents**       | Private Protected Bucket | Internal compliance access only                                    |

---

## 4. 📋 Verification & Gate Progression Checklist

Every stage requires concrete test logs and artifacts before passing to the next:

- [ ] **1. CODE READY**: All Spring Boot endpoints, Flutter mobile screens, and Web flows compile with 0 lint errors, 0 type errors, and 100% unit tests passing.
- [ ] **2. STAGING VERIFIED**: End-to-end integration verified on staging environment without egress or authentication timeouts.
- [ ] **3. SECURITY VERIFIED**: Zero hardcoded secrets, database port 5432 closed to `0.0.0.0/0`, all private documents protected with short-lived pre-signed URLs.
- [ ] **4. LOAD VERIFIED**: Load benchmarks (`npm run benchmark:load`) executed and recorded to establish baseline throughput and latency.
- [ ] **5. BACKUP & RESTORE VERIFIED**: Automated point-in-time recovery (PITR) and backup restore drill executed and timed.
- [ ] **6. PRODUCTION READY**: Signed off with live billing, alerts, and production domain routing.
