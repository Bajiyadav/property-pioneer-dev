# 🏡 Seedha Properties

<div align="center">

[![Framework](https://img.shields.io/badge/Framework-TanStack_Start_0.120-FF4154?style=for-the-badge&logo=react)](https://tanstack.com/start)
[![Mobile](https://img.shields.io/badge/Mobile-Flutter_3.x-02569B?style=for-the-badge&logo=flutter)](https://flutter.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Native_Backend-Node.js_TypeScript-339933?style=for-the-badge&logo=node.js)](src/server/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_16_+_PostGIS_3.4-336791?style=for-the-badge&logo=postgresql)](scripts/migrations/)
[![Tests](https://img.shields.io/badge/Tests-537_Passed-brightgreen?style=for-the-badge&logo=vitest)](tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_0_Errors-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-yellow?style=for-the-badge)](LICENSE)

**Find Direct. Live Better.**  
_India's Zero-Brokerage, Direct-Owner Real Estate Marketplace Platform._

[🌐 Live Production Web Platform](https://seedhaproperties.com) • [📱 Mobile App Repository](apps/mobile/) • [📖 Master Documentation](#-table-of-contents)

</div>

---

## 📑 Table of Contents

1. [Project Overview & Mission](#1-project-overview--mission)
2. [Project Status & Architecture Transition](#2-project-status--architecture-transition)
3. [Key Features & Marketplace Capabilities](#3-key-features--marketplace-capabilities)
4. [Mandatory Location-First UX Architecture](#4-mandatory-location-first-ux-architecture)
5. [Web Application Architecture](#5-web-application-architecture)
6. [Flutter Mobile Application](#6-flutter-mobile-application)
7. [Native Backend Architecture (v2)](#7-native-backend-architecture-v2)
8. [Database Schema & PostGIS Implementation](#8-database-schema--postgis-implementation)
9. [Authentication & Session Management](#9-authentication--session-management)
10. [S3 Object Storage & Media Pipeline](#10-s3-object-storage--media-pipeline)
11. [Target AWS Cloud Architecture](#11-target-aws-cloud-architecture)
12. [Docker & Containerization](#12-docker--containerization)
13. [API Documentation Reference (`/api/v2/*`)](#13-api-documentation-reference-apiv2)
14. [Security Architecture & Authorization Matrix](#14-security-architecture--authorization-matrix)
15. [Performance Benchmarking & Latency Guidelines](#15-performance-benchmarking--latency-guidelines)
16. [Test Suite & Quality Assurance](#16-test-suite--quality-assurance)
17. [Local Development Setup](#17-local-development-setup)
18. [AWS Staging & Production Deployment Roadmap](#18-aws-staging--production-deployment-roadmap)
19. [Backup, Disaster Recovery & Rollback Procedure](#19-backup-disaster-recovery--rollback-procedure)
20. [Observability & Monitoring](#20-observability--monitoring)
21. [Legal, Compliance & Policy Framework](#21-legal-compliance--policy-framework)
22. [Repository Structure](#22-repository-structure)
23. [Master Roadmap & Pending Milestones](#23-master-roadmap--pending-milestones)
24. [Strict Project Constraints](#24-strict-project-constraints)

---

## 1. Project Overview & Mission

**Seedha Properties** is a high-performance, direct-owner real estate marketplace designed to eliminate broker commissions and friction in Indian residential and commercial real estate.

### Core Value Propositions

- **100% Direct Owner Connections (0% Brokerage)**: Buyers and tenants connect directly with verified property owners via in-app enquiries, verified phone contact passes, and site visit scheduling.
- **Strict Location-First Discovery**: Enforces a mandatory **State ➔ City** discovery flow before property feeds or search filters are activated, ensuring users only see localized, relevant inventory.
- **Privacy-Safe Geospatial Discovery**: Exact property coordinates are kept confidential on the database level; public search results and map interfaces use privacy-preserving ~110m jittered circles (`approx_latitude`, `approx_longitude`).
- **End-to-End Real Estate Services**: Beyond discovery, Seedha provides digital **Rental Agreement Generation**, **Instant Home Loan Eligibility**, **Document KYC Verification**, and **Seedha AI** (a Retrieval-Augmented Generation assistant grounded in authentic listing data).

---

## 2. Project Status & Architecture Transition

The project is currently undergoing a planned, non-destructive migration from a managed PaaS setup (Vercel + Supabase) to a self-managed, high-throughput cloud infrastructure on AWS.

```
CURRENT ACTIVE PRODUCTION (Unmodified Baseline)
┌──────────────────────────────────────────────┐
│  Web: Vercel SSR Edge Network                │
│  Backend: Supabase Managed Cloud             │
│  (PostgreSQL, GoTrue Auth, Storage Buckets)  │
└──────────────────────────────────────────────┘
                       │ (Active until AWS Staging Parity is Verified)
                       ▼
TARGET PRODUCTION ARCHITECTURE (AWS ap-south-1)
┌──────────────────────────────────────────────────────────┐
│  Route 53 ➔ CloudFront ➔ Application Load Balancer (ALB) │
│  ➔ ECS / Fargate (Native Node.js/TS Backend)             │
│  ➔ AWS RDS PostgreSQL 16 + PostGIS 3.4                   │
│  ➔ S3 (Public Media + Private Encrypted KMS Docs)        │
│  ➔ AWS SES (Transactional Email)                         │
│  ➔ AWS Secrets Manager + CloudWatch Monitoring           │
└──────────────────────────────────────────────────────────┘
```

### Component Status Matrix

| Component / Layer                     | Implementation Status | Current Baseline                         | Target Staging / Prod                    |
| :------------------------------------ | :-------------------: | :--------------------------------------- | :--------------------------------------- |
| **Location-First Homepage UX**        |   ✅ **Completed**    | Production Active                        | Immutable (State ➔ City)                 |
| **Marketplace Feeds (Buy/Rent/Comm)** |   ✅ **Completed**    | Production Active                        | Native API `/api/v2/properties`          |
| **7-Step Owner Listing Flow**         |   ✅ **Completed**    | Production Active                        | Native API `/api/v2/properties/manage`   |
| **Rental Agreement Engine**           |   ✅ **Completed**    | Production Active                        | Native API `/api/v2/rental-agreements`   |
| **Seedha AI (RAG Assistant)**         |   ✅ **Completed**    | Gemini 2.5 Flash Proxy                   | Native PostgreSQL RAG Grounding          |
| **Native DB Pool (`postgres.js`)**    |   ✅ **Completed**    | In Codebase (`src/server/db.ts`)         | AWS RDS PostgreSQL 16                    |
| **Native JWT Auth & Session Engine**  |   ✅ **Completed**    | In Codebase (`src/server/auth.ts`)       | Native `/api/v2/auth`                    |
| **S3 Pre-Signed Upload & Storage**    |   ✅ **Completed**    | In Codebase (`src/server/storage.ts`)    | AWS S3 (Public Media / Private KMS Docs) |
| **AWS SES Transactional Email**       |   ✅ **Completed**    | In Codebase (`src/server/email.ts`)      | AWS SES (`ap-south-1`)                   |
| **CloudFormation Staging Stack**      |   ✅ **Completed**    | In Codebase (`infra/staging-stack.yaml`) | AWS Staging Provisioning                 |
| **ECS Docker Container Image**        |   ✅ **Completed**    | In Codebase (`infra/Dockerfile`)         | AWS ECR                                  |
| **AWS Staging Infrastructure**        |  🚧 **In Progress**   | Awaiting CLI Auth Execution              | AWS ECS/RDS/S3 Staging                   |
| **Database & Storage Data Migration** |    ⏳ **Planned**     | Source: Supabase                         | Target: RDS PostGIS + S3                 |
| **Production DNS Cutover**            |    ⏳ **Planned**     | `seedhaproperties.com` on Vercel         | CloudFront / ALB Staging Switch          |
| **Supabase Runtime Removal**          |    ⏳ **Planned**     | Runtime Active in Prod                   | Zero-dependency Phase 10                 |

---

## 3. Key Features & Marketplace Capabilities

### 🔍 Discovery & Filtering

- **Buy, Rent, Commercial Channels**: Dedicated filtering by listing category, property type (Apartment, Independent House, Villa, Commercial Office, Retail Shop, Plot), BHK layout, and budget.
- **Commute & Locality Insights**: Live transit estimates, nearby metro stations, IT parks, schools, and hospitals indexed per locality.
- **Dynamic Sort & Pagination**: Cached listings sorted by creation date, price, or locality.

### 📝 7-Step Owner Listing Experience

1. **Basic Info**: Title, listing type (Rent/Sale), property type, and city selection.
2. **Detailed Specs**: BHK type, floor level, total floors, carpet area, property age, facing direction, and parking slots.
3. **Pricing & Terms**: Monthly rent, maintenance charges, security deposit, lock-in period, and negotiable flags.
4. **Locality & Privacy Address**: Pincode, landmark, nearby infrastructure, and privacy-protected pinpointing.
5. **Amenities**: Gated security, lift, power backup, gym, swimming pool, clubhouse, gas pipeline, and water supply.
6. **High-Resolution Media**: Multi-image photo upload with thumbnail reordering and video tour link attachment.
7. **Schedule & Verification Declaration**: Preferred site visit hours, legal declaration, and submission for admin review.

### 🤝 Direct Seeker-Owner Transactions

- **Direct Enquiries**: Instant lead submission routed directly to the property owner with SMS/Email alerts.
- **Site Visit Scheduling**: In-person or virtual video visit booking with time-slot confirmation.
- **Saved Favorites**: One-click bookmarking synchronized across Web and Mobile.
- **Contact Passes**: Safe contact revealing with anti-scraping rate limits and quota monitoring.

### 📄 Digital Rental Agreements & Legal Services

- **Full Digital Lease Creation**: Supports residential lease agreements with customizable clauses, lock-in terms, escalation percentages, and utility billing schedules.
- **Multi-Tenant Support**: Accommodates multiple co-tenants, digital signatures, and e-stamp verification.
- **Document Management ("My Agreements")**: Downloadable PDF preview, status tracking (`draft`, `pending_signature`, `active`, `expired`), and private document storage.

### 🤖 Seedha AI (Intelligent Grounded RAG Assistant)

- **Zero-Hallucination Marketplace Intelligence**: RAG pipeline grounded strictly in verified database properties and customer knowledge items.
- **Intent Recognition & Progressive Clarification**: Guides seekers with incomplete prompts (e.g., "Find me a flat") by asking clarifying budget/locality questions before searching.
- **Adversarial & Injection Defense**: Rejects attempts to fabricate non-existent listings or extract internal system prompts.

### 💳 Home Loans & Value-Added Services

- **Instant Eligibility Calculator**: Pre-qualifies loan amounts based on monthly income, existing EMIs, and property value.
- **Direct Bank Partner Routing**: Submits pre-screened home loan applications to verified banking partners.

---

## 4. Mandatory Location-First UX Architecture

> [!IMPORTANT]
> **CRITICAL INVARIANT**: The location-first discovery flow is a permanent, non-negotiable architectural rule of the Seedha Properties platform.

```
                   [ Visitor Lands on Homepage ]
                                 │
                                 ▼
                   ┌───────────────────────────┐
                   │  1. State Selection Modal │
                   └───────────────────────────┘
                                 │ (State confirmed)
                                 ▼
                   ┌───────────────────────────┐
                   │  2. City Selection Modal  │
                   └───────────────────────────┘
                                 │ (City confirmed)
                                 ▼
       ┌───────────────────────────────────────────────────┐
       │     Unlocks Marketplace Search & Navigation       │
       │  • Buy Feed       • Rent Feed    • Commercial     │
       │  • Property Search• Locality Bar • Post Property  │
       └───────────────────────────────────────────────────┘
```

1. **State First**: Visitors must select their State (e.g., Telangana, Karnataka, Maharashtra).
2. **City Gating**: City choices remain disabled until a valid State is confirmed.
3. **Marketplace Gating**: Direct search inputs, category feeds, and navigation links remain locked until **State + City** are saved.
4. **State Persistence**: Location preferences are stored in local storage and session context, preventing repetitive prompts while browsing.

---

## 5. Web Application Architecture

The web application is built with modern full-stack TypeScript technologies providing Server-Side Rendering (SSR), hydration, and API routes.

- **Framework**: [TanStack Start](https://tanstack.com/start) (`v0.120.0`)
- **UI Runtime**: React 19 (`v19.0.0`) with TypeScript (`v5.8.2`)
- **Routing**: [TanStack Router](https://tanstack.com/router) with automatic file-based code generation (`src/routeTree.gen.ts`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with CSS variables and Radix UI primitives
- **Bundler & Server Engine**: [Vite](https://vitejs.dev/) + [Nitro](https://nitro.unjs.io/)
- **Data Fetching & Cache**: [TanStack Query](https://tanstack.com/query) (`v5.62.7`)
- **Animations & Icons**: Framer Motion (`v11.15.0`) & Lucide React
- **Internationalization (i18n)**: `i18next` with multi-language SSR support (English, Hindi, Telugu)

---

## 6. Flutter Mobile Application

The mobile application is located in `apps/mobile/` and provides a cross-platform Android and iOS client.

### Architecture Overview

- **Framework**: Flutter 3.x (Dart 3.x)
- **State Management**: `flutter_riverpod`
- **Navigation**: `go_router`
- **Native Client Adapter**: [`NativeApiClient`](apps/mobile/lib/core/network/native_api_client.dart) communicating with `/api/v2/*`
- **Key Modules**:
  - `lib/features/properties/`: Feed browsing, photo carousel, filter sheets, locality search.
  - `lib/features/owner/`: 7-step property wizard, KYC upload screen, listing manager.
  - `lib/features/agreements/`: Rental agreement creation and PDF agreement preview.
  - `lib/features/profile/`: Seedha Deals profile screen with verified badge and activity counters.
  - `lib/features/chat/`: Real-time seeker-owner direct messaging.

---

## 7. Native Backend Architecture (v2)

The native backend runs inside the same high-performance Node.js runtime as TanStack Start / Nitro, executing direct SQL queries against PostgreSQL.

```
src/server/
├── db.ts       # postgres.js connection pool, SSL configuration, and query timing diagnostics
├── cache.ts    # In-memory LRU cache with TTL and key-prefix invalidation
├── auth.ts     # bcryptjs password hashing and jose Web Crypto JWT signing & verification
├── storage.ts  # AWS S3 client, MIME validation, file size guards, and pre-signed URL generator
└── email.ts    # AWS SES transactional email dispatcher with pre-built HTML templates
```

### Core Technologies

- **PostgreSQL Pool**: `postgres` (`v3.4.7`) with tagged template literals (automatic SQL injection prevention).
- **Security & Tokens**: `jose` (`v6.1.3`) for standards-compliant JWT signing and `bcryptjs` for password salting.
- **In-Memory Caching**: Low-overhead LRU cache with sub-millisecond memory lookups for public listing feeds.

---

## 8. Database Schema & PostGIS Implementation

The database schema is defined idempotently in [`scripts/migrations/001_initial_schema.sql`](scripts/migrations/001_initial_schema.sql) and is ready for PostgreSQL 16 with PostGIS 3.4+.

### Primary Tables & Relationships

```mermaid
erDiagram
    PROFILES ||--o{ PROPERTIES : "owns"
    PROFILES ||--o{ USER_ROLES : "has"
    PROFILES ||--o{ ENQUIRIES : "submits"
    PROFILES ||--o{ PROPERTY_VISITS : "schedules"
    PROFILES ||--o{ FAVORITES : "saves"
    PROFILES ||--o{ RENTAL_AGREEMENTS : "executes"
    PROFILES ||--o{ KYC_DOCUMENTS : "uploads"
    PROPERTIES ||--o{ ENQUIRIES : "receives"
    PROPERTIES ||--o{ PROPERTY_VISITS : "hosts"
    PROPERTIES ||--o{ FAVORITES : "referenced_in"
    PROPERTIES ||--o{ RENTAL_AGREEMENTS : "tied_to"

    PROFILES {
        uuid id PK
        text email UK
        text full_name
        text phone
        app_role role
        timestamptz created_at
    }

    PROPERTIES {
        uuid id PK
        text title
        numeric price
        text city
        text locality
        geometry location "Point, 4326"
        float approx_latitude
        float approx_longitude
        boolean is_approved
        uuid owner_id FK
    }

    RENTAL_AGREEMENTS {
        uuid id PK
        uuid user_id FK
        uuid property_id FK
        text agreement_number UK
        jsonb owner_details
        jsonb tenants
        jsonb rental_terms
        text status
    }
```

### PostGIS Spatial Indexing

```sql
-- Generated PostGIS Point geometry from latitude & longitude
ALTER TABLE public.properties ADD COLUMN location geometry(Point, 4326)
  GENERATED ALWAYS AS (
    CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL
      THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
      ELSE NULL
    END
  ) STORED;

-- High-performance GIST index for proximity and radius queries
CREATE INDEX idx_properties_location ON public.properties USING GIST(location);
```

---

## 9. Authentication & Session Management

Seedha Properties uses a stateless, cryptographically secure JWT authentication architecture.

```
[ Client: Web / Flutter ]
       │
       ├── 1. POST /api/v2/auth { action: "login", email, password }
       ▼
[ Native Auth Server (src/server/auth.ts) ]
       ├── ① Fetch profile and password_hash from PostgreSQL
       ├── ② Verify password with bcrypt.compare()
       ├── ③ Generate HS256 JWT containing (sub: userId, role, email)
       └── ④ Return { ok: true, token, user }
       │
       ▼
[ Subsequent API Calls ]
       └── Request Header: `Authorization: Bearer <token>`
```

### Security Controls

- **Password Salting**: `bcryptjs` with salt round factor 10.
- **Token Verification**: Every protected `/api/v2/*` route validates token integrity using `verifyToken(token)`.
- **Role Isolation**: Supports 6 discrete roles (`customer`, `owner`, `agent`, `moderator`, `admin`, `user`).
- **Web & Mobile Parity**: Web uses local storage + session context; Flutter mobile stores token in secure device storage.

---

## 10. S3 Object Storage & Media Pipeline

All media and documents are managed via **AWS S3 Direct Pre-Signed Uploads**, ensuring client applications never receive AWS credentials and cannot write arbitrary files.

```
[ Client ] ── 1. POST /api/v2/media/presign-upload (with MIME & file size) ──► [ Native API ]
                                                                                   │ Authenticate & Validate
[ Client ] ◄── 2. Return 5-minute Pre-signed PUT URL & Object Key ───────────────┘
    │
    └── 3. Direct Binary PUT ──► [ AWS S3 Bucket ]
                                  ├── Public Media: seedha-properties-public-media-staging (CloudFront)
                                  └── Private Docs: seedha-properties-private-docs-staging (KMS Encrypted)
```

### Folder Constraints & Validation Matrix

| Category / Folder      | Allowed MIME Types                           | Max Size  | Bucket Access                              |
| :--------------------- | :------------------------------------------- | :-------: | :----------------------------------------- |
| `property-photos`      | `image/jpeg`, `image/png`, `image/webp`      | **10 MB** | Public Read via CloudFront                 |
| `property-videos`      | `video/mp4`, `video/webm`                    | **50 MB** | Public Read via CloudFront                 |
| `kyc-documents`        | `image/jpeg`, `image/png`, `application/pdf` | **10 MB** | **Strictly Private (Pre-signed GET only)** |
| `rental-agreements`    | `application/pdf`                            | **10 MB** | **Strictly Private (Pre-signed GET only)** |
| `supporting-documents` | `application/pdf`, `image/jpeg`, `image/png` | **10 MB** | **Strictly Private (Pre-signed GET only)** |

---

## 11. Target AWS Cloud Architecture

> [!NOTE]
> This is the **Target AWS Staging & Production Architecture**. AWS App Runner is explicitly prohibited.

```mermaid
graph TD
    Client([Web & Flutter Clients]) --> Route53[AWS Route 53 DNS]
    Route53 --> CF[Amazon CloudFront CDN]
    CF --> ALB[Application Load Balancer]
    CF --> S3Pub[S3 Public Media Bucket]

    ALB --> ECS[Amazon ECS / AWS Fargate]
    subgraph "Private VPC (ap-south-1)"
        ECS --> RDS[(AWS RDS PostgreSQL 16 + PostGIS)]
        ECS --> S3Priv[S3 Private Docs Bucket - KMS]
        ECS --> Secrets[AWS Secrets Manager]
        ECS --> SES[Amazon SES Email]
        ECS --> CW[Amazon CloudWatch Logs & Metrics]
    end
```

### Target Services

- **Region**: `ap-south-1` (Mumbai, India)
- **Compute**: Amazon ECS with AWS Fargate (minimum-cost serverless container tasks)
- **Database**: Amazon RDS PostgreSQL 16 (`db.t4g.micro` for staging, Multi-AZ for production)
- **Edge Routing**: Amazon Route 53 + AWS Certificate Manager (ACM) + Amazon CloudFront
- **Secrets Management**: AWS Secrets Manager (database credentials, JWT secret, Turnstile secret)
- **Email**: Amazon Simple Email Service (SES)

---

## 12. Docker & Containerization

The production container is defined in [`infra/Dockerfile`](infra/Dockerfile) using an optimized multi-stage Node.js 22 Alpine image.

### Build and Run Locally

```bash
# Build the Docker image
docker build -t seedha-backend -f infra/Dockerfile .

# Run the container locally on port 8080
docker run -p 8080:8080 \
  -e DATABASE_URL="postgres://user:pass@localhost:5432/seedha" \
  -e JWT_SECRET="your-jwt-secret-key" \
  seedha-backend
```

---

## 13. API Documentation Reference (`/api/v2/*`)

All native endpoints follow standard REST conventions, accepting JSON payloads and returning `{ ok: boolean, data?: any, error?: string }`.

### 1. Authentication

- `POST /api/v2/auth`: Handles `login`, `signup`, `refresh`, and `logout`.
  - **Auth**: None (Public)
  - **Body**: `{ action: "login" | "signup", email, password, fullName?, role? }`
  - **Response**: `{ ok: true, token: string, user: AuthUser }`
- `GET /api/v2/auth`: Validates active session.
  - **Auth**: Bearer Token
  - **Response**: `{ ok: true, user: AuthUser }`

### 2. Properties Marketplace

- `GET /api/v2/properties`: Public property search and feed.
  - **Auth**: None (Public)
  - **Query Params**: `city`, `listingType`, `propertyType`, `limit`, `offset`
  - **Response**: `{ ok: true, data: Property[], count: number, latencyMs: number }`
- `POST /api/v2/properties/manage`: Create a new property listing.
  - **Auth**: Bearer Token (Authenticated Owner / Admin)
  - **Body**: Property creation payload (title, price, city, specs, images)
  - **Response**: `{ ok: true, data: Property }`
- `PATCH /api/v2/properties/manage`: Update existing listing.
  - **Auth**: Bearer Token (Listing Owner or Admin only)
  - **Body**: `{ id: string, ...updatedFields }`

### 3. Media & Pre-Signed Storage

- `POST /api/v2/media/presign-upload`: Generate short-lived (300s) S3 upload URL.
  - **Auth**: Bearer Token
  - **Body**: `{ folder, fileName, contentType, fileSizeBytes, entityId? }`
  - **Response**: `{ ok: true, data: { uploadUrl, objectKey, publicUrl?, expiresInSeconds: 300 } }`
- `POST /api/v2/media/presign-download`: Generate short-lived (300s) pre-signed download URL for private KYC / agreements.
  - **Auth**: Bearer Token (Document Owner or Admin only)
  - **Body**: `{ objectKey: string }`
  - **Response**: `{ ok: true, downloadUrl: string, expiresInSeconds: 300 }`

### 4. Enquiries & Visits

- `GET /api/v2/enquiries`: Fetch user-relevant enquiries (Seeker sent, Owner received, Admin all).
  - **Auth**: Bearer Token
- `POST /api/v2/enquiries`: Submit direct buyer/tenant inquiry on a listing.
  - **Auth**: Optional (Supports verified anonymous or authenticated)
  - **Body**: `{ propertyId, name, phone, message }`
- `GET /api/v2/visits`: List scheduled site visits.
  - **Auth**: Bearer Token
- `POST /api/v2/visits`: Book in-person or video site visit.
  - **Auth**: Optional / Bearer Token
  - **Body**: `{ propertyId, visitorName, visitorPhone, visitDate, visitTime, visitType }`

### 5. Rental Agreements

- `GET /api/v2/rental-agreements`: Fetch agreements for authenticated party.
  - **Auth**: Bearer Token (Tenant or Landlord only)
- `POST /api/v2/rental-agreements`: Create draft rental agreement.
  - **Auth**: Bearer Token
  - **Body**: `{ propertyId?, agreementType, ownerDetails, tenants, propertyDetails, rentalTerms, clauses }`

### 6. Favorites & Notifications

- `GET /api/v2/favorites`: List user's saved properties.
  - **Auth**: Bearer Token
- `POST /api/v2/favorites`: Toggle favorite status (`{ propertyId }`).
  - **Auth**: Bearer Token
- `GET /api/v2/notifications`: List in-app notifications.
  - **Auth**: Bearer Token
- `PATCH /api/v2/notifications`: Mark notification as read (`{ notificationId, markAllRead? }`).
  - **Auth**: Bearer Token

### 7. Home Loans

- `POST /api/v2/home-loans`: Submit home loan application lead.
  - **Auth**: Optional / Bearer Token
  - **Body**: `{ applicantName, phone, email, monthlyIncome, loanAmount, city, employmentType }`

---

## 14. Security Architecture & Authorization Matrix

The native backend replaces database-level RLS policies with strict, defense-in-depth **Server-Side Authorization Middleware**.

| Resource / Action                      |  Anonymous Visitor  |  Authenticated Seeker  |   Authenticated Owner    | Platform Admin |
| :------------------------------------- | :-----------------: | :--------------------: | :----------------------: | :------------: |
| **Browse Approved Properties**         |     ✅ Allowed      |       ✅ Allowed       |        ✅ Allowed        |   ✅ Allowed   |
| **View Private Exact GPS Coordinates** |     ❌ Blocked      |       ❌ Blocked       |  ✅ Own Properties Only  |   ✅ Allowed   |
| **Submit Property Listing**            | ❌ 401 Unauthorized | ✅ Auto-assigned Owner |        ✅ Allowed        |   ✅ Allowed   |
| **Edit Property Listing**              | ❌ 401 Unauthorized |    ❌ 403 Forbidden    |  ✅ Own Properties Only  |   ✅ Allowed   |
| **Read Direct Enquiries**              | ❌ 401 Unauthorized | ✅ Sent Inquiries Only | ✅ Received on Own Props | ✅ Allowed All |
| **Download KYC / Lease PDFs**          | ❌ 401 Unauthorized | ✅ Own Agreement Only  |  ✅ Own Agreement Only   |   ✅ Allowed   |
| **Approve / Moderate Listings**        | ❌ 401 Unauthorized |    ❌ 403 Forbidden    |     ❌ 403 Forbidden     |   ✅ Allowed   |

---

## 15. Performance Benchmarking & Latency Guidelines

To maintain scientific integrity, the project strictly distinguishes between measured micro-benchmarks and live cloud database queries.

### Measured Concurrency Benchmark (`npm run benchmark`)

_Runner: 20 concurrent workers (100 HTTP requests)_

| Endpoint Tested                               |    Throughput (RPS)    | Error Rate |  p50 Latency  |  p95 Latency  |  p99 Latency  |
| :-------------------------------------------- | :--------------------: | :--------: | :-----------: | :-----------: | :-----------: |
| **Native Health Handler (`/api/health`)**     |    **437.1 req/s**     | **0.00%**  | **43.79 ms**  | **63.00 ms**  | **94.09 ms**  |
| **RDS Properties API (`/api/v2/properties`)** | _Awaiting Staging RDS_ |   _N/A_    | _Pending RDS_ | _Pending RDS_ | _Pending RDS_ |

> [!WARNING]
> Latency figures for database operations remain explicitly **UNPROVEN** until measured against the provisioned AWS RDS staging instance under realistic concurrency.

---

## 16. Test Suite & Quality Assurance

The project maintains an extensive automated testing suite covering unit logic, integration routes, RLS parity, security invariants, and RAG grounding.

```bash
# Run the complete test suite
npm run test

# Run with coverage report
npm run test:coverage

# Run TypeScript static analysis
npm run typecheck
```

### Verified Test Results (Latest Run)

- **Total Test Files**: `59 passed (1 skipped)`
- **Total Tests**: `537 passed (7 skipped)`
- **TypeScript Errors**: `0 errors`
- **Production Bundle Build**: `Success (Built in 1.44s)`

---

## 17. Local Development Setup

### Prerequisites

- Node.js `22.x` or `24.x`
- npm `10.x` or `11.x`
- Flutter SDK `3.x` (for mobile app development)
- Docker & Docker Compose (optional, for local PostgreSQL + PostGIS)

### 1. Clone & Install

```bash
git clone https://github.com/Bajiyadav/property-pioneer-dev.git
cd property-pioneer-dev
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Application
PORT=5173
API_BASE_URL=http://localhost:5173

# Database (PostgreSQL 16)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/seedha_dev

# Authentication
JWT_SECRET=your-secure-local-jwt-secret-key-32-chars-min

# AWS Configuration (Optional for local dev, uses mock fallbacks if omitted)
AWS_REGION=ap-south-1
S3_PUBLIC_MEDIA_BUCKET=seedha-properties-public-media-staging
S3_PRIVATE_DOCS_BUCKET=seedha-properties-private-docs-staging
```

### 3. Start Development Server

```bash
# Start Web application
npm run dev

# Start Flutter mobile app (in another terminal)
cd apps/mobile
flutter run -d chrome # or flutter run -d android / ios
```

---

## 18. AWS Staging & Production Deployment Roadmap

The migration to self-managed AWS is structured in 12 controlled, non-destructive phases:

1. **Phase 1 (Completed)**: Build and test native backend layer (`src/server/`, `/api/v2/*`).
2. **Phase 2 (In Progress)**: Provision AWS Staging infrastructure via CloudFormation (`infra/staging-stack.yaml`).
3. **Phase 3**: Execute non-destructive schema migration (`001_initial_schema.sql`) on AWS RDS PostgreSQL 16.
4. **Phase 4**: Clone media assets and documents to AWS S3 staging buckets.
5. **Phase 5**: Point staging Flutter and Web builds to staging ALB endpoint.
6. **Phase 6**: Execute automated security, IDOR, and concurrency benchmarks against staging RDS.
7. **Phase 7**: Provision production AWS infrastructure in `ap-south-1`.
8. **Phase 8**: Perform final delta database sync from Supabase to RDS.
9. **Phase 9**: Switch Route 53 DNS records for `seedhaproperties.com`.
10. **Phase 10**: Monitor CloudWatch logs, error rates, and RDS CPU metrics for 72 hours.
11. **Phase 11**: Archive Supabase database backups.
12. **Phase 12**: Decommission Supabase project once stability is proven.

---

## 19. Backup, Disaster Recovery & Rollback Procedure

### Zero-Downtime Rollback Strategy

Because the current production environment (**Vercel + Supabase**) remains 100% untouched and active throughout the entire staging and migration validation process:

- **Instant Rollback**: If any anomaly is detected during production DNS cutover, Route 53 / DNS records will be pointed back to Vercel in **< 60 seconds**.
- **Automated Backups**: RDS PostgreSQL has point-in-time recovery (PITR) enabled with 7-day automated snapshot retention.
- **S3 Versioning**: S3 media and document buckets use Object Versioning to prevent accidental deletions.

---

## 20. Observability & Monitoring

### Planned Monitoring Metrics (AWS CloudWatch)

- **Application Logs**: Centralized JSON logs emitted by ECS tasks to `/ecs/seedha-backend`.
- **ALB Metrics**: Request count, HTTP 4xx/5xx error rates, target response time.
- **RDS Performance Insights**: CPU utilization, database connections, IOPS, and slow query logging.
- **Health Probing**: ALB target group actively polls `GET /api/health` every 15 seconds.

---

## 21. Legal, Compliance & Policy Framework

The platform includes dedicated, verified public legal policy routes:

- **Privacy Policy**: Data handling, PostGIS location anonymization, and user rights.
- **Terms of Service**: Direct-owner listing policies and zero-brokerage guarantees.
- **Refund Policy**: Contact pass monetization and listing boost policies.
- **Moderation Policy**: 8-point property verification rules and anti-fraud declarations.

---

## 22. Repository Structure

```
property-pioneer-dev/
├── apps/
│   └── mobile/                  # Flutter 3.x cross-platform mobile app
│       ├── lib/                 # Dart source (features, services, providers)
│       └── pubspec.yaml         # Flutter dependencies
├── infra/                       # AWS Infrastructure & Deployment
│   ├── Dockerfile               # Multi-stage production container build
│   └── cloudformation/          # AWS CloudFormation staging stack
├── scripts/
│   ├── migrations/              # 001_initial_schema.sql (RDS PostGIS DDL)
│   ├── benchmark-concurrency.mjs# Concurrency & latency testing script
│   └── scan-supabase-dependencies.mjs # Dependency audit scanner
├── src/
│   ├── app/                     # TanStack Start root layouts and navigation
│   ├── lib/                     # Client adapters and utilities (api-client.ts)
│   ├── modules/                 # Feature modules (properties, auth, admin, AI)
│   ├── routes/                  # File-based TanStack Router pages and API routes
│   │   └── api/
│   │       └── v2/              # Native REST API endpoints
│   └── server/                  # Native backend core (db, cache, auth, storage, email)
├── tests/                       # 537+ automated unit, integration, and security tests
├── package.json                 # Node dependencies and project scripts
└── README.md                    # Master Project Documentation
```

---

## 23. Master Roadmap & Pending Milestones

### 🚧 In Progress

- [ ] Configure local AWS CLI credentials (`aws configure`) for `ap-south-1`.
- [ ] Deploy CloudFormation staging stack (`infra/cloudformation/staging-stack.yaml`).
- [ ] Run `001_initial_schema.sql` against staging RDS PostgreSQL.
- [ ] Execute `npm run benchmark` against the live RDS staging endpoint.

### ⏳ Planned

- [ ] Perform S3 media sync from legacy Supabase storage.
- [ ] Conduct end-to-end load test (1,000 concurrent virtual users).
- [ ] Complete SES domain DNS verification for `seedhaproperties.com`.
- [ ] Execute production DNS cutover.
- [ ] Decommission Supabase runtime dependency.

---

## 24. Strict Project Constraints

1. **Homepage Integrity**: The approved homepage design, layout, colors, copy, and navigation must never be modified during backend refactoring.
2. **Location-First Gating**: The mandatory **State ➔ City** flow must remain strictly enforced across all platforms.
3. **No Secrets in Code**: Credentials, JWT secrets, and AWS keys must never be committed to Git or embedded in client bundles.
4. **No AWS App Runner**: Target compute infrastructure is strictly **AWS ECS with AWS Fargate**.
5. **Zero Downtime**: The existing production environment (Vercel + Supabase) must remain operational until AWS staging is fully validated.

---

<div align="center">
  <b>Seedha Properties</b> • Direct Owner Real Estate Platform<br>
  Built with ❤️ for Indian Home Seekers and Property Owners.
</div>
