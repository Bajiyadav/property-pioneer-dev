# Phase 6A — Production Security, Role & AI Hardening

**Date:** 2026-08-26
**Base commit:** `bca219a`
**Scope:** Geoapify key security · staff/admin role resolution · mobile Gemini release configuration · mobile AI error/retry
**Not committed, not pushed.** No database change. No migration. No RLS change. No web file changed.

---

## 1. Role architecture — before / after

### Before

Four screens each decided independently where a signed-in account should go, and they disagreed:

| Screen                                | Source                                                       |
| ------------------------------------- | ------------------------------------------------------------ |
| `login_screen.dart`                   | `user_roles` → `UserRole.admin` → `/admin-dashboard`         |
| `splash_screen.dart`                  | `employee_access` → `/admin-dashboard` or `/staff-dashboard` |
| `home_screen.dart` (dashboard button) | `user_roles`                                                 |
| `verify_email_screen.dart`            | `user_roles`                                                 |

Production state at audit time:

```
'QA admin'       user_roles=['admin']   employee_access=NONE
'QA Admin Test'  user_roles=['admin']   employee_access=admin
```

`'QA admin'` signing in was sent to `/admin-dashboard`, but every employee RLS policy and `moderate_property` call `get_employee_role()`, which reads `employee_access` and returns NULL for that account. The console opened with no authority behind it — queries returned nothing and moderation was refused. The same account cold-starting via splash went to Home instead.

### After

One resolver — `lib/services/session_router.dart` — used by all four screens.

**`employee_access` is the single authoritative staff source**, because it is the table the database itself consults. `user_roles` keeps its own separate job: what someone may do with their _own_ account (customer / owner / agent). It never grants a console.

| Situation                                                    | Destination                |
| ------------------------------------------------------------ | -------------------------- |
| `employee_access.role = admin`                               | Admin console              |
| `employee_access.role` = support / moderator / analyst / ops | Staff console              |
| No staff grant, owner, explicit sign-in                      | Owner dashboard            |
| No staff grant, owner, cold start                            | Home                       |
| Customer                                                     | Home                       |
| **Stale `user_roles = admin`, no staff grant**               | **Home**                   |
| Role unresolved (timeout/error)                              | **Home** — least privilege |

### Why this does not weaken anything

This is routing, not authorisation, and it was verified live that neither table is client-writable:

| Probe                                   | Result  |
| --------------------------------------- | ------- |
| customer INSERT `user_roles` role=admin | `42501` |
| customer UPDATE own `user_roles`        | `42501` |
| customer INSERT `employee_access`       | `42501` |

`employee_access` is self-referentially protected — its own policy is `USING (get_employee_role() = 'admin')`, so only an existing admin can grant staff access. A user who tampered with the client could at most reach a console screen and would still be refused by the database on every call.

No second role system was created; the change removes three ad-hoc ones.

---

## 2. Geoapify security status

**Code side — already correct, no change needed:**

- No hardcoded key. `env.dart` reads `GEOAPIFY_API_KEY` via `String.fromEnvironment` with an **empty-string** fallback, so a build without the define has no key rather than a baked-in one.
- The key is client-visible by design — autocomplete runs on the device, so it ships in the binary and cannot be secret. The control is a domain/usage restriction, not concealment.
- Timeout already present (15 s in `location_service.dart:22`), with error handling and Retry in the calling screens.
- No secret backend credential is embedded anywhere in `apps/mobile`.

**Upstream — still unrestricted. Re-verified during this phase:**

```
server-side request, no Referer header → HTTP 200
```

⚠️ **This is an EXTERNAL CONSOLE ACTION and cannot be fixed in code.** Anyone who extracts the key from the bundle or APK can spend the account's quota. No code workaround was invented — a client-side "restriction" would be trivially bypassed and would only create the illusion of control.

