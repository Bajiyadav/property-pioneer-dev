# Urban Rental Flats (URF) — Platform Architecture

## High-Level Architecture

Urban Rental Flats is designed as a full-stack, modular, API-first platform built on **TanStack Start** (React 19 + Vite 8 + Nitro) and **Supabase** (Postgres + Auth).

```mermaid
graph TD
    Client[Browser / Client App] <--> Router[TanStack React Router]

    subgraph Frontend Layer
        Router <--> ReactQuery[TanStack React Query Cache]
        Router <--> LocalStorage[localStorage: nestwise:favorites]
    end

    subgraph TanStack Start Meta-Framework
        Router <--> ServerFn[TanStack Server Functions: createServerFn]
        Router <--> API[Public REST API: /api/public/enquiries]
    end

    subgraph Middleware & Security Primitives
        ServerFn --> AuthAttacher[Client Middleware: auth-attacher.ts]
        AuthAttacher --> AuthMiddleware[Server Middleware: requireSupabaseAuth]
        AuthMiddleware --> RBAC[assertAdmin Guard]

        API --> AntiAbuse[Security Engine: rate-limit, honeypot, timer, Turnstile]
    end

    subgraph Supabase Database & Auth Layer
        RBAC --> AdminClient[supabaseAdmin: Service Role Key]
        AdminClient --> DB_Privileged[(Postgres DB: RLS Bypassed)]

        ReactQuery --> AnonClient[supabase: Publishable Key]
        AnonClient --> DB_Public[(Postgres DB: RLS & CLS Enforced)]
    end
```

---

## Architecture Layers

```text
  UI Layer                src/routes/*, src/components/*
        │
  Feature Switchboard     src/config/features.ts     ← Modular feature flags
  RBAC Model              src/config/rbac.ts         ← Role & permission mapping
  Platform Config         src/config/platform.ts     ← Cities, locales, SKUs
        │
  Domain Contracts        src/lib/*.ts               ← Client-safe Zod contracts & query fetchers
  Server-Only Libs        src/lib/*.server.ts        ← Privileged admin & security primitives
        │
  API Surface             src/routes/api/public/*    ← External/unauthenticated REST routes
                          createServerFn             ← App-internal RPC functions
        │
  Data & Security         Postgres + RLS + CLS (Supabase)
```

---

## Rendering Strategy (SSR vs CSR)

- **Server-Side Rendering (SSR)**: Handled by TanStack Start via Nitro engine (`src/server.ts`). Initial HTML is pre-rendered with head metadata, OpenGraph tags, canonical links, and `Residence` JSON-LD structured data.
- **Client-Side Hydration (CSR)**: React 19 hydrates client-side navigation. Subsequent page transitions use TanStack Router client-side routing and TanStack Query state caching.
- **Dynamic Loaders**: Route `loader` functions (`properties.$id.tsx`) use `context.queryClient.ensureQueryData` to fetch data during SSR pre-rendering.

---

## Authentication Architecture & Diagram

Authentication utilizes Supabase Auth with JWT access tokens passed via HTTP `Authorization: Bearer <token>` headers.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant AuthPage as /auth Route
    participant SupabaseAuth as Supabase Auth Service
    participant ClientStorage as Browser LocalStorage
    participant RPC as Server Function RPC
    participant ServerMiddleware as requireSupabaseAuth Middleware
    participant AdminServer as admin.server.ts Loader

    User->>AuthPage: Submit Credentials (email, password)
    AuthPage->>SupabaseAuth: signInWithPassword({ email, password })
    SupabaseAuth-->>AuthPage: Return Auth Session & JWT Token
    AuthPage->>ClientStorage: Persist Access Token

    User->>RPC: Request Admin Action (e.g. getAdminOverview)
    Note over RPC: attachSupabaseAuth adds header<br/>Authorization: Bearer <token>
    RPC->>ServerMiddleware: Intercept Request
    ServerMiddleware->>SupabaseAuth: getClaims(token)
    alt Token Valid
        ServerMiddleware->>RPC: Attach userId & client to Context
        RPC->>AdminServer: Invoke loader with Context
        AdminServer-->>User: Return Data Payload
    else Token Invalid / Missing
        ServerMiddleware-->>User: HTTP 401 Unauthorized Error
    end
