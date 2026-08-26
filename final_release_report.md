# Seedha Properties — Master Completion & Final QA

**Date:** 2026-08-26 · **Commit:** `38f14e7599852767ff95eff329ecd6a0d0eb98fd`
**Status:** READY FOR DEVICE QA — NOT RELEASE READY
**Push:** HELD — remote diverged (Part 21)

---

## VERDICT

Two gates stopped the run short of a release:

1. **`GEOAPIFY_API_KEY` repository secret is missing.** The mobile CI workflow was NOT modified.
2. **`origin/main` diverged** by `dceee65 chore(release): v0.71.2`. Not rebased; awaiting approval.

Everything not blocked by those two was implemented and verified.

## 1. Phases completed

1, 2, 3, 4, 5B, 6A, 6B carried forward. This run: homepage search flow (Part 4) + full audit
(Parts 1, 3, 5–15, 18–22). Parts 2 and 16 blocked. Phase 6C / Phase 8 NOT started.

## 2. Features implemented

Homepage is now the primary search entry point: budget filter (new), working property-type
filter (was dead state), PG removed from customer search, mandatory location gate removed.

## 3. Website changes

- `src/modules/marketing/home/TabbedSearchBox.tsx` — budget bands (rent/sale separate);
  property type wired into the query; PG / Co-Living removed; button "Search Properties".
- `src/modules/property/components/SearchUI.tsx` — mandatory `<LocationGate>` removed (5 lines).

Two files, 123 insertions, 37 deletions. Nothing else touched.

## 4. Mobile changes

**NONE.** Blocked on the missing secret.

## 5. Backend / RLS changes

**NONE.** No migration, no policy, no grant altered.

## 6. Security verification

| Check                                           | Result                                                          |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `service_role` in client bundle                 | Only a **validation regex** + an **error string** — not a value |
| Literal Google/JWT/32-hex key in tracked source | none                                                            |
| `.env` git-ignored                              | yes                                                             |
| Secret-shaped literal in the diff               | none                                                            |
| anon → `properties.latitude`                    | **401** (column grant holds)                                    |
| anon → `enquiries`                              | **42501**                                                       |
| customer INSERT `employee_access`               | **42501**                                                       |
| customer INSERT `user_roles=admin`              | **42501**                                                       |

## 7. Geoapify status

- No hardcoded key anywhere. Web reads `VITE_GEOAPIFY_API_KEY`; mobile reads a `GEOAPIFY_API_KEY` dart-define.
- **Mobile release build still receives no key — P0 UNFIXED**, secret absent.
- Key **is** embedded in the public web bundle (len 32) — inherent to a client-side key.
- 🔴 **UNRESTRICTED**: no-Referer → HTTP 200; spoofed `example.com` Referer → HTTP 200. External console action.

## 8. Gemini status

Mobile holds no Gemini key (only test comments reference it). Calls route via `/api/ai/chat`. Unchanged.

## 9. Map status

Mobile: flutter_map + OSM, unchanged; listings without coordinates stay excluded.
Website: uses **Google Maps**, and its key returns **REQUEST_DENIED — billing disabled**. Website map is dead (C-3).

## 10. Customer journey

Verified in a real browser at 1440x900 and 390x844: home → search → results, no gate, no PG,
no overflow, no console errors. Budget 25k–50k returned **1 of 2** approved listings (₹35,000 in,
₹55,000 out). Mobile app journey NOT verified — no device.

## 11. Owner journey (live DB)

| Probe                                        | Result                                   |
| -------------------------------------------- | ---------------------------------------- |
| INSERT own `owner_id`, `is_approved=true`    | **42501**                                |
| INSERT own `owner_id`, `verification_status` | **42501**                                |
| INSERT another user's `owner_id`             | **42501 RLS**                            |
| INSERT own `owner_id`, omit NOT NULLs        | **23502** (privilege OK, no row created) |
| UPDATE `is_approved`                         | **42501**                                |

## 12. Admin / moderation (live DB)

customer → **42501**; owner → **42501**; admin reject without reason → **22004**;
admin authorised → **P0002 "No such listing"** (role check passed). RPC remains the boundary.

## 13. Device QA

🔴 **DEVICE QA BLOCKED — NO ANDROID DEVICE/EMULATOR.**

## 14. Web visual QA

✅ PASSED — 30/30 checks across both viewports. Screenshots captured.

## 15–17. Flutter

analyze **No issues found** · test **89 passed** · build bundle **exit 0**

## 18–20. Web

typecheck **clean** · test **429 passed, 7 skipped, 0 failed** · build **exit 0**

## 21. CI APK result

**NOT RUN** — would have produced an identically broken APK.

## 22. APK SHA256

**N/A this run.** Last known: `b628e880c6be57fb512ffaea9578eadd333879eb8948865d983ea6b69cff185f` (run 32975369311, commit 17ca7d2) — the build proving the P0.

## 23. Pre-push result

**NOT REACHED** — push held at Part 21. Pre-commit (eslint + prettier) passed.

## 24. Final commit hash

`38f14e7599852767ff95eff329ecd6a0d0eb98fd`

## 25. Push result

**HELD.** `ahead 1, behind 1`; not a fast-forward. `dceee65` touches only CHANGELOG.md,
package.json, package-lock.json — **no overlap** with my two files, so a rebase should be clean.

## 26. Final git status

Working tree clean except the 5 untracked reports. Nothing staged.

## 27. Remaining issues

| ID   | Sev | Item                                                                                         |
| ---- | --- | -------------------------------------------------------------------------------------------- |
| P0-1 | 🔴  | Mobile release APK has no Geoapify key — location search dead                                |
| C-2  | 🟠  | Geoapify key unrestricted (any origin)                                                       |
| C-3  | 🟡  | Website Google Maps billing disabled — website map dead                                      |
| C-1  | 🟠  | 5 legacy listings without coordinates (NOT geocoded, per instruction)                        |
| N-1  | 🟡  | `requireSelection` on GeoapifyAutocomplete is a **dead prop** — declared, never used         |
| N-2  | 🟡  | `LocationGate.tsx` now unreferenced — left in place, not deleted                             |
| N-3  | 🟡  | PG still selectable in owner wizard + results filter; **a PG listing is pending moderation** |
| N-4  | 🟢  | "Showing 1 homes" grammar on results                                                         |

## 28. External actions still required

1. Create the **`GEOAPIFY_API_KEY`** repository secret (blocks P0-1).
2. **Restrict the Geoapify key** by origin + set a quota cap.
3. **Rotate the Geoapify key** — its value was pasted into a chat transcript.
4. Decide on **Google Maps billing** for the website, or move it to OSM.
5. Approve the **rebase onto `dceee65`** so the commit can push.

---

## Data note

`properties` holds **6** rows (2 approved, 4 awaiting moderation), not the 5 recorded in Phase 7A.
The new row (Mumbai, `2026-08-26T14:12:45`) was submitted today, after that audit. It was **not**
created by these probes — all four INSERT probes errored (42501/23502). It is correctly
`is_approved=false` and invisible to anon. No coordinates were invented; no data was modified.
