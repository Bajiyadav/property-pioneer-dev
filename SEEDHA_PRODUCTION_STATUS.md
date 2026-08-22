# Seedha Properties — Production Status

**Date:** 2026-08-22 · **Branch:** `main`

Every row below is backed by something that was actually run or read in this
repository or against the live Supabase project. Anything not verified is marked
as such rather than assumed. Items reached through phases of the audit that could
not be executed here are listed under _Not verified_ at the end — they are not
counted as done.

## What tooling was actually available

| Assumed by the brief  | Reality                                                                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase Postgres MCP | **Not registered** for this session (`mcpServers` is empty). Database facts below came from the Supabase REST API with the publishable key, plus reading the migration files. |
| Chrome DevTools MCP   | Not available. Playwright is installed with Chromium and was used for E2E instead.                                                                                            |
| Flutter/Dart MCP      | Not available. The Flutter CLI was used directly.                                                                                                                             |
| GitHub MCP            | Not available. `git` and the existing workflow files were read directly.                                                                                                      |

Applying migrations to production was **blocked by the environment's permission
classifier**, so every migration written here is committed but **not applied**.
They apply on merge through `supabase db push` in `.github/workflows/cd.yml`.

---

## Security

| Area          | Feature                                                                  | Status                 | Evidence                                                                                                                                                                               | Action                                                                                                                                         | Cost | Priority |
| ------------- | ------------------------------------------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---- | -------- |
| Secrets       | Gemini API key was published in the browser bundle                       | 🔧 FIXED IN CODE       | Key found verbatim in `.output/public/assets/client-*.js`; Vite inlines every `VITE_`-prefixed var into `import.meta.env` client-side regardless of use                                | Key removed from `.env`/`.env.example`; call moved behind `/api/ai/chat`. **Rebuild verified clean.** Owner must still REVOKE the exposed key  | 🟡   | **P0**   |
| Authorization | Any user could grant themselves admin over every listing                 | 🔧 FIXED IN CODE       | `authenticated` held table-level UPDATE on all `profiles` columns + self-row RLS ⇒ user writes own `profiles.role`; `20260817140100` trusted that column in a properties UPDATE policy | `20260822170000` revokes table-wide UPDATE, re-grants 5 self-service columns, moves authz to `user_roles` via `is_admin()`/`caller_has_role()` | 🟢   | **P0**   |
| API           | `search_properties_in_bounds` leaked all columns of all listings to anon | 🔧 FIXED IN CODE       | `SECURITY DEFINER` + `SELECT *` + no `is_approved` filter + EXECUTE defaults to PUBLIC ⇒ `owner_phone` (normally 42501) and unapproved rows exposed                                    | Function dropped; bounds filtering moves to PostgREST on approximate columns so RLS applies                                                    | 🟢   | **P0**   |
| Privacy       | Exact property coordinates                                               | ✅ DONE                | `latitude`/`longitude`/`location` deliberately ungranted; public reads use generated `approx_latitude`/`approx_longitude` rounded to ~110 m                                            | —                                                                                                                                              | 🟢   | P1       |
| Secrets       | No hardcoded credentials in source                                       | ✅ DONE                | Scan of `src/` + `apps/mobile/lib/` clean; `src/config/env.ts:55` actively rejects a service-role key on the client                                                                    | —                                                                                                                                              | 🟢   | P1       |
| Env           | No dev endpoints shipped                                                 | ✅ DONE                | No `localhost`/`127.0.0.1` in `src/` or `apps/mobile/lib/`                                                                                                                             | —                                                                                                                                              | 🟢   | P1       |
| Profiles RLS  | Row isolation                                                            | ✅ DONE (pre-existing) | `20260822160000` + 208 passing tests                                                                                                                                                   | Preserved, not weakened — this work narrows columns only                                                                                       | 🟢   | P0       |

## Database

