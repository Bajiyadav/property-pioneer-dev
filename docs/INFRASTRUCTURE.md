# Infrastructure

## Topology

```
Browser ──> Vercel edge (SSR, TanStack Start on Nitro)
                │
                ├─ server functions ──> Supabase Postgres (RLS)
                │                        Supabase Auth (GoTrue)
                │                        Supabase Storage (property-images)
                └─ static assets ──> Vercel CDN
```

## Environments

| Env        | URL                               | Database                |
| ---------- | --------------------------------- | ----------------------- |
| local      | `localhost:8080`                  | shared Supabase project |
| preview    | per-PR `*.vercel.app`             | shared Supabase project |
| production | `property-pioneer-dev.vercel.app` | `iyttetfaavokzyexvqam`  |

> Preview and production currently share one database. Before real customer
> traffic, split them — a preview deploy can write to production data today.

## Deployment

Vercel is **CLI-deployed, not Git-connected**. `cd.yml` is the automation path;
connecting Git would double-deploy.

## Data

- `properties`, `enquiries`, `audit_logs`, `user_roles`, `profiles`, `favorites`, `notifications`
- RLS on every table; public reads limited to `is_approved = true`
- Owner PII (`owner_name/phone/email`) never granted to `anon`/`authenticated`
- Storage bucket `property-images`: public read, 5 MB cap, image MIME only

## Runtime config

Server-only: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
Client (public by construction): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_APP_URL`.
Template: `.env.example`. `.env` is gitignored.
