# Phase 7 — Final Mobile Device QA

**Date:** 2026-08-26
**Commit under QA:** `17ca7d2` — fix(mobile): complete production readiness phase 6b
**Nothing was committed, pushed, or modified during this QA.** No database write was performed.

---

## VERDICT: 🔴 DEVICE QA BLOCKED — no runnable Flutter device/emulator is available.

The visual and interaction portions of Phase 7 (sections 3–9) **were not performed**. Nothing in this report claims otherwise. Source inspection and automated tests are reported separately and are explicitly **not** a substitute for on-device QA.

---

## 1. Environment audit

### Flutter

```
Flutter 3.47.0 · channel stable · macOS 15.7.7 24G720 darwin-arm64
Dart 3.13.0 · Engine 5f77625673 · Framework 4cf2416426 (2026-08-11)
```

### Device / emulator availability

`flutter doctor -v` reports **"Connected device (2 available)"**, which is misleading in this context — both are desktop targets, not mobile:

| Reported device | Type             | Usable for mobile QA?                                        |
| --------------- | ---------------- | ------------------------------------------------------------ |
| macOS (desktop) | `darwin-arm64`   | **No** — desktop rendering, no touch, no mobile safe areas   |
| Chrome (web)    | `web-javascript` | **No** — different plugin implementations and rendering path |

**No Android device, no Android emulator, no iOS simulator.**

```
flutter devices    → no wireless devices found
flutter emulators  → "Unable to find any emulator sources."
```

### Why an emulator cannot simply be started

| Blocker                        | Evidence                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| Android cmdline-tools missing  | `flutter doctor`: ✗ _cmdline-tools component is missing_                                      |
| Android licences unaccepted    | ✗ _Android license status unknown_                                                            |
| **No system images installed** | `~/Library/Android/sdk/system-images` does not exist                                          |
| **No AVDs defined**            | `~/.android/avd` does not exist                                                               |
| iOS impossible                 | `apps/mobile/ios/` **does not exist**; Xcode installation incomplete; CocoaPods not installed |

Creating an Android emulator would require installing cmdline-tools, accepting licences, downloading a system image, and creating an AVD — an external environment setup action, not something this QA can assume.

### Could the app be run on Chrome or macOS instead?

Technically `web/` and `macos/` targets exist, so a run might start. **It would not constitute mobile device QA**, and I did not do it:

- The QA checklist asks specifically about keyboard overlap, bottom navigation, safe areas, status bar and touch targets — none of which a desktop/web run exercises.
- Several plugins behave differently or not at all outside Android: `image_picker`, `geolocator`, `video_player`, `sentry_flutter`.
- The shipped artefact is an Android APK (`mobile-build.yml` builds `flutter build apk`).

Reporting a Chrome run as "visual QA" would be a false result. Offered as an option below, not performed.

---

## 2. Repository state

```
## main...origin/main [behind 1]
17ca7d2 fix(mobile): complete production readiness phase 6b   ← under QA
0db6f18 chore(release): v0.71.1 [skip ci]
b79b3ae fix(mobile): harden roles and ai reliability
```

**Remote has one commit we do not have:** `dceee65 chore(release): v0.71.2 [skip ci]` — the automated release bump that fired on the Phase 6B push (CHANGELOG.md, package.json, package-lock.json). **Not rebased**, per instruction. No `apps/mobile` overlap.

Working tree carries only untracked report files.

---

## 3–9. Journey, moderation, staff, AI, error-state and visual QA

**NOT PERFORMED — device QA blocked.**

Sections 3, 4, 8 and 9 require a running app on a mobile device and have **no result**. Specifically unverified: splash rendering and transition, login loop behaviour, on-screen overflow, keyboard overlap, safe areas, status bar, bottom navigation, touch reachability, dialogs, scrolling, screen transitions, back-navigation behaviour, and every interaction path.

What **was** verifiable without a device is reported below, clearly labelled by layer.

### Verified at the database layer (read-only, live production)

These are backend-enforced properties, independent of the UI:

| Check                                | Result                                         |
| ------------------------------------ | ---------------------------------------------- |
| Owner INSERT own listing             | `23502` — privilege + RLS pass, no row created |
| Owner INSERT with `is_approved=true` | **`42501` denied**                             |
| Owner direct UPDATE of `is_approved` | **`42501` denied**                             |
| Customer calls `moderate_property`   | **`42501`** — "Only an admin or moderator…"    |
| Owner calls `moderate_property`      | **`42501`** — cannot approve own listing       |
| Admin rejects without a reason       | `22004` — reason required                      |
| Anon visibility                      | 2 visible, **0 unapproved leaked**             |