| Area       | Feature                                   | Status                  | Evidence                                                                                                                          | Action                       | Cost | Priority |
| ---------- | ----------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---- | -------- |
| Migrations | Subdirectory migrations are never applied | ✅ DOCUMENTED + GUARDED | CLI reads only top-level `supabase/migrations/*.sql`; `migration_hygiene.test.ts` fails the build if a new one appears nested     | —                            | 🟢   | P1       |
| Migrations | Column added without a grant              | ✅ GUARDED              | `properties` uses column-level grants; test asserts every selected column is both declared and granted                            | —                            | 🟢   | P1       |
| Schema     | `media_notes` missing on production       | 🔧 FIXED IN CODE        | Column returns 42703; declared in `20260817140100`, which was edited **after** it had already been applied, so the edit never ran | Re-added in `20260822170000` | 🟢   | P1       |
| Schema     | Location columns                          | 🔧 NOT APPLIED          | `latitude`/`longitude`/`approx_*` all return 42703                                                                                | Applies on merge via CD      | 🟢   | P1       |

## Application correctness

| Area          | Feature                                 | Status               | Evidence                                                                                                            | Action                                                                                                                       | Cost | Priority |
| ------------- | --------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---- | -------- |
| Build         | Web typecheck + build                   | ✅ PASS              | `tsc --noEmit` exit 0; `npm run build` exit 0                                                                       | Was **failing** on arrival (2 errors in the map work)                                                                        | 🟢   | P0       |
| Lint          | ESLint                                  | ✅ PASS              | 0 errors, 0 warnings                                                                                                | Was 3 errors on arrival                                                                                                      | 🟢   | P2       |
| Tests         | Unit/integration                        | ✅ PASS              | **208 passed**, 4 skipped, 31 files                                                                                 | Up from 194                                                                                                                  | 🟢   | P0       |
| List Property | Stale draft must not skip Step 1        | ✅ VERIFIED + LOCKED | Step derives from URL search params only; draft prefills values, never the step                                     | Logic extracted to `resolveInitialStep.ts` and tested against the real implementation (the old test asserted an inline copy) | 🟢   | **P0**   |
| AI            | Must not fabricate                      | ✅ DONE              | Proxy returns `{unconfigured:true}` when no key; caller falls back to a local response engine rather than inventing | —                                                                                                                            | 🟢   | P1       |
| AI            | `extractTenantPreferences` never worked | 🔧 FIXED IN CODE     | URL used an escaped template literal, sending the literal `${apiKey}`; every call 401'd and returned `{}`           | Now goes through the proxy                                                                                                   | 🟢   | P2       |

## Mobile

| Area    | Feature                | Status    | Evidence                                                                          | Action                                       | Cost | Priority |
| ------- | ---------------------- | --------- | --------------------------------------------------------------------------------- | -------------------------------------------- | ---- | -------- |
| Flutter | Static analysis        | ✅ PASS   | `flutter analyze` → **No issues found**                                           | —                                            | 🟢   | P1       |
| Flutter | Tests                  | ✅ PASS   | `flutter test` → **10/10**                                                        | —                                            | 🟢   | P1       |
| Android | Release APK            | ✅ PASS   | `flutter build apk --release` exit 0 → **66.3 MB**                                | —                                            | 🟢   | P0       |
| Android | Release AAB            | ✅ PASS   | `flutter build appbundle --release` exit 0 → **61 MB**                            | —                                            | 🟢   | P1       |
| Android | Signing for Play Store | 🟡 MANUAL | Release build uses the default/debug signing config unless a keystore is supplied | Create an upload keystore; add to CI secrets | 🟡   | P1       |

## End-to-end (Playwright)

`playwright.config.ts` has no `webServer` block and `baseURL` defaults to
`https://property-pioneer-dev.vercel.app`, so an unqualified `npx playwright test`
runs against the **deployed site**, not local changes. Set `E2E_BASE_URL` to test
what you just wrote. Every failure below was attributed by re-running the same
test against production, which contains none of these changes.

