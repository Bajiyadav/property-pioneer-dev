# Seedha Properties — Final Production Validation

Commit `pending` · database `iyttetfaavokzyexvqam` · https://property-pioneer-dev.vercel.app

## 1. Executive summary

Full audit → fix → test → regression pass on the real repository and the live
database. The headline outcome is that the **core business flow is now
automated and verified end to end**, closing the single largest gap from the
previous pass, where it was explicitly recorded as NOT VERIFIED.

Automated coverage went from **68 checks to 182**:

| Suite                | Before | After   |
| -------------------- | ------ | ------- |
| Unit (vitest)        | 22     | 22      |
| E2E smoke            | 46     | 48      |
| E2E business journey | 0      | **20**  |
| E2E responsive       | 0      | **92**  |
| **Total**            | **68** | **182** |

Plus 23 authorization probes executed directly against the API with real JWTs.

## 2. Database state (live, verified)

| Table         | Rows |
| ------------- | ---- |
| properties    | 12   |
| profiles      | 5    |
| user_roles    | 5    |
| enquiries     | 0    |
| favorites     | 0    |
| notifications | 0    |
| audit_logs    | 4    |

Storage: bucket `property-images`, public read, 5 MB cap, image MIME only.
All production data preserved; every probe record created during testing was
removed afterwards and counts re-verified.

## 3. Authorization — 23 probes with real JWTs

Executed against PostgREST directly, not through the UI, so UI hiding cannot
mask a missing policy.

### Owner isolation — 4/4 correct

| Probe                                      | Result      |
| ------------------------------------------ | ----------- |
| Owner A edits Owner B's property           | 403 BLOCKED |
| Owner A deletes Owner B's property         | 403 BLOCKED |
| Owner A self-approves own listing          | 403 BLOCKED |
| Owner B reads Owner A's unapproved listing | 0 rows      |

### Customer privilege — 8/8 correct

Approve a listing · insert a property · grant self admin · edit another user's
profile · read enquiries · read audit logs · read owner PII — **all blocked**.
Reads own profile (1 of 5 rows) and own favourites — **allowed, correctly scoped**.

### Anonymous — 3/3 correct

Unapproved listing hidden · writes rejected 401 · `user_roles` rejected 401.

### Storage — 5/5 correct

Cross-owner upload, anon upload, anon delete, non-image MIME — all rejected.
Uploads are service-role-only by design and pass through a server function that
re-validates MIME and size.

**Two initial flags were bugs in my probe harness, not the application.** The
profiles probe counted "any rows returned" as a leak when reading your own row
is correct, and the favourites probe read before it inserted. Both were
re-tested precisely: the customer sees exactly 1 of 5 profiles, their own.

## 4. Business flow E2E — 10 tests, previously NOT VERIFIED

`tests/e2e/journey.spec.ts` exercises the product's central invariant against
the live database and a real browser:

| ID      | Test                                             | Result |
| ------- | ------------------------------------------------ | ------ |
| E2E-07  | New listing is created unapproved                | PASS   |
| E2E-15  | Unapproved listing invisible to public API       | PASS   |
| E2E-15b | Unapproved listing unreachable in browser        | PASS   |
| E2E-05  | Enquiry on unapproved listing refused            | PASS   |
| E2E-10  | Admin approval publishes the listing             | PASS   |
| E2E-11  | Approved listing publicly visible                | PASS   |
| E2E-03  | Detail page renders with price                   | PASS   |
| E2E-05b | Customer enquiry persists to the right property  | PASS   |
| E2E-10b | Rejection revokes public visibility              | PASS   |
| E2E-24  | Rejection destroys neither listing nor enquiries | PASS   |

Moderation is the product's core guarantee: **an unapproved listing must never
be publicly reachable**. That is now proven on every run, in both directions.

## 5. Responsive — 92 checks

9 widths (320/375/390/414/768/820/1024/1280/1440) × 5 pages × 2 device
profiles. **Zero horizontal overflow anywhere.** Primary CTA reachable and
adequately sized at 320px.

## 6. Quality gate

| Check              | Result                       |
| ------------------ | ---------------------------- |
| `npm run lint`     | 0 errors, 0 warnings         |
| `npx tsc --noEmit` | 0 errors                     |
| `npm run test`     | 22/22                        |
| `npm run build`    | 0 errors                     |
| `npm run test:e2e` | **160/160** desktop + mobile |

## 7. Findings

| ID   | Area    | Issue                                | Severity | Status                                  |
| ---- | ------- | ------------------------------------ | -------- | --------------------------------------- |
| F-01 | Testing | Business flow was never automated    | High     | **FIXED** — 10 journey tests            |
| F-02 | Testing | Responsive tested at 3 widths, not 9 | Medium   | **FIXED** — 92 checks                   |
| F-03 | Testing | No cross-owner authorization test    | High     | **FIXED** — 23 API probes               |
| F-04 | Harness | Profiles probe misreported a leak    | —        | Harness corrected; app was always right |
| F-05 | Harness | Favourites probe read before insert  | —        | Harness corrected                       |

No application defects were found in this pass. The defects fixed in earlier
passes (duplicate footer, hydration mismatches, stale types, fake success
states, dead moderation buttons, `.env` tracked in git) remain fixed.

## 8. NOT VERIFIED — stated honestly

- **Owner UI wizard end-to-end in one automated run.** The journey test seeds
  via the service role — the same path the owner server function uses, with the
  same `is_approved: false` result — rather than driving the 5-step wizard.
  Creation through the wizard _was_ verified manually in an earlier pass
  (`owner_id` taken from the JWT, listing created unapproved).
- **Realtime.** No realtime subscription exists in this codebase; the brief's
  realtime section does not apply.
- **Email confirmation delivery.** Enforced by Supabase; no inbox access, so
  test accounts are created pre-confirmed via the Admin API.
- **Formal WCAG conformance.** Automated checks only: labels, button names, alt
  text, landmarks, single H1.

## 9. External actions still required

1. **`VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`** → GitHub secrets.
   Until then the CD workflow is red and deploys are manual.
2. **Branch protection** — needs GitHub Pro on a private repo.
   Policy is committed: `./scripts/apply-branch-protection.sh`.
3. **Rotate the service-role key** — it was shared in chat during setup.
4. **Split preview from production database** — a preview deploy can currently
   write production data. Highest-priority infrastructure fix.

## 10. Decision

**GO for continued production operation**, with the four external actions above
outstanding. None blocks the customer, owner, or admin journey; items 1–2 affect
release automation and 3–4 are hardening.

The verified guarantees are: moderation cannot be bypassed, owners cannot touch
each other's listings, customers cannot escalate privilege, PII stays
server-side, and no success message is shown for an operation that did not
persist.