### Staff role source (read-only)

| Account  | `employee_access` | Resolved destination     |
| -------- | ----------------- | ------------------------ |
| Customer | none              | Home                     |
| Owner    | none              | Home                     |
| Admin    | `admin`           | Admin/moderation console |

`employee_access` is confirmed as the authoritative source. **Not verified on-device:** whether the staff console renders correctly, whether unavailable tools read as unavailable, or navigation behaviour.

### AI (static + endpoint, not on-device)

| Check                                | Result                                     |
| ------------------------------------ | ------------------------------------------ |
| Gemini key anywhere in `apps/mobile` | **Absent**                                 |
| App calls backend `/ai/chat`         | Yes                                        |
| Bearer token forwarded               | Yes, when a session exists                 |
| Production endpoint                  | **HTTP 200 with a real answer**            |
| Fabricated/canned fallback           | Removed; 12 tests pin the failure branches |

**Not verified on-device:** that the error banner and Retry actually render and behave correctly.

---

## 10. Findings

**No new P0/P1/P2/P3 defects were found, because the defect-finding portion of this phase could not run.** Listing "no defects" here would misrepresent an untested app.

Carried forward from Phase 6B, unchanged and accepted:

| ID  | Sev   | Item                                                                                         | Owner                                  |
| --- | ----- | -------------------------------------------------------------------------------------------- | -------------------------------------- |
| C-1 | 🟠 P1 | 5 legacy listings have no coordinates; map shows its empty state for them                    | Deferred to Phase 6C (re-pin workflow) |
| C-2 | 🟠 P1 | **Geoapify key unrestricted**                                                                | External console                       |
| C-3 | 🟡 P2 | Website Google Maps billing disabled (`REQUEST_DENIED`) — mobile unaffected                  | External / website decision            |
| C-4 | 🟡 P2 | Staff enquiry/visit/report queues not built — now labelled unavailable rather than mislinked | Future phase                           |

---

## 11. Database safety

**No modification.** Every probe was a denial, a constraint violation, or a read. No test listing was created, so none needed deleting. The five legacy listings remain untouched with `latitude = NULL`, and **no coordinates were invented.**

---

## 12. External configuration

| Service         | Status                                                                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Geoapify**    | 🔴 **EXTERNAL ACTION REQUIRED** — still answers a server-side request with no `Referer` (HTTP 200). Restrict by allowed origin/domain and add usage/quota limits. Not fixable in code.       |
| **Gemini**      | ✅ Configured. Production `/api/ai/chat` returned a real answer; mobile holds zero secrets.                                                                                                  |
| **Google Maps** | ⚪ Geocoding returns `REQUEST_DENIED` (billing disabled). **Mobile does not depend on it** — flutter_map/OSM only. Two website files still use it. Do not enable billing on mobile's behalf. |

---

## 13. Automated verification

| Check                  | Result                  |
| ---------------------- | ----------------------- |
| `flutter analyze`      | **No issues found**     |
| `flutter test`         | **89 passed**, 0 failed |
| `flutter build bundle` | **exit 0**              |

Web pre-push checks were not run: nothing was committed or pushed, so the pre-push hook did not fire.

---

## 14. Release readiness

**NEEDS DEVICE QA — not releasable on current evidence.**

Not "blocked" in the sense of a known defect, and not "ready" either: the app has never been rendered on a mobile device at any point across Phases 4–7. Everything verified to date is static analysis, 89 automated tests, and live database probes. Those establish that the **logic and security** are sound; they say nothing about what a user sees.

Unknown until a device runs it: layout on real screens, keyboard behaviour, safe areas, touch targets, transitions, and every interaction path.

### To unblock

Either:

1. **Install Android tooling on this machine** — cmdline-tools, accept licences, download a system image, create an AVD. Then Phase 7 can run in full.
2. **Provide a physical Android device** with USB debugging.
3. **Build the APK in CI** (`mobile-build.yml` already does this and uploads it as an artifact) and side-load it onto a real phone for manual QA.

Option 3 needs no local setup and uses a pipeline that already exists — likely the fastest path.

### Partial alternative, explicitly not equivalent

The app could be launched in Chrome (`web/` exists) to sanity-check layout and navigation. That would catch some overflow and flow problems, but would **not** validate Android rendering, keyboard overlap, safe areas, status bar, touch targets, or the plugins that behave differently off-device. I have not done this and would not report it as device QA.

---

**Phase 6C and Phase 8 were not started.**
