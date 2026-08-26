# Phase 7A — Real Android Device QA

**Date:** 2026-08-26
**APK under QA:** `app-release.apk` from CI run `32975369311`, commit `17ca7d2`
**Nothing was committed, pushed, or modified.** No database write. No QA rows created.

---

## VERDICT: 🔴 BLOCKED — DEVICE UNAVAILABLE

No Android phone or emulator could be obtained, so steps 4–10 (customer journey, owner journey, moderation, staff, AI interaction, UI inspection, network failure testing) **were not performed**. Nothing below claims otherwise.

**However — a P0 was found by inspecting the shipped APK itself**, which is artifact verification, not visual QA. It independently means this build must not be released. See P0-1.

---

## Step 1 — Build artifact configuration

`.github/workflows/mobile-build.yml`:

| Property      | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Command       | `flutter build apk --release --no-tree-shake-icons`              |
| Build mode    | **Release** (confirmed: `libapp.so` AOT present)                 |
| Artifact name | `seedha-properties-release-apk`                                  |
| Path          | `apps/mobile/build/app/outputs/flutter-apk/app-release.apk`      |
| Retention     | 30 days                                                          |
| Triggers      | push to `main` touching `apps/mobile/**`, or `workflow_dispatch` |
| dart-defines  | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `API_BASE_URL`              |

**`GEOAPIFY_API_KEY` is not among the dart-defines.** That is the root of P0-1.

## Step 2 — APK obtained

An existing successful build was used; no new build was triggered.

| Field    | Value                                                              |
| -------- | ------------------------------------------------------------------ |
| CI run   | `32975369311` — success, 8m47s                                     |
| Commit   | `17ca7d2b4c1d000d495790a1e96c16df214cbe5d`                         |
| Built    | 2026-08-26T13:38:10Z → 13:46:57Z                                   |
| Filename | `app-release.apk`                                                  |
| Size     | 68,726,475 bytes                                                   |
| SHA-256  | `b628e880c6be57fb512ffaea9578eadd333879eb8948865d983ea6b69cff185f` |

**Does it match current `origin/main`?** `origin/main` is `dceee65` (release bump), which changed only `CHANGELOG.md`, `package.json`, `package-lock.json` — no `apps/mobile` files, so it did not trigger a mobile build. **This APK is the current mobile code.**

Downloaded and available for side-loading at:
`…/scratchpad/apk/app-release.apk`

## Step 3 — Device

**NOT OBTAINED.**

| Check                 | Result                                                                |
| --------------------- | --------------------------------------------------------------------- |
| `adb devices`         | _List of devices attached_ — **empty**                                |
| `flutter devices`     | 2 found: **macOS (desktop)** and **Chrome (web)** — neither is mobile |
| `flutter emulators`   | _"Unable to find any emulator sources."_                              |
| Android system images | `~/Library/Android/sdk/system-images` — **does not exist**            |
| AVDs                  | `~/.android/avd` — **does not exist**                                 |
| iOS                   | `apps/mobile/ios/` **does not exist**; Xcode incomplete; no CocoaPods |

Device model, Android version, and resolution: **N/A — no device.**

---

## 🔴 P0-1 — Location search is dead in the release APK

**Screen:** Customer location gate (Home → "Choose your location") and Owner Post Property → Step 1
**Severity:** **P0 — blocks the entire owner posting journey and customer browsing**
**Responsible layer:** **CI configuration** (`mobile-build.yml`) — not app code

### Steps to reproduce

1. Install `app-release.apk` (CI build, commit `17ca7d2`) on an Android phone.
2. Open the app → Home shows the location gate → tap **Select Location**.
3. Type any query, e.g. "Kondapur".

### Expected

Geoapify suggestions appear; selecting one sets the browsing location. In the owner flow, the same search feeds the map preview and **Confirm Location**.

### Actual

`LocationService.searchLocations()` throws immediately — `Location service is not configured (missing API key)` — and the UI shows its error state. No suggestion can ever be returned.

### Evidence (from the shipped binary, not from source)

```
lib/arm64-v8a/libapp.so string search:
  geoapify        → 0 occurrences
  openstreetmap   → 1
  seedhaproperties→ 4
  supabase.co     → 11
  "Location service is not configured" → 1  (present)
```

The Geoapify URL is **absent from the compiled binary** while every other endpoint is present. `String.fromEnvironment('GEOAPIFY_API_KEY')` with no define is a compile-time constant `''`, so `apiKey.isEmpty` is constant-true, the throw is unconditional, and the Dart AOT compiler tree-shook the unreachable URL. The guard message is all that survives.

### Likely cause

Identical class of defect to the Gemini key fixed in Phase 6A: a `String.fromEnvironment` value that CI never supplies. `AppEnv.geoapifyApiKey` falls back to `''` rather than failing loudly at build time, so the omission is silent.

### Impact

- **Owner journey is completely blocked.** Phase 5B made a confirmed pin mandatory to submit, and the pin can only come from this search. No property can be posted from the release build.
- **Customer browsing is blocked at the location gate** — no location can be selected, so no results load.

### Recommended fix (NOT applied — QA only)