| Run                                                         | Result                                                                                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Full suite (298 tests) vs localhost, **before** these fixes | 246 passed · **30 failed** · 2 flaky · 20 skipped (25 min)                                                             |
| `responsive.spec.ts` desktop, before                        | **25 failed**                                                                                                          |
| `responsive.spec.ts` desktop, after                         | **56 passed · 4 failed**                                                                                               |
| `smoke.spec.ts` vs production                               | 54 passed · 4 failed — real live-site defects (footer claimed "Zero Brokerage Forever" / "100% verified transparency") |
| `smoke.spec.ts --grep "product focus"` vs localhost, after  | **8 passed** ✅                                                                                                        |
| `auth-lifecycle --grep rejected` vs localhost, after        | **2 passed** ✅                                                                                                        |

### Layout defects found and fixed (all reproduced on production first)

| Defect                                              | Evidence                                                                                                                        | Fix                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| ~6px horizontal overflow on **every page at 320px** | `326px content in 320px viewport`; header action group was `shrink-0` with a `whitespace-nowrap` CTA, so nothing could compress | Base-breakpoint spacing only (`gap`, `px`); every `sm:` value untouched           |
| 37px overflow at **1024px**                         | Full nav renders at exactly `lg` (1024px) and does not fit                                                                      | Nav link padding tightened between `lg` and `xl`, full spacing restored at 1280px |
| Primary CTA touch target 28px                       | `Received: 28`, below the 32px minimum — reproduced on production                                                               | `py-2` → 32px                                                                     |

### Still failing (pre-existing, not addressed)

- `responsive.spec.ts:249` similar-property cards — 4 widths, locator timeout; the
  detail page under test renders no similar properties. Reproduced on production.
- `auth-lifecycle` role flows and `rental-journey` — slow real-auth flows that
  fail intermittently. Known pre-existing flakiness; **not** claimed as passing.

⚠️ Running the E2E suite performs hundreds of real Supabase sign-ins and will
rate-limit the Auth endpoint. The unit suite's live-auth tests fail with
`AuthRetryableFetchError` for a few minutes afterwards — wait before trusting a
unit run that follows an E2E run.

## Requires external configuration (cannot be done from code)

| Item                                            | Why                                                                                                       | Cost | Priority |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---- | -------- |
| **Revoke the exposed Gemini API key**           | It was in the public bundle of every build made while `VITE_GEMINI_API_KEY` was set; treat as compromised | 🟡   | **P0**   |
| Rotate the Supabase DB password                 | Was pasted into a chat transcript earlier and never rotated                                               | 🟡   | **P0**   |
| Apply the pending migrations                    | Direct application blocked here; CD applies on merge                                                      | 🟡   | **P0**   |
| `VERCEL_TOKEN`                                  | CD cannot deploy without it                                                                               | 🟡   | P1       |
| `VITE_GOOGLE_MAPS_API_KEY`                      | Maps render nothing without it; must be HTTP-referrer restricted                                          | 🟡   | P1       |
| `GEMINI_API_KEY` (server, unprefixed) in Vercel | AI falls back to local responses until set                                                                | 🟡   | P1       |
| Turnstile / Resend / Razorpay keys              | Bot protection, email, payments inert until configured                                                    | 🟡   | P1       |
| Play Store account                              | Required to publish the AAB                                                                               | 🔴   | P2       |

## Not verified

These were in the brief but were **not** executed here, and are not claimed:

- Phases 2–4 end-to-end journeys (rent/buy/commercial search → enquiry → visit) beyond what the Playwright suite covers
- Phase 6 lifecycle transitions and Phase 7 moderation workflows, beyond the RLS and schema fixes above
- Phase 11 map behaviour on a real device (no Maps key configured)
- Phase 15 deep links (needs a physical device and `assetlinks.json` hosted on the domain)
- Phase 16 storage bucket policies
- Phase 18 error monitoring — no Sentry or equivalent found configured
- Phase 24 backup/restore drill
