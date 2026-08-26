# Flutter Phase 6 — Production Mobile QA Audit

**Date:** 2026-08-26
**Commit audited:** `bca219a` — feat(mobile): complete owner posting and map pinning
**Working tree:** clean at audit start; no code file was modified during this audit
**Database:** read-only. Every probe was a denial, a constraint violation, or a zero-row match. No row was created, updated or deleted.

---

## 1. Executive summary

The three role journeys are structurally complete and the security model holds up under live testing. The database — not the Flutter UI — is what enforces ownership, moderation and visibility, and that was re-verified against production during this audit.

What this audit found is that **the remaining risk is no longer in the code paths built during Phases 1–5B**. It sits in three other places:

1. **Data.** Every existing listing predates map pinning, so the map is empty for all current inventory.
2. **External console configuration.** Two API keys are misconfigured in ways no commit can fix.
3. **Older screens that Phases 1–5B never touched** — the AI assistant, chat, and KYC upload — which still fail silently.

One genuine new defect surfaced: **login and splash resolve "is this person staff?" from two different tables**, so an account can be routed to an admin console it has no database authority to operate.

Nothing found is a regression from Phase 5B.

**Verification could not include real device testing.** `flutter devices` reports none and `flutter emulators` reports _"Unable to find any emulator sources"_. **Visual/device verification was not performed.** Every UI claim below is from source inspection or automated widget tests, never from looking at a running app.

---

## 2. Customer flow audit

| #   | Flow                        | State               | Notes                                                                    |
| --- | --------------------------- | ------------------- | ------------------------------------------------------------------------ |
| 1   | Splash → Home               | PASS                | 900 ms minimum hold, 6 s resolve ceiling, falls through to Home on error |
| 3   | Home page                   | PASS                | Intent-led hero, three CTAs, location + search entry                     |
| 4   | Search                      | PASS                | Debounced, filters applied server-side                                   |
| 5   | Location selection          | PASS                | Single `locationStateProvider`; no legacy providers exist                |
| 6   | Search results              | PASS                | Loading / data / empty / error + Retry all present                       |
| 7   | List/Map toggle             | PASS (data-limited) | Renders, but see P0-1 — no listing has coordinates                       |
| 8   | Property details            | PASS                | Loading / not-found / network-error / timeout are distinct states        |
| 9   | Favourite / save            | PASS                | Single `FavoritesService`, Supabase + local fallback                     |
| 10  | Enquiry                     | PASS                | `EnquiryResult` checked; success is never announced on failure           |
| 11  | Schedule visit              | PASS                | Duplicate-submit fingerprint, 15 s timeout                               |
| 12  | Customer profile / activity | PASS                | My Enquiries / My Visits / Saved reachable from Profile                  |
| 22  | Visibility after approval   | PASS                | Verified live: 2 visible, **0 unapproved leaked**                        |

---

## 3. Owner flow audit

| #   | Flow            | State             | Notes                                                                                 |
| --- | --------------- | ----------------- | ------------------------------------------------------------------------------------- |
| 13  | Post Property   | PASS              | Home CTA; wizard opens only on user action                                            |
| 14  | Location search | PASS              | Geoapify via existing `LocationService`; idle/searching/results/noResults/error+Retry |
| 15  | Confirm map pin | PASS              | Coordinates written only from a confirmed, validated result                           |
| 16  | Property review | PASS              | Summary + explicit "reviewed before customers see it" notice                          |
| 17  | Submit listing  | PASS              | Verified live end-to-end during Phase 5B                                              |
| 18  | Owner dashboard | PASS with warning | Functional; still uses `context.go` for property taps (P2-6)                          |

**Coordinate chain re-verified live during Phase 5B:** owner writes `latitude/longitude` only → `approx_latitude/approx_longitude` and the PostGIS `location` are `GENERATED ALWAYS` (17.4483 → 17.448). Naming a generated column raises `428C9`. No `0,0`, no India-centre, no invented coordinates anywhere in the codebase.

---

## 4. Admin flow audit

| #   | Flow               | State | Notes                                                                            |
| --- | ------------------ | ----- | -------------------------------------------------------------------------------- |
| 19  | Moderation queue   | PASS  | Filters `is_approved = false AND status != 'rejected'` — matches the web console |
| 20  | Approve listing    | PASS  | Via `moderate_property` RPC                                                      |
| 21  | Reject with reason | PASS  | RPC requires a non-empty reason (`22004` otherwise)                              |

---

## 5. Authentication / session audit

Session restoration is handled by Supabase and resolved once, in splash. Every auth call in `auth_service.dart` is bounded by `AppConstants.networkTimeout` (15 s). `getProfile()` reads `user_roles` as a **list** and resolves by privilege — the Phase-3 fix for dual-role accounts.

**P1-1 — two different sources of truth for staff identity.** `login_screen.dart:62-67` routes on `profile.role`, derived from `user_roles`. `splash_screen.dart:72` routes on `employee_access`. These are different tables answering different questions, and they disagree in production today:

```
'QA admin'        user_roles=['admin']   employee_access=NONE
'QA Admin Test'   user_roles=['admin']   employee_access=admin
```

`'QA admin'` signing in is sent to `/admin-dashboard`, but every admin RLS check calls `get_employee_role()`, which returns NULL for them — so the console loads with no authority behind it and `moderate_property` refuses them. The same account cold-starting via splash goes to Home instead. Same user, two destinations, one of which does not work.

---

## 6. Navigation audit

- Route guard covers `*-dashboard`, `/profile`, `/post-property`.
- Property taps use `push` in all customer surfaces, so Back returns to results with filters intact. `owner_dashboard_screen.dart:169` is the one remaining `context.go` (P2-6).
- **P2-2 — the staff console has no in-app entry point.** `/staff-dashboard` is reachable _only_ from splash. A staff member who navigates to Home cannot return without restarting the app.
- **Orphaned screens** (defined, never referenced): `ListPropertyScreen`, `TenantSignUpScreen`.

---

## 7. Map / location audit

Single provider: `flutter_map` + OpenStreetMap tiles. **No Google Maps or Mapbox anywhere in `apps/mobile/lib`.** Markers are built exclusively from listings with non-null coordinates; listings without one are excluded rather than plotted.

The `LatLng(20.5937, 78.9629)` in `property_map_view.dart:35` is the **map camera fallback**, not a property coordinate — it is never written to a row.

---

## 8. Enquiry / visit / favourite audit

One implementation each — no duplicates:

| Service                                               | Definitions                                             |
| ----------------------------------------------------- | ------------------------------------------------------- |
| PropertyService / FavoritesService / EnquiryService   | 1 each                                                  |
| LocationService / AuthService / PropertyUploadService | 1 each                                                  |
| Location providers                                    | `locationServiceProvider`, `locationStateProvider` only |
| `selectedCityProvider` / `selectedLocalityProvider`   | **do not exist**                                        |

---

## 9. Security / RLS audit — live results

| Probe                             | Result                                                      |
| --------------------------------- | ----------------------------------------------------------- |
| Owner INSERT own listing          | `23502` not-null — **privilege + RLS pass**, no row created |
| Owner INSERT as another user      | `42501` denied                                              |
| Owner UPDATE / DELETE             | `42501` denied                                              |
| Customer INSERT for another owner | `42501` denied                                              |
| Anon INSERT                       | `42501` denied                                              |
| Anon `moderate_property`          | `42501` — function not granted to anon                      |
| Customer `moderate_property`      | `42501` — "Only an admin or moderator…"                     |
| Owner `moderate_property`         | `42501` — **cannot approve own listing**                    |
| Admin `moderate_property`         | `P0002` — reachable, listing simply absent                  |
| Anon read enquiries               | `42501` denied                                              |
| Customer / owner read enquiries   | 200, scoped                                                 |
| Anon reads unapproved properties  | **0 leaked**                                                |

**Migration history: 27 local / 27 applied / 0 unapplied.**

No hardcoded credentials, service-role keys, or JWTs in `apps/mobile/lib`.

---

## 10. API / key configuration audit

| Key                 | Status                                                                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Geoapify**        | **UNRESTRICTED** — answers a server-side request with no `Referer` (HTTP 200). Client-visible by design; the control is a domain restriction, which is not configured |
| **Google Maps**     | `REQUEST_DENIED — You must enable Billing`. **Not used by Flutter at all**; used by the website (`PropertyMap.tsx`, `GoogleMapsProvider.tsx`)                         |
| **Gemini (mobile)** | Release build passes no `--dart-define=GEMINI_API_KEY`. No key leaks — but no empty-key guard either                                                                  |
| **Supabase**        | `env.dart` falls back to hardcoded prod URL + publishable key. Public by design; a misconfigured build silently targets production                                    |

---

## 11. Responsive / UI audit

Automated overflow tests cover **360 / 375 / 390 / 430 dp**; Flutter surfaces `RenderFlex` overflow as a test failure, so these are enforced. They previously caught two real defects (76 px specs-row overflow at every width; 28 px price overflow at 360 dp), both fixed.

**No rendered inspection was performed** — no device or emulator is available.

---

## 12. Known issues — status

| #   | Known issue                      | Verified state                               |
| --- | -------------------------------- | -------------------------------------------- |
| 1   | 5 properties without coordinates | **CONFIRMED — 5/5 have `latitude = NULL`**   |
| 2   | Geoapify key unrestricted        | **CONFIRMED**                                |
| 3   | Google Maps billing              | **CONFIRMED disabled**; affects website only |
| 4   | Mobile Gemini release config     | **CONFIRMED** — no key passed, no guard      |
| 5   | Amenities empty                  | **CONFIRMED — 5/5 empty**                    |
| 6   | No device/emulator               | **CONFIRMED — none available**               |

---

## 13. Findings table

