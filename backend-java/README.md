# ☕ Seedha Properties — Enterprise Java 21 / Spring Boot 3 Backend

[![Java](https://img.shields.io/badge/Java-21_LTS-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3+-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_+_PostGIS_3.4-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Google Cloud Run](https://img.shields.io/badge/Compute-Google_Cloud_Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![Docker](https://img.shields.io/badge/Container-Docker_Multi--stage-2496ED?style=for-the-badge&logo=docker&logoColor=white)](Dockerfile)

> **High-throughput, containerized enterprise microservice engine delivering location-gated property discovery, geospatial PostGIS queries, and transactional real estate services.**

---

## 🏛️ Architectural Overview

The Java backend serves standard `/api/v2/*` REST endpoints for both the React Web client and the Flutter Mobile application:

- **Language & Runtime**: Java 21 LTS with Virtual Threads enabled (`spring.threads.virtual.enabled=true`).
- **Framework**: Spring Boot 3.3+ (Web, Data JPA, Validation, Security).
- **Spatial Engine**: Hibernate Spatial with PostGIS 3.4 for bounding box, polygon radius, and locality search.
- **Connection Pooling**: HikariCP tuned for sub-5ms database latency with Cloud SQL PostgreSQL 16.
- **Cache**: Spring Data Redis with Cloud Memorystore.

---

## 📂 Directory Structure

```
backend-java/
├── Dockerfile                  # Multi-stage container build (Eclipse Temurin 21-jre-alpine)
├── pom.xml                     # Maven project descriptor & dependencies
└── src/
    ├── main/
    │   ├── java/com/seedha/
    │   │   ├── Application.java              # Spring Boot main runner
    │   │   ├── config/                       # Security, CORS, JPA, & Redis configs
    │   │   ├── controller/                   # REST API controllers (/api/v2/*)
    │   │   ├── dto/                          # Immutable request/response DTOs
    │   │   ├── entity/                       # JPA entities with PostGIS geometry
    │   │   ├── repository/                   # Spring Data JPA repositories
    │   │   ├── security/                     # JWT authentication filters & guards
    │   │   └── service/                      # Core transactional business logic
    │   └── resources/
    │       ├── application.yml               # Base configuration
    │       ├── application-dev.yml           # Local development profile
    │       ├── application-staging.yml       # Cloud Run staging profile
    │       └── application-prod.yml          # Production Cloud Run profile
    └── test/                                 # Unit & Integration test suites
```

---

## ⚡ Quick Start & Development

### Prerequisites

- JDK 21 installed (`java -version`)
- Apache Maven 3.9+ (`mvn -version`)
- PostgreSQL 16 with PostGIS extension enabled

### Local Compilation & Running

```bash
# Clean & compile
mvn clean compile

# Run with local development profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Pre-Push Verification Standard

As specified in [AGENTS.md](../AGENTS.md), always verify with zero test failures:

```bash
mvn clean test -Dspring.profiles.active=staging
```

---

## 🐳 Containerization & Deployment

### Build Multi-Stage Docker Image

```bash
docker build -t seedha-backend-java:latest .
```

### Deploy to Google Cloud Run

```bash
gcloud run deploy seedha-backend-java \
  --image gcr.io/[PROJECT_ID]/seedha-backend-java:latest \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars SPRING_PROFILES_ACTIVE=prod
```

---

## 🛡️ Security & Compliance Standards

- **Network Boundaries**: PostgreSQL port 5432 is never exposed publicly; restricted to Cloud SQL Auth Proxy or VPC connectors.
- **Secret Isolation**: Secrets mounted from Google Secret Manager / environment variables at container launch.
- **Non-Unique Queries**: Non-unique attributes (such as user phone lookups) utilize `findFirstBy<Field>OrderByCreatedAtDesc` to prevent `NonUniqueResultException`.