**Required:** in the Geoapify dashboard, restrict the key by allowed domain/origin and set a usage cap. No key value appears in this report or in any log.

---

## 3. Gemini architecture

### Before

`ai_assistant_screen.dart` called `generativelanguage.googleapis.com` **directly** with `String.fromEnvironment('GEMINI_API_KEY')`. `mobile-build.yml` never passes that define, so release builds carried an empty key and every call failed.

### After

```
Flutter app
  → POST {AppEnv.apiBaseUrl}/ai/chat   (+ Authorization: Bearer <supabase token>, when signed in)
      → server reads GEMINI_API_KEY (unprefixed, server-only)
          → Gemini
```

This reuses infrastructure that already existed and was already designed for it:

- `src/routes/api/ai/chat.ts` reads `process.env.GEMINI_API_KEY` — no `VITE_` prefix, so it is never bundled to any client.
- The route already accepted an optional `Authorization: Bearer` header for attribution, and already applies rate limiting and body-size limits.
- `API_BASE_URL` is **already** passed to release builds by `mobile-build.yml`.

**No Gemini key is added to the APK.** Verified: `grep -rn "GEMINI_API_KEY\|generativelanguage\|_geminiApiKey" apps/mobile/lib` returns nothing. The key constant was deleted outright — a `--dart-define` secret is recoverable from a shipped APK by anyone who downloads it, so the correct number of Gemini keys in the app is zero.

**Security implication of the change:** the mobile app now inherits the server's rate limiting and abuse controls instead of calling the provider directly with its own credential. The only new exposure is the app's own Supabase token, which it already sends to every other endpoint.

---

## 4. AI error / retry behaviour

### The defect was worse than a silent failure

The screen **fabricated answers**. On any failure — non-200, exception, or an empty reply — it substituted a keyword-matched canned paragraph and rendered it as a model message, indistinguishable from a real one:

```dart
if (reply.isEmpty) {
  if (q.contains('brokerage')) reply = 'Seedha Properties is 100% direct-owner…';
  else reply = 'Seedha Properties connects you directly with genuine owners…';
}
```

Because release builds had no key, `reply` was **always** empty — so **every answer in production was fabricated**.

### After

All fallback text is gone. Response interpretation is a pure function, `AiChatOutcome.fromResponse(status, body)`, which returns either a real reply or a user-safe failure — there is no third outcome.

| Condition                                | Result                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `200 {"text":"…"}`                       | Reply shown                                                                              |
| `200 {"text":""}` / missing / whitespace | Error — "did not return an answer"                                                       |
| `200 {"unconfigured":true}`              | Error — "not available yet"; the server's own honest state is surfaced, not papered over |
| `429`                                    | Error — "wait a moment and try again"                                                    |
| Other non-200                            | Error — "unavailable right now" (generic)                                                |
| Unparseable body                         | Error — "could not read"                                                                 |
| Timeout (15 s)                           | Error — "taking too long"                                                                |
| Network failure                          | Error — "couldn't reach the assistant"                                                   |

Every failure renders an inline error banner with a **Retry** that re-sends the last question. `_isLoading` is reset in `finally`, so there is no path to an infinite spinner.

**No provider text is ever shown.** A 502 carrying `"upstream gemini key sk-INTERNAL failed at pod-3"` renders as `"The assistant is unavailable right now."` — asserted by test.

---

## 5. Files changed

**Modified (5)**

```
apps/mobile/lib/features/auth/presentation/login_screen.dart          35 +++--
apps/mobile/lib/features/auth/presentation/verify_email_screen.dart   14 +--
apps/mobile/lib/features/chat/presentation/ai_assistant_screen.dart  163 +++++---
apps/mobile/lib/features/home/presentation/home_screen.dart           26 ++--
apps/mobile/lib/features/splash/presentation/splash_screen.dart       17 ++-
```

**New (4)**