| ID   | Sev | Issue                                       | File / flow                                     | Root cause                                | User impact                                   | Fix                                                                       | Action type                     |
| ---- | --- | ------------------------------------------- | ----------------------------------------------- | ----------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------- |
| P0-1 | 🔴  | All 5 listings lack coordinates             | data                                            | Predate map pinning                       | Map tab always empty                          | Re-pin via owner/admin workflow                                           | **Data + code**                 |
| P0-2 | 🔴  | Geoapify key unrestricted                   | Geoapify console                                | No domain restriction                     | Quota theft / billing abuse                   | Restrict domains, set cap                                                 | **External console**            |
| P0-3 | 🔴  | Google Maps billing disabled                | website `PropertyMap.tsx`                       | Billing off                               | Website map broken; Flutter unaffected        | Enable billing, or drop Google Maps and use OSM on web too                | **External console + decision** |
| P1-1 | 🟠  | Login and splash use different role sources | `login_screen.dart:62`, `splash_screen.dart:72` | `user_roles` vs `employee_access`         | Account routed to a console it cannot operate | Resolve staff identity from `employee_access` in both                     | **Code**                        |
| P1-2 | 🟠  | Mobile AI assistant inert in release        | `ai_assistant_screen.dart:27,55`                | No key passed; no empty-key guard         | Feature silently fails                        | Route via existing `/api/ai/chat` proxy (`apiBaseUrl` already configured) | **Code**                        |
| P1-3 | 🟠  | AI assistant + chat swallow errors          | `ai_assistant_screen.dart`, `chat_screen.dart`  | catch blocks with no UI surface, no retry | Silent failure                                | Add error state + Retry                                                   | **Code**                        |
| P1-4 | 🟠  | No real-device QA                           | —                                               | No device/emulator                        | Visual defects unknown                        | Run on a physical Android device                                          | **External**                    |
| P2-1 | 🟡  | KYC upload unbounded + no retry             | `kyc_upload_screen.dart:84,92`                  | Two Supabase calls lack `.timeout`        | Possible indefinite spinner                   | Add timeout + Retry                                                       | **Code**                        |
| P2-2 | 🟡  | Staff console unreachable in-app            | `app_routes.dart`                               | Only splash routes there                  | Staff must restart app                        | Add entry from Profile                                                    | **Code**                        |
| P2-3 | 🟡  | Amenities empty on all listings             | data                                            | Never captured                            | Amenities section never renders               | Capture in wizard / backfill                                              | **Data**                        |
| P2-4 | 🟡  | Fake listings in `TenantMatchesScreen`      | `tenant_matches_screen.dart:14`                 | Hardcoded `dummyMatches` with fake prices | Shipped in binary; one route from reachable   | Remove or wire to real data                                               | **Code**                        |
| P2-5 | 🟡  | Orphaned screens                            | `ListPropertyScreen`, `TenantSignUpScreen`      | Unreferenced                              | Dead code                                     | Remove or route                                                           | **Code**                        |
| P2-6 | 🟡  | Owner dashboard uses `context.go`           | `owner_dashboard_screen.dart:169`               | Not migrated to `push`                    | Back jumps to Home                            | Change to `push` **if confirmed on device**                               | **Code**                        |
| P3-1 | ⚪  | `env.dart` hardcoded prod fallbacks         | `env.dart:12,17`                                | Fallback literals                         | Misconfigured build hits prod silently        | Fail loudly when unset                                                    | **Code**                        |

---

## 14. Recommended Phase 6 implementation order

1. **P0-2 Geoapify restriction** — external, minutes, removes an active abuse window.
2. **P0-3 Google Maps decision** — the Flutter app does not use it. Decide whether the _website_ keeps Google Maps (enable billing) or moves to OSM for consistency. This may close the issue at zero cost.
3. **P1-1 role-source unification** — small, security-relevant, and a correctness bug today.
4. **P0-1 re-pin workflow** — the largest piece; needs an owner/admin "set location" screen. Do it after P1-1 so the admin path is trustworthy.
5. **P1-2 / P1-3 AI + chat** — proxy the Gemini call and add error/retry.
6. **P1-4 device QA** — once the above land, on a real device.
7. **P2 batch** — KYC timeouts, staff entry point, dummy data removal, orphan cleanup.

---

## 15. Verification results

| Check                        | Result                                       |
| ---------------------------- | -------------------------------------------- |
| `flutter analyze`            | **No issues found**                          |
| `flutter test`               | **59 passed**, 0 failed                      |
| `flutter build bundle`       | **exit 0**                                   |
| Migration history            | **27 / 27 applied, 0 unapplied**             |
| Live RLS matrix              | all 13 probes correct                        |
| Public visibility invariant  | 2 visible, **0 unapproved leaked**           |
| Database writes during audit | **none**                                     |
| Files modified during audit  | **none** (this report only)                  |
| Device / emulator            | **NONE — visual verification not performed** |

---

**No P0 or P1 finding is a regression introduced by Phases 1–5B.** Every one is either pre-existing data, external console configuration, or an older screen those phases never touched.