Add `--dart-define=GEOAPIFY_API_KEY=${{ secrets.GEOAPIFY_API_KEY }}` to `mobile-build.yml` and store the key as a repository secret. Do **not** hardcode it in source. Consider making a missing key fail the build rather than degrade silently.

---

## Steps 4–10 — NOT PERFORMED

Customer journey, owner journey, moderation, staff, AI interaction, on-device UI inspection, and network-failure testing all require a running app. **No result.** Specifically unverified: splash rendering, login loop behaviour, overflow, keyboard overlap, safe areas, status bar, bottom navigation, touch targets, dialogs, scrolling, transitions, back navigation, and crashes.

### What the APK artifact does verify (Step 8, partial)

| Check                                 | Result                                                 |
| ------------------------------------- | ------------------------------------------------------ |
| Gemini API key (`AIzaSy…`) in APK     | **absent**                                             |
| `generativelanguage` endpoint in APK  | **absent**                                             |
| `service_role` in APK                 | **absent**                                             |
| `maps.googleapis.com` in APK          | **absent** — mobile genuinely does not use Google Maps |
| `seedhaproperties.com/api` (AI proxy) | present                                                |
| Supabase URL + publishable key        | present                                                |
| `tile.openstreetmap.org`              | present                                                |

The Phase 6A Gemini hardening is confirmed **in the shipped binary**, not merely in source.

### Backend-enforced behaviour (read-only, live — independent of the UI)

| Check                                     | Result                                                        |
| ----------------------------------------- | ------------------------------------------------------------- |
| Owner INSERT own listing                  | `23502` — privilege + RLS pass, no row created                |
| Owner INSERT `is_approved=true`           | **`42501` denied**                                            |
| Owner direct UPDATE of `is_approved`      | **`42501` denied**                                            |
| Customer / owner call `moderate_property` | **`42501` denied**                                            |
| Admin reject without reason               | `22004` — reason required                                     |
| Anon visibility                           | 2 visible, **0 unapproved leaked**                            |
| Staff source                              | customer/owner → no `employee_access` → Home; admin → `admin` |

---

## Defect summary

| ID       | Sev   | Screen                               | Issue                                                                       | Layer              |
| -------- | ----- | ------------------------------------ | --------------------------------------------------------------------------- | ------------------ |
| **P0-1** | 🔴    | Location gate / Post Property Step 1 | Location search dead in release APK — `GEOAPIFY_API_KEY` never passed by CI | **CI config**      |
| C-1      | 🟠 P1 | Map                                  | 5 legacy listings have no coordinates; honest empty state                   | Data (Phase 6C)    |
| C-2      | 🟠 P1 | —                                    | Geoapify key unrestricted upstream                                          | External console   |
| C-3      | 🟡 P2 | Website                              | Google Maps billing disabled; **mobile unaffected**                         | External / website |
| C-4      | 🟡 P2 | Staff console                        | Enquiry/visit/report queues not built — marked unavailable                  | Future phase       |

No P3 items recorded — the polish pass requires a device.

---

## Step 12 — Automated verification

| Check                  | Result                  |
| ---------------------- | ----------------------- |
| `flutter analyze`      | **No issues found**     |
| `flutter test`         | **89 passed**, 0 failed |
| `flutter build bundle` | **exit 0**              |

Web pre-push checks did not run — nothing was committed or pushed.

**Worth noting:** all 89 tests pass and analyze is clean, yet the release build cannot search for a location. Automated checks cannot see a missing CI dart-define. This is precisely why device QA matters.

## Step 13 — Database safety

No modification. Every probe was a denial, a constraint violation, or a read. **No QA listing was created**, so none needed deleting. Verified after: **5 properties, 0 QA rows.** RLS and grants untouched.

## Step 14 — External configuration

| Service         | Status                                                                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Geoapify**    | 🔴 Still unrestricted (no-`Referer` probe → HTTP 200). Needs domain/origin restriction + usage cap. **Additionally, the key is not supplied to the mobile release build at all** — see P0-1. |
| **Gemini**      | ✅ Production `/api/ai/chat` returns a real answer; APK confirmed free of secrets.                                                                                                           |
| **Google Maps** | ⚪ Geocoding `REQUEST_DENIED` (billing off). Mobile does not use it — confirmed absent from the APK. Do not enable billing for mobile.                                                       |

## Step 15 — Git safety

Nothing committed or pushed. No code modified. `dceee65 chore(release): v0.71.2` remains un-merged on the remote, as instructed. Working tree contains only untracked report files.

---

## Verdict

# BLOCKED — DEVICE UNAVAILABLE

Device QA could not run. No Android phone, emulator, or simulator is available, and none can be created locally without installing Android SDK components.

**Independently of that: this build should not be released.** P0-1 means the release APK cannot search for a location, which blocks owner posting entirely and stops customers at the location gate. That fix is a one-line CI change plus a repository secret, and it must land before device QA is worth running — otherwise the tester will be stuck on the first screen.

### To proceed

1. **Fix P0-1** — add the `GEOAPIFY_API_KEY` dart-define and secret to `mobile-build.yml` (needs approval; not done here).
2. Let CI rebuild the APK.
3. Side-load onto a real Android phone — the APK is already downloaded and the path is above.
4. Re-run Phase 7A steps 4–10.

**Phase 6C and Phase 8 were not started.**
