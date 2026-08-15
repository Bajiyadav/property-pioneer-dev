# Urban Rental Flats (URF) — Property Connect Hub

[![Framework](https://img.shields.io/badge/Framework-TanStack_Start-FF4154?style=flat-square&logo=react)](https://tanstack.com/start)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Database](https://img.shields.io/badge/Database-Supabase_Postgres-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

**Urban Rental Flats (URF)** is a full-stack, modular, API-first real-estate platform designed to connect home seekers across India with curated rental and sale properties.

Built with **TanStack Start**, **React 19**, **Vite 8**, and **Supabase**, the platform combines Server-Side Rendering (SSR) for speed and SEO with robust database-level security (Row & Column Level Security), anti-abuse protections, and an authenticated administrative control panel.

---

## 🌟 Key Features

### Customer Experience (Public)

- 🔍 **Real-Time Property Search**: Instant in-memory filtering by city, price range, bedrooms (BHK), listing type (Rent/Sale), and search keywords.
- 🏡 **Rich Property Detail Pages**: Multi-image photo gallery, specs overview, pricing formatting (Lakhs/Crores for sale, monthly for rent), and `Residence` JSON-LD structured data.
- ❤️ **Saved Homes Wishlist**: Bookmark favorite listings stored locally in the browser (`localStorage`).
- 📩 **Protected Lead Enquiry Form**: Direct owner contact form backed by honeypot fields, minimum submission timing checks, Turnstile CAPTCHA, and 5 sliding-window rate limits.

### Admin Dashboard (`/_authenticated/admin`)

- 📊 **Platform Overview Metrics**: Track total listings, pending approvals, featured properties, and 7-day enquiry activity.
- ✅ **Listing Moderation**: Toggle approval (`is_approved`) and featured (`is_featured`) status for any property listing.
- 📥 **Customer Leads Inbox**: Review customer messages, phone numbers, and target property details.
- 🛡️ **Security Audit Logs**: Track security events (`enquiry.created`, `enquiry.rate_limited`, `enquiry.rejected`) and IP addresses.

---

## 🛠️ Tech Stack & Architecture

- **Frontend Core**: React 19, TypeScript, Lucide React, Radix UI Primitives, Sonner Toasts.
- **Meta-Framework**: TanStack Start (SSR), TanStack React Router (Type-Safe File-Based Routing), Nitro Engine.
- **Data Caching & RPC**: TanStack React Query, TanStack Start `createServerFn` RPC endpoints.
- **Database & Auth**: Supabase (Postgres), Row-Level Security (RLS), Column-Level Security (CLS), Supabase Auth JWTs.
- **Security & Anti-Abuse**: Cloudflare Turnstile, Postgres Sliding-Window Rate Limiter, Honeypot, Timing Protections.

---

## 📁 Repository Structure

```text
property-pioneer-dev/
├── docs/                      # Comprehensive platform documentation
│   ├── PROJECT_ANALYSIS.md    # Codebase audit & project structure analysis
│   ├── ARCHITECTURE.md        # System architecture & Mermaid diagrams
│   ├── DATABASE.md           # ER diagram, table schemas, RLS & CLS policies
│   ├── API.md                 # REST endpoints & server functions reference
│   ├── COMPONENTS.md          # React component tree & props documentation
│   ├── AUTHENTICATION.md      # Auth/RBAC flows & security primitives
│   ├── DEPLOYMENT.md          # Operations, build & hosting deployment guide
│   ├── SECURITY.md            # Security review & vulnerability audit
│   ├── PERFORMANCE.md         # Core Web Vitals & performance optimization
│   └── SUMMARY.md             # Health scores, recommendations & scalability
├── supabase/
│   └── migrations/            # SQL migration scripts (Tables, RLS, Functions)
├── src/
│   ├── config/                # Feature flags, platform constants, RBAC matrix
│   ├── integrations/supabase/ # Supabase client/admin instances & auth middleware
│   ├── lib/                   # Domain queries, security primitives, server functions
│   ├── components/            # Brand components, PropertyCard, Radix UI primitives
│   └── routes/                # File-based TanStack Router pages & API routes
├── ARCHITECTURE.md
├── TODO.md
├── CHANGELOG.md
├── package.json
└── vite.config.ts
```

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites

- Node.js >= v20.0.0
- npm >= v10.0.0

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/Bajiyadav/property-pioneer-dev.git
cd property-pioneer-dev

# Install dependencies
npm install
```

### 3. Environment Variables (`.env`)

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Optional Cloudflare Turnstile CAPTCHA keys
VITE_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 Documentation

For in-depth architectural specifications and subsystem guides, explore the [`/docs`](./docs) directory:

- [System Architecture](./docs/ARCHITECTURE.md)
- [Database Schema & ER Diagram](./docs/DATABASE.md)
- [API & Server Functions](./docs/API.md)
- [Security Review](./docs/SECURITY.md)
- [Performance Review](./docs/PERFORMANCE.md)

---

## 📜 License

This project is licensed under the MIT License.