```
apps/mobile/lib/services/session_router.dart          single role→destination resolver
apps/mobile/lib/features/chat/ai_chat_outcome.dart    pure response interpreter
apps/mobile/test/session_router_test.dart             9 tests
apps/mobile/test/ai_chat_outcome_test.dart            12 tests
```

Out of scope and untouched: property posting, map coordinate generation, enquiries, moderation, RLS, migrations, website.

---

## 6. Security impact

| Change                               | Effect                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------- |
| Gemini key removed from app          | **Improved** — no extractable provider credential in the APK              |
| AI calls routed via server           | **Improved** — inherits server rate limiting and abuse controls           |
| Fabricated AI answers removed        | **Improved** — no invented content presented as an assistant reply        |
| Provider errors sanitised            | **Improved** — internal detail cannot leak through an error message       |
| Staff routing from `employee_access` | **Improved** — no console is shown to an account the database will refuse |
| Unresolved role → Home               | **Improved** — a failed lookup narrows access instead of widening it      |
| RLS / grants / policies              | **Unchanged** — nothing weakened, nothing granted                         |

---

## 7. Tests added — 21

**`session_router_test.dart` (9)** — admin grant → admin console; all four non-admin staff roles → staff console; **stale `user_roles=admin` with no staff grant → Home** (the exact production defect); agent app-role grants no console; owner signed-in → dashboard, cold start → Home; customer → Home either way; unresolved role → least privilege; staff outranks app role.

**`ai_chat_outcome_test.dart` (12)** — success trimmed; empty / whitespace / missing text → failure; unparseable body and JSON array → failure, no crash; `unconfigured` reported honestly; 429 gets actionable wording; 502 leaks no provider detail (asserts `sk-INTERNAL`, `pod-3`, `gemini` are all absent); 400 and 413 fail; and every failure branch carries a non-empty user-facing message.

---

## 8. Flutter verification

| Check                  | Result                                |
| ---------------------- | ------------------------------------- |
| `flutter analyze`      | **No issues found**                   |
| `flutter test`         | **80 passed**, 0 failed (was 59; +21) |
| `flutter build bundle` | **exit 0**                            |

---

## 9. Web verification

**Not applicable — no web file was changed.** `git status --porcelain -- src/` is empty. The existing `/api/ai/chat` route was reused exactly as written; it required no modification to serve mobile requests, because it already accepted an optional bearer token and already read the key server-side.

---

## 10. Remaining external-console actions

| #   | Action                                                                     | Console              | Why code cannot do it                                                                                                                         |
| --- | -------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Restrict the Geoapify key** by allowed domain/origin and set a usage cap | Geoapify dashboard   | The key ships in the client by design; only an upstream restriction limits who may spend the quota                                            |
| 2   | **Set `GEMINI_API_KEY`** in the production server environment              | Hosting / Vercel env | Without it the server answers `{"unconfigured":true}` and the app now says so honestly — the assistant stays unavailable until the key is set |
| 3   | **Google Maps billing decision**                                           | Google Cloud         | Out of Phase 6A scope. Flutter does not use Google Maps; only the website does. Enabling billing or moving the website to OSM are both valid  |

---

## 11. Unresolved blockers

**None for this phase.** All four scoped items are addressed in code except the two items above, which are external by nature and are reported rather than worked around.

Noted for a later phase, deliberately not expanded into here:

- `staff_dashboard_screen.dart:307,331` — the moderator and analyst tool links open `/admin-dashboard`. Functionally correct (RLS still governs, and moderators are permitted to moderate) but admin-branded for a non-admin. UX inconsistency, not a bypass.
- Phase 6 audit items still open: 5 listings without coordinates, empty amenities, KYC upload timeouts, staff console entry point, orphaned screens.

**Flutter visual/device verification was not performed because no device/emulator is available** (`flutter devices` → none; `flutter emulators` → no sources). Every claim above rests on static analysis, the 80 automated tests, and live database probes — not on a running app.
