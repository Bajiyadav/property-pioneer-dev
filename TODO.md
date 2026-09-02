# 🏡 Seedha Properties — Master Task Backlog & 10M Scalability Roadmap

---

## 🟢 Completed & Verified Milestones

### 1. 🛡️ Security, Authentication & Defense-in-Depth

- [x] **XSS Sanitization & HTML Defense**:
  - Implemented `stripHtml`, `escapeHtml`, and `sanitizeUrl` protocol blocking in `src/lib/sanitize.ts` with 6 unit tests.
- [x] **Lightweight Dependency Injection**:
  - Implemented `src/server/services/container.ts` with mockable interfaces (`IDatabaseService`, `IStorageService`, `IEmailService`, `IAuthService`) for isolated testing.
- [x] **Structured JSON Logging & PII Redaction**:
  - Implemented `src/server/logger.ts` with automatic masking of passwords, JWTs, PAN, and Aadhaar numbers.
- [x] **HTTP Security Headers & CORS**:
  - Enforced CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, HSTS, and strict origin validation in `src/server/security-middleware.ts`.
- [x] **Native Authentication & Token Security**:
  - Built `bcryptjs` password hashing, HS256 JWT tokens, and rate-limited auth in `src/server/auth.ts`.
- [x] **Authorization & IDOR Protection**:
  - Enforced strict ownership validation (`owner_id = ctx.user.id`) across properties, enquiries, visits, and rental agreements.
- [x] **S3 Storage Pre-Signed Pipeline**:
  - Implemented 5-minute pre-signed PUT/GET URL generator with MIME whitelist, size limits, and KMS encryption in `src/server/storage.ts`.

### 2. ☕ Java 21 / Spring Boot 3 Enterprise Backend (`backend-java/`)

- [x] **Spring Boot 3 Project Scaffold**:
  - Built `pom.xml`, `application.yml`, and `SeedhaPropertiesApplication.java` with Java 21, Hibernate Spatial, and JJWT.
- [x] **Spring Security & JWT Filter**:
  - Implemented `SecurityConfig.java`, `JwtAuthenticationFilter.java`, `JwtTokenProvider.java`, and `UserPrincipal.java`.
- [x] **PostGIS Spatial Search & Entities**:
  - Built `Property.java` and `PropertyRepository.java` with native `ST_DWithin` spatial radius filtering.
- [x] **REST Controllers Matching API v2**:
  - Implemented `AuthController.java` (`/api/v2/auth`), `PropertyController.java` (`/api/v2/properties`), `MediaController.java` (`/api/v2/media/*`), and `HealthController.java` (`/api/health`).
- [x] **Distributed Redis/Valkey Cache Layer**:
  - Implemented `CacheService.java` with graceful in-memory fallback.
- [x] **Sanitized Error Responses**:
  - Built `GlobalExceptionHandler.java` preventing internal stack traces from leaking to clients.

### 3. ☁️ AWS CloudFormation Infrastructure (`infra/cloudformation/staging-stack.yaml`)

- [x] **VPC & Subnet Isolation**:
  - Dual Public Subnets (for ALB) and Dual Private Subnets (for RDS, Redis & ECS tasks).
- [x] **Least-Privilege Security Groups**:
  - RDS PostgreSQL 5432 is strictly private to ECS Security Group (`0.0.0.0/0` blocked).
- [x] **Amazon SQS Async Queues**:
  - `AsyncJobQueue` + `AsyncJobDeadLetterQueue` (DLQ) for asynchronous jobs.
- [x] **ElastiCache Redis / Valkey**:
  - Distributed caching tier for high-traffic search queries.
- [x] **Horizontal ECS Autoscaling**:
  - Target tracking policies scaling 2 to 10 tasks on CPU and memory thresholds.

---

## 🟡 Staging Deployment & Operational Tasks (Pending AWS Account)

- [ ] **AWS Identity Verification**:
  - Run `aws sts get-caller-identity` in `ap-south-1` (Mumbai) once local AWS credentials are provided.
- [ ] **Deploy CloudFormation Staging Stack**:
  - Provision VPC, RDS PostgreSQL 16 PostGIS, S3 media/docs buckets, SQS queues, and ECS cluster.
- [ ] **Apply PostGIS Schema Migration**:
  - Run `scripts/migrations/001_initial_schema.sql` against the staging RDS instance.
- [ ] **Docker Container Build & Push**:
  - Build Java/Node multi-stage Docker container and push to Amazon ECR.
- [ ] **Staging Smoke & Concurrency Test**:
  - Run `node scripts/benchmark-load-test.mjs` against staging ALB endpoint.

---

## 🔮 Future High-Scale Optimizations (Toward 10M+ MAU)

- [ ] **Amazon OpenSearch Cluster**:
  - Introduce OpenSearch for full-text search across 500,000+ listings once PostgreSQL search reaches measured thresholds.
- [ ] **RDS PostgreSQL Read Replicas**:
  - Attach 1 or 2 Read Replicas to RDS for read-heavy public browsing traffic.
- [ ] **AWS WAF Rate-Based Rules**:
  - Tune WAF managed rule groups (Core Rule Set + Bad Inputs) on CloudFront edge.
- [ ] **Multi-Language i18n Expansion**:
  - Activate Hindi, Telugu, Tamil, Marathi, Kannada, and Bengali localizations on React & Flutter.

---

## 📋 Production Readiness & Release Checklist

- [x] Zero hardcoded AWS secrets, database passwords, or JWT secrets in repository.
- [x] Mandatory State ➔ City location-first discovery flow intact.
- [x] Approved homepage design and styling preserved.
- [x] React & Flutter client adapters communicate seamlessly with `/api/v2/*`.
- [x] All 555 unit and integration tests passing cleanly (0 errors).
- [ ] Final AWS staging deployment and live latency verification completed.
