# Urban Rental Flats (URF) — Platform Architecture

URF is built as a modular, API-first platform. The live site is the MVP
(public browsing + enquiries); every other module on the roadmap has its
contract reserved so it can be switched on **without redesigning the UI**.

## Layers

```text
  UI (unchanged)          src/routes, src/components
        │
  Feature registry        src/config/features.ts     ← plug-and-play switchboard
  RBAC model              src/config/rbac.ts         ← roles + permissions
  Platform config         src/config/platform.ts     ← cities, locales, plans
        │
  Domain libs             src/lib/*.ts               ← client-safe contracts (zod)
  Server-only libs        src/lib/*.server.ts        ← privileged helpers
        │
  API surface             src/routes/api/public/*    ← external/unauthenticated
                          createServerFn             ← app-internal RPC
        │
  Data                    Postgres + RLS
```

## Enabling a future feature

1. Flip `enabled` in `src/config/features.ts` (or set `VITE_FEATURES=key`).
2. Guard the new surface with `isFeatureEnabled("owner.upload")`.
3. Gate the route with `hasPermission(role, "property:create")`.

Nothing in the existing theme, layout, or component tree changes.

## Security baseline (live today)

Shared primitives live in `src/lib/security.server.ts` and apply to every
write endpoint:

| Control          | Implementation                                                                     |
| ---------------- | ---------------------------------------------------------------------------------- |
| Input validation | Zod schemas shared client/server (`src/lib/enquiries.ts`)                          |
| Honeypot         | Hidden `company` field; filled → silent accept, logged                             |
| Time-to-submit   | Rejects submissions under 2.5s                                                     |
| Rate limiting    | Sliding windows in Postgres: per-IP burst/hourly/daily, per-IP+property, per-phone |
| CAPTCHA          | Cloudflare Turnstile, verified server-side; no-op until keys are set               |
| Audit logs       | `audit_logs` table, deny-all RLS, service-role only                                |
| Least privilege  | `enquiries` + `audit_logs` unreadable by anon/authenticated                        |

### Turnstile activation

Set `TURNSTILE_SECRET_KEY` (backend) and `VITE_TURNSTILE_SITE_KEY` (frontend).
Until both exist, the widget renders nothing and the server skips
verification — the rest of the anti-abuse stack still applies.

## Data model

| Table        | Access                                         | Purpose                     |
| ------------ | ---------------------------------------------- | --------------------------- |
| `properties` | anon read (approved, non-contact columns only) | Listings                    |
| `enquiries`  | service-role only                              | Customer → owner leads      |
| `audit_logs` | service-role only                              | Security + compliance trail |

Owner contact columns on `properties` are withheld from anonymous readers by
column-level grants; enquiries are the only contact path.

## Roadmap module contracts

- **Owner / Agent / Builder portals** — routes mount under an
  `_authenticated` layout; each portal reads its permission set from
  `ROLE_PERMISSIONS`. Listing lifecycle (`draft → published → rented/sold`)
  extends the existing `property_status` enum.
- **Payments** — `PLANS` and `LISTING_BOOSTS` in `platform.ts` are the SKU
  catalogue; a provider adapter (Razorpay or Stripe) plugs in behind them.
- **Communication** — email/SMS/WhatsApp/push share one dispatch contract so
  channels are additive.
- **Expansion** — cities, states, and locales are data in `platform.ts`;
  launching a city is a config change, not a deploy of new UI.

## SEO & performance

- Per-route `head()` metadata; `Residence` JSON-LD on property pages.
- `/sitemap.xml` generated from live listings; `robots.txt` references it.
- Images lazy-load; API routes are excluded from crawling.
