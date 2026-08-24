# Key rotation & configuration checklist

Reset (rotate) every secret, then paste each new value into **all** of its
destinations. `.env.example` is the complete variable reference; this is the
"where to regenerate → where to paste → how to verify" guide.

Destinations: **local** = your `.env` · **host** = Vercel/Cloudflare env vars ·
**ci** = GitHub → Settings → Secrets and variables → Actions · **sb** = Supabase
dashboard. After host/ci changes, redeploy for them to take effect.

> Never paste a real key value into git, a chat, or `.env.example`.

---

## 🔑 Secrets to rotate

| # | Secret | Regenerate at | Paste into |
|---|--------|---------------|-----------|
| 1 | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → *Reset* service_role | local · host |
| 2 | `SUPABASE_ACCESS_TOKEN` | Supabase → Account → Access Tokens | local (tooling) |
| 3 | `SUPABASE_DB_URL` / `DATABASE_URL` / `DIRECT_URL` | Supabase → Project Settings → Database → *Reset database password* → copy the URI | ci (`SUPABASE_DB_URL`) · local |
| 4 | `GEMINI_API_KEY` | Google AI Studio → API keys | local · host |
| 5 | `RESEND_API_KEY` | Resend → API Keys (+ keep the sending domain verified) | local · host |
| 6 | `RAZORPAY_KEY_SECRET` (+ `RAZORPAY_KEY_ID`) | Razorpay → Settings → API Keys → *Regenerate* | local · host |
| 7 | `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → *Roll* | local · host |
| 8 | `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → your endpoint → Signing secret | local · host |
| 9 | `TURNSTILE_SECRET_KEY` (+ `VITE_TURNSTILE_SITE_KEY`) | Cloudflare → Turnstile → your widget | local · host |
| 10 | `WHATSAPP_ACCESS_TOKEN` (+ `WHATSAPP_PHONE_NUMBER_ID`) | Meta for Developers → WhatsApp → API Setup | host (+ local to test) |
| 11 | `VERCEL_TOKEN` | Vercel → Account → Tokens | ci |
| 12 | `UPTIMEROBOT_API_KEY` | UptimeRobot → My Settings → API | local (+ ci if scripted) |
| 13 | `QA_*_PASSWORD` | reset each QA account's password in Supabase Auth | local · ci |

**Public (rotate only if compromised, and no code change needed):**
`VITE_SUPABASE_PUBLISHABLE_KEY` (Supabase anon key), `VITE_GOOGLE_MAPS_API_KEY`
(restrict by HTTP referrer at Google Cloud), `VITE_SENTRY_DSN`, `RAZORPAY_KEY_ID`.

---

## Add in Vercel (host)

```bash
# one per secret, for each environment you use (production/preview)
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add GEMINI_API_KEY production
vercel env add RESEND_API_KEY production
vercel env add RAZORPAY_KEY_ID production
vercel env add RAZORPAY_KEY_SECRET production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add VITE_TURNSTILE_SITE_KEY production
vercel env add TURNSTILE_SECRET_KEY production
vercel env add WHATSAPP_PHONE_NUMBER_ID production
vercel env add WHATSAPP_ACCESS_TOKEN production
# then redeploy
```

## Add in GitHub Actions (ci)

`SUPABASE_DB_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`,
`PRODUCTION_URL`, `E2E_BASE_URL`, and the build-time `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_APP_URL`.

---

## Verify after rotation

- **Build guard** — `npm run build` (and `src/config/env.ts`) fails if any secret
  was accidentally given a `VITE_` prefix.
- **Supabase** — app loads, sign-in works, `/admin` opens.
- **Email/OTP** — request a login code; it should arrive (needs `RESEND_API_KEY`
  or Supabase SMTP configured).
- **AI** — Seedha AI responds (falls back to a local engine if `GEMINI_API_KEY`
  is unset).
- **Payments** — a plan checkout opens (Razorpay/Stripe keys present).
- **CD** — a push to `main` runs the pipeline; the migration step needs
  `SUPABASE_DB_URL`, the deploy step needs `VERCEL_TOKEN`.