```

---

## API Architecture & Diagram

Public API endpoints handle data validation and multi-layered anti-abuse enforcement before persisting data via the Supabase Service Role client.

```mermaid
sequenceDiagram
    autonumber
    actor Client as External Client / Browser
    participant API as POST /api/public/enquiries
    participant Zod as Zod Schema Validator
    participant Security as Security Primitives (security.server.ts)
    participant Turnstile as Cloudflare Turnstile Verification
    participant DB as Postgres Database (via supabaseAdmin)

    Client->>API: Send Enquiry Payload JSON
    API->>Zod: Validate Input Format & Types
    alt Validation Failed
        Zod-->>Client: HTTP 400 Bad Request (Error Details)
    else Validation Passed
        API->>Security: Check Honeypot Field (`company`)
        alt Honeypot Filled (Bot Detected)
            Security-->>Client: HTTP 200 OK (Silent Accept)
        else Honeypot Empty
            API->>Security: Check Submit Timer (`elapsedMs >= 2500`)
            alt Timer Too Fast
                Security-->>Client: HTTP 400 Bad Request ("Too quick")
            else Timer Passed
                API->>Turnstile: Verify CAPTCHA Token
                alt CAPTCHA Failed
                    Turnstile-->>Client: HTTP 403 Forbidden
                else CAPTCHA Passed
                    API->>Security: Evaluate 5 Sliding Window Rate Limits
                    alt Rate Limit Exceeded
                        Security-->>Client: HTTP 429 Too Many Requests
                    else Rate Limit Passed
                        API->>DB: Check Property Existence & `is_approved = true`
                        API->>DB: INSERT into `enquiries` table
                        API->>DB: INSERT into `audit_logs` table
                        DB-->>Client: HTTP 201 Created ({ ok: true })
                    end
                end
            end
        end
    end
```

---

## Admin Dashboard Architecture & Diagram

Admin access is protected by double-verification: session check in route layout and role query in `user_roles`.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Platform Admin
    participant Route as /_authenticated/admin Route
    participant Guard as _authenticated/route.tsx (beforeLoad)
    participant Dashboard as AdminDashboard Component
    participant CheckRPC as checkIsAdmin ServerFn
    participant DataRPC as getAdminProperties ServerFn
    participant DB as Postgres DB (user_roles / properties)

    Admin->>Route: Navigate to /admin
    Route->>Guard: Execute beforeLoad
    Guard->>DB: supabase.auth.getUser()
    alt Not Authenticated
        Guard-->>Admin: Redirect to /auth
    else Authenticated
        Guard->>Dashboard: Mount Component
        Dashboard->>CheckRPC: Execute checkIsAdmin()
        CheckRPC->>DB: SELECT role FROM user_roles WHERE user_id AND role='admin'
        alt Role = admin
            CheckRPC-->>Dashboard: { isAdmin: true }
            Dashboard->>DataRPC: Execute getAdminProperties()
            DataRPC->>DB: Query properties via supabaseAdmin
            DataRPC-->>Dashboard: Return property list
            Dashboard-->>Admin: Display Overview & Property Table
        else Role != admin
            CheckRPC-->>Dashboard: { isAdmin: false }
            Dashboard-->>Admin: Display Access Denied Card
        end
    end
```

---

## Property Listing Flow & Diagram

Public property browsing enforces Column-Level Security (CLS) to prevent exposure of owner contact data.

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Anonymous Visitor
    participant BrowsePage as /properties Page
    participant Query as fetchProperties()
    participant PublicSupabase as Supabase Client (Publishable Key)
    participant Postgres as Postgres DB (properties table)

    Visitor->>BrowsePage: Load Browse Page
    BrowsePage->>Query: Call fetchProperties()
    Query->>PublicSupabase: select(PUBLIC_COLUMNS).eq("is_approved", true)
    Note over PublicSupabase,Postgres: Column-Level Security prevents reading<br/>owner_name, phone, whatsapp, email
    PublicSupabase->>Postgres: Query approved properties
    Postgres-->>Query: Return public columns (title, price, city, images...)
    Query-->>BrowsePage: Cache in TanStack Query & Return Array
    BrowsePage-->>Visitor: Render Filter Controls & Property Card Grid
```

---

## Folder Architecture

```text
src/
├── config/             # Platform Switchboard, Feature Flags, RBAC Matrix
├── integrations/       # Supabase Client/Server connectors, Auth Middleware
├── lib/                # Domain models, security primitives, server functions
├── components/         # Brand components, Property cards, UI primitives (Radix)
└── routes/             # TanStack Router pages, layouts, REST endpoints
```
