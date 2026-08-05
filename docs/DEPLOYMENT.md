# Urban Rental Flats (URF) — Deployment & Operations Guide

## Development Environment Setup

### Prerequisites:
- Node.js >= v20.0.0
- npm >= v10.0.0 (or Bun / Yarn)
- Git

### Quickstart:
```bash
# 1. Clone repository
git clone https://github.com/Bajiyadav/property-pioneer-dev.git
cd property-pioneer-dev

# 2. Install dependencies
npm install

# 3. Configure environment variables (.env)
cp .env.example .env

# 4. Start local development server
npm run dev
```

---

## Environment Variables

| Variable Name | Required | Scope | Description |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Client + Server | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Client + Server | Supabase publishable / anon API key |
| `SUPABASE_URL` | Yes | Server | Supabase project URL (SSR) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (Server) | Server Only | Supabase Service Role Key (Bypasses RLS) |
| `VITE_TURNSTILE_SITE_KEY` | Optional | Client | Cloudflare Turnstile public site key |
| `TURNSTILE_SECRET_KEY` | Optional | Server | Cloudflare Turnstile secret key |
| `VITE_FEATURES` | Optional | Client + Server | Feature flag override string (e.g. `owner.upload,customer.mapView`) |

---

## Build & Deployment Process

### Build Command:
```bash
npm run build
```
Vite executes `@tanstack/router-plugin` code generation, compiles TypeScript components, bundles CSS via `@tailwindcss/vite`, and outputs SSR server entry artifacts powered by **Nitro** (`3.0.260603-beta`).

---

## Hosting Platform Configurations

### 1. Vercel Deployment:
- **Framework Preset**: TanStack Start / Vite
- **Build Command**: `npm run build`
- **Output Directory**: `.output` (Nitro engine default)
- **Node.js Version**: `20.x`

### 2. Cloudflare Pages / Workers (Nitro Engine):
- Configure Nitro preset: `NITRO_PRESET=cloudflare-pages`
- Provision environment variables in Cloudflare Dashboard under **Settings > Environment Variables**.

---

## Supabase Database Migrations & Production Provisioning

1. Initialize Supabase CLI:
   ```bash
   npx supabase db push
   ```
2. Migrations located in `supabase/migrations/` will execute sequentially to create custom types, tables, RLS policies, column grants, triggers, and functions.
3. Seed initial admin user:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('<SUPABASE_USER_UUID>', 'admin');
   ```

---

## Operations, Rollbacks & Disaster Recovery

- **Rollback Strategy**: Deployments are immutable. If a production build fails, trigger a instant rollback to the previous deployment ID in Vercel/Cloudflare Pages dashboard.
- **Database Backup Strategy**: Automated Point-in-Time Recovery (PITR) enabled on Supabase Postgres with daily logical backups stored in encrypted S3 buckets.
- **Disaster Recovery RTO/RPO**: Recovery Time Objective (RTO) < 15 minutes; Recovery Point Objective (RPO) < 5 minutes.
