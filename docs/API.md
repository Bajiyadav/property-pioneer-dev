# Urban Rental Flats (URF) — API & Server Functions Reference

## REST API Endpoints

### 1. `POST /api/public/enquiries`

- **File Path**: `src/routes/api/public/enquiries.ts`
- **HTTP Method**: `POST`
- **Content-Type**: `application/json`
- **Authentication Required**: No (Public Endpoint)
- **Permissions Required**: None
- **Database Tables Used**: `properties` (SELECT), `enquiries` (INSERT, COUNT), `audit_logs` (INSERT)

#### Request Body (`EnquiryInput`):
```json
{
  "propertyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Rahul Sharma",
  "phone": "+919876543210",
  "message": "I am interested in visiting this 2BHK flat tomorrow.",
  "company": "",
  "elapsedMs": 4200,
  "turnstileToken": "0.XXXXXX..."
}
```

#### Validation Rules (Zod `enquiryInputSchema`):
- `propertyId`: Must be valid UUID string.
- `name`: String, trimmed, min length 2, max length 100.
- `phone`: String, trimmed, min 7, max 20, regex `/^[0-9+\-()\s]+$/`.
- `message`: String, trimmed, min 5, max 1000.
- `company`: Honeypot field — MUST BE EMPTY (`max(0)`).
- `elapsedMs`: Integer, non-negative, max 21,600,000 (6 hours). Min threshold required: `MIN_SUBMIT_MS = 2500`.
- `turnstileToken`: Optional string, max length 4096.

#### Anti-Abuse Checks Executed:
1. **Input Validation**: Rejects invalid payloads with HTTP 400.
2. **Honeypot Inspection**: If `company` is filled, records audit event and returns HTTP 200 `{ ok: true }` (silent accept).
3. **Timer Inspection**: If `elapsedMs < 2500`, rejects with HTTP 400 (`"That was a little too quick"`).
4. **Cloudflare Turnstile Verification**: If `TURNSTILE_SECRET_KEY` is set, verifies token with Cloudflare verification API. Rejects invalid tokens with HTTP 403.
5. **Sliding Window Rate Limits (Postgres)**:
   - `PER_IP_BURST`: Max 2 requests / 60 seconds per IP.
   - `PER_IP_HOURLY`: Max 6 requests / 3600 seconds per IP.
   - `PER_IP_DAILY`: Max 20 requests / 86400 seconds per IP.
   - `PER_IP_PROPERTY`: Max 2 requests / 86400 seconds per IP + property combination.
   - `PER_PHONE_DAILY`: Max 10 requests / 86400 seconds per phone number.
   - If limit exceeded, returns HTTP 429 `{ error: "...", retryAfterSeconds: N }` with `Retry-After` header.
6. **Property Availability Check**: Verifies target `propertyId` exists and `is_approved = true`.

#### Response Payloads:
- **Success (`HTTP 201 Created`)**:
  ```json
  { "ok": true }
  ```
- **Validation / Rate Limit Error (`HTTP 400 / 429`)**:
  ```json
  { "error": "You've sent several enquiries recently. Please try again a little later.", "retryAfterSeconds": 3600 }
  ```

---

### 2. `GET /sitemap.xml`

- **File Path**: `src/routes/sitemap[.]xml.ts`
- **HTTP Method**: `GET`
- **Authentication Required**: No (Public Endpoint)
- **Response**: `application/xml` sitemap containing canonical URLs for static routes (`/`, `/properties`, `/favorites`) and dynamic approved property URLs (`/properties/:id`).

---

## TanStack Server Functions (RPC Endpoints)

All server functions are defined in `src/lib/admin.functions.ts` using `createServerFn` and guarded by `requireSupabaseAuth` middleware.

### 1. `checkIsAdmin`
- **Method**: `GET`
- **Middleware**: `requireSupabaseAuth`
- **Description**: Verifies if the authenticated user has the `admin` role in `public.user_roles`.
- **Response**: `{ isAdmin: boolean, userId: string }`

### 2. `getAdminOverview`
- **Method**: `GET`
- **Middleware**: `requireSupabaseAuth` -> `assertAdmin`
- **Description**: Loads platform metrics overview.
- **Response**: `AdminOverview` object containing total properties, approved/pending/featured counts, rent/sale breakdown, enquiry stats, and top cities.

### 3. `getAdminProperties`
- **Method**: `GET`
- **Middleware**: `requireSupabaseAuth` -> `assertAdmin`
- **Description**: Retrieves up to 200 most recent properties for admin management.
- **Response**: Array of property objects including owner details (`owner_name`, `owner_phone`).

### 4. `getAdminEnquiries`
- **Method**: `GET`
- **Middleware**: `requireSupabaseAuth` -> `assertAdmin`
- **Description**: Retrieves up to 200 customer lead enquiries.
- **Response**: Array of enquiry objects joined with property title & city.

### 5. `getAdminAuditLogs`
- **Method**: `GET`
- **Middleware**: `requireSupabaseAuth` -> `assertAdmin`
- **Description**: Retrieves up to 100 recent security audit events from `audit_logs`.
- **Response**: Array of audit log records (event, outcome, subject, IP, timestamp).

### 6. `updateAdminProperty`
- **Method**: `POST`
- **Middleware**: `requireSupabaseAuth` -> `assertAdmin`
- **Input Validator**: Zod object `{ id: uuid(), is_approved?: boolean, is_featured?: boolean, status?: enum }`
- **Description**: Applies patch updates to a property record.
- **Response**: `{ ok: true }`

---

## Middleware Specification

### 1. `attachSupabaseAuth` (Client Middleware)
- **File**: `src/integrations/supabase/auth-attacher.ts`
- **Registration**: Registered in `start.ts` `functionMiddleware`.
- **Behavior**: Intercepts every outgoing client RPC call, fetches active Supabase session access token (`supabase.auth.getSession()`), and injects `Authorization: Bearer <token>` into request headers.

### 2. `requireSupabaseAuth` (Server Middleware)
- **File**: `src/integrations/supabase/auth-middleware.ts`
- **Behavior**: Intercepts incoming server function requests, extracts Bearer token, validates JWT claims using `supabase.auth.getClaims(token)`, extracts `userId` claim (`sub`), and provides authenticated context:
  ```ts
  context: { supabase, userId, claims }
  ```

### 3. `csrfMiddleware` (Request Middleware)
- **File**: `src/start.ts`
- **Behavior**: Protects server function RPC handlers against Cross-Site Request Forgery.

### 4. `errorMiddleware` (Request Middleware)
- **File**: `src/start.ts`
- **Behavior**: Catches unhandled server-side errors and returns clean HTML fallback error page generated by `renderErrorPage()`.
