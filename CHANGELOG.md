## v0.94.0 — 2026-08-28

### Features
- feat: unify rental agreement experience (83dc453)

## v0.93.3 — 2026-08-28

### Fixes
- fix: resolve homepage SSR translations (23f6c88)

## v0.93.2 — 2026-08-28

### Fixes
- fix: eliminate circular SSR chunk split and resolve createMiddleware initialization (da3db22)

## v0.93.1 — 2026-08-28

### Fixes
- fix: resolve production csrf middleware initialization (6e79077)

## v0.93.0 — 2026-08-28

### Features
- feat: improve rental agreements and network error handling (bc26eef)

## v0.92.0 — 2026-08-28

### Features
- feat: implement unified user-friendly network & error handling across web and mobile (2fd32b9)

## v0.91.0 — 2026-08-27

### Features
- feat(rental-agreement): implement production rental agreement module and terms of service (8ef3cbd)

### Migration notes
- supabase/migrations/20260829000000_create_rental_agreements_table.sql

Apply with `supabase db push` before promoting.

## v0.90.0 — 2026-08-27

### Features
- feat(ai): ground Seedha AI assistant with rental agreement knowledge and add quick service prompts (268690c)

## v0.89.0 — 2026-08-27

### Features
- feat(services): launch online rental agreement service in Hyderabad and India (99d8ecf)

## v0.88.1 — 2026-08-27

### Fixes
- fix(auth): correct import path for email service in request-otp (b42077a)
- fix(auth): deliver login OTP via Resend and support 6-8 digit codes (9f0cc76)

### Documentation
- docs(config): complete the env template + add a key-rotation checklist (d6f60b9)

## v0.88.0 — 2026-08-27

### Features
- feat(marketing): adopt modern and minimal PropTech copy across Why Us and Home (c76c507)

## v0.87.0 — 2026-08-27

### Features
- feat(marketing): elevate Why Us value pillars, comparison matrix, and visual polish (931d940)

## v0.86.0 — 2026-08-27

### Features
- feat(copy): update hero title to 'Find Your Next Home Directly from Verified Owners' (843c2a0)

## v0.85.0 — 2026-08-27

### Features
- feat(copy): update hero headline to 'Rent & Buy Homes Directly from Owners — Zero Commission' (cd4804e)

## v0.84.0 — 2026-08-27

### Features
- feat(marketing): polish brand tagline, hero copy, and navigation buttons (7cbced8)

## v0.83.0 — 2026-08-27

### Features
- feat: update hero title and subtitle in English locale (374e400)
- feat: update landing page copy, remove language switcher, clean sign‑in notice (7cca790)

### Fixes
- fix(db): adjust update statement in migration for hygiene test compliance (d9310d8)

### Migration notes
- supabase/migrations/20260828000000_agent_property_submission.sql

Apply with `supabase db push` before promoting.

## v0.82.0 — 2026-08-27

### Features
- feat: implement multi-level admin scoping and push notification infra (efbfd35)

### Fixes
- fix: resolve build errors from bad imports and duplicate declarations (312d5d6)

### Migration notes
- supabase/migrations/20260827010000_create_site_visitors_table.sql
- supabase/migrations/20260827133000_setup_messaging_webhooks.sql
- supabase/migrations/20260827230000_add_user_devices.sql
- supabase/migrations/20260828000000_agent_property_submission.sql

Apply with `supabase db push` before promoting.

## v0.81.0 — 2026-08-27

### Features
- Merge pull request #14 from Bajiyadav/feature/admin-email-otp-final (345b682)
- feat(admin): replace admin TOTP with email-OTP step-up and enforce server-side (1af389b)

## v0.80.0 — 2026-08-26

### Features
- feat: update location prompt to search bar and skip StartNowForm in owner dashboard (65ca3a1)
- feat: update location prompt to search bar and skip StartNowForm in owner dashboard (1f35792)

### Fixes
- fix: remove duplicate search parameters in navigate (21f857b)

## v0.79.0 — 2026-08-26

### Features

- feat: prompt sign in on search and add ValueAddedServices to homepage (fed73e2)

### Fixes

- fix: resolve TS types for auth status and URL params (142229c)

## v0.78.1 — 2026-08-26

### Fixes

- fix(router): auto-reload on chunk load error after deployment (b6c41e7)

## v0.78.0 — 2026-08-26

### Features

- feat(auth): migrate session storage to cookies to resolve SSR flicker (f71bcd2)

## v0.77.0 — 2026-08-26

### Features

- feat(homepage): restrict homepage sections until location is selected (b50aad5)

## v0.76.0 — 2026-08-26

### Features

- feat: refactor listing flow and add manual location entry (14c9766)

## v0.75.0 — 2026-08-26

### Features

- feat(homepage): enforce locality selection before search (af51cbf)

## v0.74.0 — 2026-08-26

### Features

- feat(homepage): enforce state/city selection for quick links (26a7b77)

### Documentation

- docs(qa): add phase 6-7 audit and final release reports (5b83bfb)

## v0.73.0 — 2026-08-26

### Features

- feat(web): simplify property search entry (ddab4d0)

## v0.72.0 — 2026-08-26

### Features

- feat(web): lead the homepage with search, not a location gate (cdef3da)

### Fixes

- fix(mobile): pass geoapify key to release builds (d563022)

## v0.71.2 — 2026-08-26

### Fixes

- fix(mobile): complete production readiness phase 6b (17ca7d2)

## v0.71.1 — 2026-08-26

### Fixes

- fix(mobile): harden roles and ai reliability (b79b3ae)

## v0.71.0 — 2026-08-26

### Features

- feat(mobile): complete owner posting and map pinning (bca219a)

### Migration notes

- supabase/migrations/20260827000000_owner_property_insert_grant.sql

Apply with `supabase db push` before promoting.

## v0.70.0 — 2026-08-26

### Features

- feat(mobile): complete customer property discovery flow (373387d)

## v0.69.0 — 2026-08-26

### Features

- feat(mobile): lead Home with discovery, not Buy/Rent/Commercial (717478d)
- feat(mobile): add launch screen and separate the staff console (c1111eb)

## v0.68.0 — 2026-08-26

### Features

- feat(mobile): make Post Property a home-screen action (8c3ee72)

### Fixes

- fix(mobile): load the profile for accounts holding multiple roles (70ffc3c)

## v0.67.1 — 2026-08-26

### Fixes

- fix: stop attaching stock photos to real listings (f5c02cc)
- fix: enable verified enquiry captcha (8546d4d)
- fix: restore mobile moderation queue (b3cea68)
- fix: reconcile production migration history (91c5ad1)

### Migration notes

- supabase/migrations/20260825000000_check_account_exists.sql

Apply with `supabase db push` before promoting.

## v0.67.0 — 2026-08-26

### Features

- feat(mobile): integrate map and location search using geoapify (378a197)

### Fixes

- fix: complete phase 3 enquiries and property upload (fa8d5c7)
- fix(mobile): harden authentication flows (aab5843)

### Migration notes

- supabase/migrations/20260826000000_customer_enquiries_rls.sql
- supabase/migrations/20260826010000_phase3_enquiries_listing_and_grants.sql

Apply with `supabase db push` before promoting.

## v0.66.0 — 2026-08-25

### Features

- feat: add Geoapify location search and gating (f70a59e)
- feat: improve home loans navigation (f997192)

### Fixes

- fix: improve mobile reliability and listing validation (096da2b)
- fix(mobile): prevent infinite auth and dashboard loading (9ac7d12)

## v0.65.0 — 2026-08-25

### Features

- feat(home): refocus the home-page banner on Home Loans only (1c407f8)

## v0.64.1 — 2026-08-25

### Fixes

- fix: update property detail page gallery to 1+3 mosaic layout (826dc02)

## v0.64.0 — 2026-08-25

### Features

- feat(ui): update property search to 1-column layout with image mosaic (6a5aa33)

## v0.63.5 — 2026-08-25

### Fixes

- fix(ui): show real customer name + name-based initials in the header profile menu (802c9bb)

## v0.63.4 — 2026-08-25

### Refactoring

- refactor: clean up src/shared directory and consolidate modules (55ada44)

## v0.63.3 — 2026-08-25

### Fixes

- fix(auth): clean up auth flows, restore native signups, and remove deprecated bypass (7d7c6fa)

## v0.63.2 — 2026-08-25

### Fixes

- fix(auth): route Create Account through the confirmed-signup endpoint (works when email is down) (32acaec)

## v0.63.1 — 2026-08-25

### Fixes

- fix(tests): remove outdated email otp ui test (18a8e38)
- fix(tests): update password tests to reflect new 6 character limit and clear qa roles (07a6f06)
- fix(auth): restore native signup to enable OTP flow (8c7f903)
- fix(auth): drop non-existent check_account_exists RPC that broke the typecheck gate (56c3f59)
- fix(auth): add server signup endpoint so Create Account reaches the dashboard (120035d)

## v0.63.0 — 2026-08-25

### Features

- feat: check if account exists via RPC to provide better error messages (3b48713)

### Migration notes

- supabase/migrations/20260825000000_check_account_exists.sql

Apply with `supabase db push` before promoting.

## v0.62.0 — 2026-08-25

### Features

- feat: make category and intent empty by default (182f11d)

## v0.61.3 — 2026-08-25

### Fixes

- fix: use status instead of user for auth check (800bcf7)

## v0.61.2 — 2026-08-25

### Fixes

- fix: remove defaults from onboarding modal and require phone (2ae2aec)

## v0.61.1 — 2026-08-25

### Refactoring

- refactor: remove auth tabs and use toggle (715bd1d)

## v0.61.0 — 2026-08-25

### Features

- feat: change minimum password length to 6 (8a6c873)

## v0.60.1 — 2026-08-24

### Fixes

- fix: un-disable sign-up button to show password validation errors (ae5fb52)

## v0.60.0 — 2026-08-24

### Features

- feat: migrate to email OTP and clean up auth (03683a5)

## v0.59.0 — 2026-08-24

### Features

- feat(auth): streamline create account to 4 simple fields (5575e10)

## v0.58.0 — 2026-08-24

### Features

- feat(auth): rename to Create Account and streamline traditional password form (3077cf5)

## v0.57.0 — 2026-08-24

### Features

- feat(property): remove location reveal gate and display location directly (f703d16)

## v0.56.0 — 2026-08-24

### Features

- feat(home): remove popular cities chips from hero section (1d37013)

## v0.55.2 — 2026-08-24

### Fixes

- fix(ui): adjust hero top spacing and search input padding (e5300fc)

## v0.55.1 — 2026-08-24

### Features

- feat(property): replace hard location-wall with sensitive-data reveal gate (#24) (80b2779)
- feat(analytics): time-ranged, real-time, visual activity analytics (#22) (a555941)

### Fixes

- fix(search): fill search-results width with a responsive auto-fit card grid (#21) (837b74e)

### Refactoring

- refactor(email): centralized branded transactional email templates (#23) (8e775ce)

## v0.54.0 — 2026-08-24

### Features

- feat(ui): update navigation and CTA terminology from List Property to Post Property (b0b9d86)

## v0.53.0 — 2026-08-24

### Features

- feat(owner): implement Step 0 authentication gate and seamless profile-driven listing flow (fddfa39)

## v0.52.0 — 2026-08-23

### Features

- feat(ui): redesign mobile experience with clean branding and navigation (a00d2e5)

## v0.51.0 — 2026-08-23

### Features

- feat(property): implement location-first property details access flow and server enforcement (63ecf9e)

## v0.50.0 — 2026-08-23

### Features

- feat(auth): add 6-digit email OTP tab and gate owner contact behind sign-in and 3-free-contact quota (33ea623)

## v0.49.2 — 2026-08-23

### Performance

- perf(router): code-split HomeLoansView and modernize tsconfig path resolution (1e95443)

## v0.49.1 — 2026-08-23

### Fixes

- fix(ui): remove offline cached results banner and harden hermetic AI test fallback (0489795)

## v0.49.0 — 2026-08-23

### Features

- feat(admin): polish MFA copy secret button and authenticator helper UX (81fd352)

## v0.48.0 — 2026-08-23

### Features

- feat(security): implement admin MFA and harden JWT/JWS verification (8cfb836)

## v0.47.0 — 2026-08-23

### Features

- feat(owner): merge listing wizard UX polish to main (05f603e)
- feat(owner): polish mobile wizard nav and moderation labels (eddadbd)
- feat(owner): polish listing wizard UX (0faa8ed)
- feat(ux): mount global NetworkStatusListener for offline detection and recovery (be6c15f)

## v0.46.0 — 2026-08-23

### Features

- feat(ui): implement unified production UI state system for web and mobile (69893c6)
- feat(home): consolidate location selection to one canonical source (a296ae5)

## v0.45.0 — 2026-08-23

### Features

- feat(core): integrate contact monetization, AI grounding, IDOR security, and production monitoring (763ca93)

## v0.44.0 — 2026-08-23

### Features

- feat(owner): enhance owner listing flow with direct dashboard routing and contact pass entitlement (e109c56)

### Fixes

- fix(owner): direct navigation to owner dashboard on property submission and preserve auth redirect (480272e)

## v0.43.0 — 2026-08-23

### Features

- feat(ai): merge complete end-to-end grounded RAG pipeline to main (394beeb)
- feat(ai): integrate end-to-end grounded RAG pipeline with dual-branch retrieval (e7184f7)
- feat(ai): implement end-to-end grounded RAG pipeline with knowledge corpus (0d81050)
- feat(auth): add passwordless email-OTP login alongside password and Google (546057a)

## v0.42.0 — 2026-08-23

### Features

- feat(ai): implement structured property search and grounded hybrid RAG architecture (c5cd357)

## v0.41.1 — 2026-08-23

### Performance

- perf(search): optimize location query caching and align loading skeletons (172252e)

## v0.41.0 — 2026-08-23

### Features

- feat(search): add location-first property discovery flow (2c36efd)

## v0.40.3 — 2026-08-23

### Fixes

- fix(ui): polish property detail specs card with balanced grid and spacious layout (48e490f)

## v0.40.2 — 2026-08-23

### Fixes

- fix(ui): ensure exact box sizing and text containment on property detail page (30a2577)
- fix(ui): ensure exact box sizing and text containment on property detail page (b3eecef)

## v0.40.1 — 2026-08-23

### Fixes

- fix(ui): use 2-column grid for property catalogue cards (d64743f)

## v0.40.0 — 2026-08-23

### Features

- feat(owner): add listing promotion checkout, submission status, and visibility plans (f67482a)
- feat(navigation): enhance tabbed search filters, back navigation, and contact quota reporting (0c326ed)
- feat(mobile): add visibility promotion screens, routes, and tests (97f1a0d)
- feat(admin): enhance listing moderation with 8-point verification checklist (4b62538)
- feat(owner): implement 7-step zero-brokerage owner listing workflow (02625d2)

### Fixes

- fix(admin): refine property update mutation typing in moderation queue (88fe73a)
- fix(owner): refine explicit type safety in listing wizard steps (1a38405)
- fix(badges): require strict boolean check for zero brokerage badges (fb8260a)
- fix(security): enforce strict RLS and caller role check on live activities (770305e)
- fix(security): quarantine destructive cleanup migration and strengthen CI guard (a8b9bc6)
- fix: persist extended owner listing fields (a7bad9f)

### Documentation

- docs: update README with 7-step owner workflow, PostGIS privacy mapping, and test metrics (61ca554)

### Migration notes

- supabase/migrations/20260822144459_contact_quotas_and_cleanup.sql
- supabase/migrations/20260823000000_secure_live_activities_rls.sql

Apply with `supabase db push` before promoting.

## v0.39.0 — 2026-08-22

### Features

- feat: complete Seedha Properties production updates (c164f67)

### Fixes

- fix: route home loan inquiries through lead activity (0a7c588)

### Migration notes

- supabase/migrations/20260817120100_storage_buckets_and_lead_routing_rbac.sql
- supabase/migrations/20260817140100_media_management_and_moderation.sql
- supabase/migrations/20260822010000_create_ai_tenant_conversations.sql
- supabase/migrations/20260822143802_add_postgis_and_location_to_properties.sql
- supabase/migrations/20260822144459_contact_quotas_and_cleanup.sql
- supabase/migrations/20260822160000_strict_profiles_rls.sql
- supabase/migrations/20260822170000_close_profiles_role_escalation.sql

Apply with `supabase db push` before promoting.

## v0.38.0 — 2026-08-21

### Features

- feat: list-property layout routing and wizard navigation fix (558460c)
- feat: complete end-to-end audit and refactor for SEEDHA Properties (0ee254d)
- feat(tenant): implement tenant registration, mandatory location matching, and commute metrics (1698ac5)
- feat(wizard): pre-fill wizard from home page data and auto-skip location step 1 to step 2 (1e6408d)
- feat(plans): introduce low-cost assisted seeker plans starting at ₹199 with FAQs and live chat (e6fbfa3)
- feat(location): introduce location-first sign-up flow with real-time indexed locality data (dd14e48)
- feat(ai): improve assistant training, remove powered by gemini label, and elevate branding (c91c081)
- feat(marketplace): enable multi-metro location, search, and visit booking (76bab65)
- feat(branding): replace logo and favicons with client 3D gold emblem across web and mobile (08ee023)
- feat(core): implement admin route guard, server-side search pagination, and SQL aggregations (8f86c94)
- feat(listing): add smart account recognition and 1-Click sign-in to Start Now card (505b20f)
- feat(auth): integrate 1-Click Google Sign-In for Web and Flutter (62d4ac9)
- feat(ai): enhance Gemini assistant with dynamic RAG context retrieval (13a3144)
- feat(ai): integrate Google Gemini AI assistant for web and mobile (341c422)
- feat(phase2): implement Owner KYC Verification and Free Commute Distance Service (dcd914e)
- feat(chat): implement real-time in-app chat system across web and mobile (0c5c42c)
- feat(notifications): add Meta WhatsApp Cloud API and Seedha brand templates (428b847)
- feat(mobile): add SecurityUtils, createAccount auth helper, and scale config (b716022)
- feat(listing): add mobile-first listing flow and fixed StartNowButton (2783bd8)
- feat(mobile): production-ready India-wide Rent, Buy, Commercial app (d515ea6)
- feat(brand): render official SEEDHA logo in watermarks and auth screens (b2dab4d)
- feat(seo): update search engine favicons, PWA manifest, and Schema.org logo metadata (f07c82a)
- feat(mobile): configure official app launcher icon and Pan-India links (cc40136)
- feat(brand): expand Pan-India coverage and enhance official logo (5c4ac17)
- feat(feedback): add interactive Studio Shodwe feedback banner and radiant Thank You modal (1b52d85)
- feat(brand): update official SEEDHA Properties logo icon across web and mobile (c154d15)
- feat(careers): add high-end Careers and Meet Our Founder page with Srinivasa Rao bio (6821ca1)
- feat(marketing): apply clean editorial dream home styling without price gimmicks (06f6568)
- feat(sync): enable realtime live sync stream between website and mobile app (e578022)
- feat(mobile): add curated rental properties fallback and high-contrast chips (33059d5)
- feat(ui): apply luxury architectural linen, espresso, and warm sunset background palette (9501fba)
- feat(ui): elevate visual aesthetics, glassmorphism, and luxury card designs across web and mobile (d95fa1d)
- feat(mobile): add 1-tap WhatsApp direct owner connect to property detail screen (5e41734)
- feat(mobile): align Flutter app brand to SEEDHA Properties and sync API configuration (d049945)
- feat: complete Docker orchestration, Cloudflare Turnstile, WhatsApp leads, and SEEDHA branding (5a698c7)
- feat(auth): replace the password checklist with length-based strength (2d96ce7)
- feat: complete SEO upgrades, Docker support, and mobile MVP (3b46e0e)
- feat(listing): make the wizard actually save the listing (b147fe6)
- feat(billing): owner assistance plans with Razorpay checkout (bc1ab40)
- feat(listing): show owners what actually happens after they submit (73b759f)
- feat(brand): rename the platform to Seedha Properties (cd8c8e2)
- feat(admin): add region-based employee activity tracking (9fe8a84)
- feat: update property specs and permissions (75853e5)
- feat: update property specs and permissions (dfd7b38)
- feat(privacy): consent-gated activity tracking, policy pages and data rights (61b6a98)

### Fixes

- fix: resolve migration timestamp collision and routing layout for list-property wizard (f06c1d6)
- fix(types): resolve typescript and eslint errors blocking deployment (9c89d7e)
- fix(listing): harden START NOW button with onClick handler and router fallback (b3396e5)
- fix(listing): make START NOW button responsive, remove form validation blocker (9486b09)
- fix(ui): eliminate mobile header overlap, remove tagline text, and make brand logo responsive (bb3c634)
- fix(a11y): add aria-labels to hero filter radio buttons and remove duplicate body JSON-LD script (92189f8)
- fix(security): separate admin stats module to preserve client/server import hygiene (6afa256)
- fix(mobile): optimize property card image proportions and compact details layout (1c85f05)
- fix(mobile): resolve RenderFlex overflow with hasScrollBody false (0c665c2)
- fix(mobile): use explicit publicPropertyColumns to avoid 42501 permission denied (f7a4cb9)
- fix(mobile): resolve type-casting in Property.fromJson and make category query filters resilient (cbfcf49)
- fix(form): add name, autocomplete, prefill, and pointer cues to START NOW form (c1a4a29)
- fix(router): configure safe parseSearch and stringifySearch to prevent JSON parser syntax error (6dd9e01)
- fix(wizard): resolve JSON.parse syntax error on search params validation (8bdd44b)
- fix(mobile): configure Android manifest permissions, OAuth deep links, and track native structure (11a3aa1)
- fix(brand): update official logo asset and prevent brand text wrapping under logo on mobile (e62d568)
- fix(mobile): configure Android-only launcher icon generation, disable iOS (4f8da39)
- fix(mobile): configure android-only launcher icon generation (4a2489f)
- fix(property): enforce data honesty and reliable public enquiry handling (98ddd2c)
- fix(mobile): standardize package imports across all screens (16cbeca)
- fix(mobile): make the Flutter app compile for the first time (4aac1dd)
- fix(db): apply the migrations the CLI could not see (075b801)
- fix(ci): use valid Java package namespace com.seedhaproperties for Android APK (500ba99)
- fix(mobile): add asset folders and use Flutter native Gradle distribution (711231c)
- fix(mobile): fix textAlign syntax and add widget test for SEEDHA Properties watermark (257c274)
- fix(db): remove the duplicate entitlements table and define the missing trigger fn (59b0670)
- fix(db): correct the admin check in the employee task policies (de4cea2)
- fix(db): create employee helper functions in public, not the auth schema (7f75a52)
- fix(property-card): remove the layout variant whose default broke every card (465941b)
- fix(billing): stop an unpayable paywall blocking contact and visits (182fd5d)
- fix(build): repair a broken main — dead imports, missing table, untyped payments (3d85ab6)
- fix(seo,dashboards): repair the empty sitemap and restore a green build (958ed8b)
- fix(seo): stop one missing column emptying the entire sitemap (57420ff)
- fix(seo): require real depth before submitting a city or locality page (c31bb2f)
- fix(seo): close four indexing defects found by auditing the live site (4d572ae)
- fix(security): set the response headers that were missing (ec613bb)
- fix(dashboards): stop presenting invented records as real data (0a93017)
- fix(hero): show the photo at its own brightness instead of a dark wash (d5af2ba)
- fix(property-card): stop truncate cutting the price off on desktop (41aecd7)
- fix(property-card): stop the card clipping its own title, price and button (c8bd001)
- fix(listing): store the owner's phone, so enquiries reach the owner (bab11b0)
- fix(property-card): stop the price overflowing its column on mobile (4976668)
- fix(brand): version the icon URLs so cached copies of the old logo refresh (c3fe820)
- fix(build): pin engines.node back to an exact major (2395b85)
- chore(deps): take the tooling bumps from PR #12 without its lockfile (cd587cd)
- fix(seo): stop shipping two conflicting canonical tags on every inner page (b13ebf3)
- fix(admin): commit the EmployeeAccessForm the dashboard imports (7d20bcd)
- fix(ci): repair the lockfile and pin the npm major so `npm ci` stops drifting (edf1cdf)
- fix(brand): replace the Lovable favicon, serve the OG image, correct env guidance (6d8289d)
- fix(owner): restore owner-only isolation, and grant the role on first listing (6bebbf0)
- fix: unbreak /admin, restore claim guards, align sitemap and stale tests (8b34145)
- fix(home): drop unearned claims and name the unlabelled controls (de97efb)

### Documentation

- docs: expand README with architecture, API reference, roadmap, and troubleshooting (9c3a087)
- docs: update README with pan-India marketplace architecture and status (0d1fa76)
- docs: update TODO.md resolving completed bugs and tech debt (6bfcd0b)
- docs(readme): rewrite to describe the project as it actually is (024c522)

### Migration notes

- supabase/migrations/20260817120000_add_customer_tracking.sql
- supabase/migrations/20260817120100_storage_buckets_and_lead_routing_rbac.sql
- supabase/migrations/20260817130000_employee_access_and_scoping.sql
- supabase/migrations/20260817140000_add_critical_property_specs.sql
- supabase/migrations/20260817140100_media_management_and_moderation.sql
- supabase/migrations/20260817150000_employee_task_tracking.sql
- supabase/migrations/20260818090000_add_customer_entitlements.sql
- supabase/migrations/20260818120000_customer_payments.sql
- supabase/migrations/20260818140000_recover_orphaned_property_columns.sql
- supabase/migrations/20260818140100_recover_agent_workflow_tables.sql
- supabase/migrations/20260819000000_create_messages_table.sql
- supabase/migrations/20260819010000_create_kyc_system.sql
- supabase/migrations/20260820000000_create_localities_table.sql
- supabase/migrations/20260821000000_create_tenant_profiles_table.sql
- supabase/migrations/20260822000000_create_search_sessions_table.sql
- supabase/migrations/README.md
- supabase/migrations/properties/20260815190000_add_extended_video_fields.sql
- supabase/migrations/properties/20260816000000_add_property_visits_and_agent_leads.sql
- supabase/migrations/users/20260816010000_add_agent_applications.sql
  \=======

## v0.38.0 — 2026-08-21

### Features

- feat: complete Phase 1 marketplace audit and query fixes (e99a0b8)
- feat: list-property layout routing and wizard navigation fix (558460c)
- feat: complete end-to-end audit and refactor for SEEDHA Properties (0ee254d)
- feat: 4-role RBAC, area agent routing, media management, lead capture, vertical cards & static routes (f56afe3)

### Fixes

- fix: resolve migration timestamp collision and routing layout for list-property wizard (f06c1d6)

### Migration notes

- supabase/migrations/20260817120100_storage_buckets_and_lead_routing_rbac.sql
- supabase/migrations/20260817140100_media_management_and_moderation.sql
- supabase/migrations/20260821120000_add_extended_deposit_and_media_columns.sql

> > > > > > > 01ac8c73b80eb50baa3ca00b64e3980c5e0d86ae

Apply with `supabase db push` before promoting.

## v0.37.1 — 2026-08-19

### Fixes

- fix(types): resolve typescript and eslint errors blocking deployment (9c89d7e)

### Migration notes

- supabase/migrations/20260822000000_create_search_sessions_table.sql

Apply with `supabase db push` before promoting.

## v0.37.0 — 2026-08-19

### Features

- feat(tenant): implement tenant registration, mandatory location matching, and commute metrics (1698ac5)

### Migration notes

- supabase/migrations/20260821000000_create_tenant_profiles_table.sql

Apply with `supabase db push` before promoting.

## v0.36.0 — 2026-08-19

### Features

- feat(wizard): pre-fill wizard from home page data and auto-skip location step 1 to step 2 (1e6408d)

## v0.35.0 — 2026-08-19

### Features

- feat(plans): introduce low-cost assisted seeker plans starting at ₹199 with FAQs and live chat (e6fbfa3)

## v0.34.1 — 2026-08-19

### Fixes

- fix(listing): harden START NOW button with onClick handler and router fallback (b3396e5)

## v0.34.0 — 2026-08-19

### Features

- feat(location): introduce location-first sign-up flow with real-time indexed locality data (dd14e48)

### Migration notes

- supabase/migrations/20260820000000_create_localities_table.sql

Apply with `supabase db push` before promoting.

## v0.33.1 — 2026-08-19

### Fixes

- fix(listing): make START NOW button responsive, remove form validation blocker (9486b09)

## v0.33.0 — 2026-08-19

### Features

- feat(ai): improve assistant training, remove powered by gemini label, and elevate branding (c91c081)

### Documentation

- docs: expand README with architecture, API reference, roadmap, and troubleshooting (9c3a087)
- docs: update README with pan-India marketplace architecture and status (0d1fa76)

## v0.32.0 — 2026-08-19

### Features

- feat(marketplace): enable multi-metro location, search, and visit booking (76bab65)

## v0.31.0 — 2026-08-19

### Features

- feat(branding): replace logo and favicons with client 3D gold emblem across web and mobile (08ee023)

## v0.30.3 — 2026-08-19

### Fixes

- fix(ui): eliminate mobile header overlap, remove tagline text, and make brand logo responsive (bb3c634)

### Documentation

- docs: update TODO.md resolving completed bugs and tech debt (6bfcd0b)

## v0.30.2 — 2026-08-19

### Fixes

- fix(a11y): add aria-labels to hero filter radio buttons and remove duplicate body JSON-LD script (92189f8)

## v0.30.1 — 2026-08-19

### Fixes

- fix(security): separate admin stats module to preserve client/server import hygiene (6afa256)

## v0.30.0 — 2026-08-19

### Features

- feat(core): implement admin route guard, server-side search pagination, and SQL aggregations (8f86c94)

## v0.29.6 — 2026-08-19

### Fixes

- fix(mobile): optimize property card image proportions and compact details layout (1c85f05)

## v0.29.5 — 2026-08-19

### Fixes

- fix(mobile): resolve RenderFlex overflow with hasScrollBody false (0c665c2)
- fix(mobile): use explicit publicPropertyColumns to avoid 42501 permission denied (f7a4cb9)

## v0.29.4 — 2026-08-19

### Fixes

- fix(mobile): resolve type-casting in Property.fromJson and make category query filters resilient (cbfcf49)

## v0.29.3 — 2026-08-18

### Fixes

- fix(form): add name, autocomplete, prefill, and pointer cues to START NOW form (c1a4a29)

## v0.29.2 — 2026-08-18

### Fixes

- fix(router): configure safe parseSearch and stringifySearch to prevent JSON parser syntax error (6dd9e01)

## v0.29.1 — 2026-08-18

### Fixes

- fix(wizard): resolve JSON.parse syntax error on search params validation (8bdd44b)

## v0.29.0 — 2026-08-18

### Features

- feat(listing): add smart account recognition and 1-Click sign-in to Start Now card (505b20f)

## v0.28.1 — 2026-08-18

### Fixes

- fix(mobile): configure Android manifest permissions, OAuth deep links, and track native structure (11a3aa1)

## v0.28.0 — 2026-08-18

### Features

- feat(auth): integrate 1-Click Google Sign-In for Web and Flutter (62d4ac9)

## v0.27.0 — 2026-08-18

### Features

- feat(ai): enhance Gemini assistant with dynamic RAG context retrieval (13a3144)

## v0.26.0 — 2026-08-18

### Features

- feat(ai): integrate Google Gemini AI assistant for web and mobile (341c422)

## v0.25.0 — 2026-08-18

### Features

- feat(phase2): implement Owner KYC Verification and Free Commute Distance Service (dcd914e)

### Migration notes

- supabase/migrations/20260819010000_create_kyc_system.sql

Apply with `supabase db push` before promoting.

## v0.24.0 — 2026-08-18

### Features

- feat(chat): implement real-time in-app chat system across web and mobile (0c5c42c)

### Migration notes

- supabase/migrations/20260819000000_create_messages_table.sql

Apply with `supabase db push` before promoting.

## v0.23.0 — 2026-08-18

### Features

- feat(notifications): add Meta WhatsApp Cloud API and Seedha brand templates (428b847)

## v0.22.0 — 2026-08-18

### Features

- feat(mobile): add SecurityUtils, createAccount auth helper, and scale config (b716022)

## v0.21.0 — 2026-08-18

### Features

- feat(listing): add mobile-first listing flow and fixed StartNowButton (2783bd8)

## v0.20.6 — 2026-08-18

### Fixes

- fix(brand): update official logo asset and prevent brand text wrapping under logo on mobile (e62d568)

## v0.20.5 — 2026-08-18

### Features

- feat(mobile): production-ready India-wide Rent, Buy, Commercial app (d515ea6)
- feat(brand): render official SEEDHA logo in watermarks and auth screens (b2dab4d)
- feat(seo): update search engine favicons, PWA manifest, and Schema.org logo metadata (f07c82a)
- feat(mobile): configure official app launcher icon and Pan-India links (cc40136)
- feat(brand): expand Pan-India coverage and enhance official logo (5c4ac17)
- feat(feedback): add interactive Studio Shodwe feedback banner and radiant Thank You modal (1b52d85)
- feat(brand): update official SEEDHA Properties logo icon across web and mobile (c154d15)
- feat(careers): add high-end Careers and Meet Our Founder page with Srinivasa Rao bio (6821ca1)
- feat(marketing): apply clean editorial dream home styling without price gimmicks (06f6568)
- feat(sync): enable realtime live sync stream between website and mobile app (e578022)
- feat(mobile): add curated rental properties fallback and high-contrast chips (33059d5)
- feat(ui): apply luxury architectural linen, espresso, and warm sunset background palette (9501fba)
- feat(ui): elevate visual aesthetics, glassmorphism, and luxury card designs across web and mobile (d95fa1d)
- feat(mobile): add 1-tap WhatsApp direct owner connect to property detail screen (5e41734)

### Fixes

- fix(mobile): configure Android-only launcher icon generation, disable iOS (4f8da39)
- fix(mobile): configure android-only launcher icon generation (4a2489f)
- fix(property): enforce data honesty and reliable public enquiry handling (98ddd2c)

## v0.20.4 — 2026-08-18

### Fixes

- fix(mobile): standardize package imports across all screens (16cbeca)
- fix(mobile): make the Flutter app compile for the first time (4aac1dd)
- fix(db): apply the migrations the CLI could not see (075b801)

### Migration notes

- supabase/migrations/20260818140000_recover_orphaned_property_columns.sql
- supabase/migrations/20260818140100_recover_agent_workflow_tables.sql
- supabase/migrations/README.md
- supabase/migrations/properties/20260815190000_add_extended_video_fields.sql
- supabase/migrations/properties/20260816000000_add_property_visits_and_agent_leads.sql
- supabase/migrations/properties/20260817140000_add_housing_fields.sql
- supabase/migrations/users/20260816010000_add_agent_applications.sql

Apply with `supabase db push` before promoting.

## v0.20.3 — 2026-08-18

### Fixes

- fix(ci): use valid Java package namespace com.seedhaproperties for Android APK (500ba99)

## v0.20.2 — 2026-08-18

### Fixes

- fix(mobile): add asset folders and use Flutter native Gradle distribution (711231c)

## v0.20.1 — 2026-08-18

### Fixes

- fix(mobile): fix textAlign syntax and add widget test for SEEDHA Properties watermark (257c274)

## v0.20.0 — 2026-08-18

### Features

- feat(mobile): align Flutter app brand to SEEDHA Properties and sync API configuration (d049945)

## v0.19.0 — 2026-08-18

### Features

- feat: complete Docker orchestration, Cloudflare Turnstile, WhatsApp leads, and SEEDHA branding (5a698c7)

## v0.18.0 — 2026-08-18

### Features

- feat(auth): replace the password checklist with length-based strength (2d96ce7)

## v0.17.7 — 2026-08-18

### Fixes

- fix(db): remove the duplicate entitlements table and define the missing trigger fn (59b0670)

### Migration notes

- supabase/migrations/20260818120000_customer_payments.sql

Apply with `supabase db push` before promoting.

## v0.17.6 — 2026-08-18

### Fixes

- fix(db): correct the admin check in the employee task policies (de4cea2)

### Migration notes

- supabase/migrations/20260817150000_employee_task_tracking.sql

Apply with `supabase db push` before promoting.

## v0.17.5 — 2026-08-18

### Fixes

- fix(db): create employee helper functions in public, not the auth schema (7f75a52)

### Migration notes

- supabase/migrations/20260817130000_employee_access_and_scoping.sql

Apply with `supabase db push` before promoting.

## v0.17.4 — 2026-08-18

### Fixes

- fix(property-card): remove the layout variant whose default broke every card (465941b)

## v0.17.3 — 2026-08-18

### Fixes

- fix(billing): stop an unpayable paywall blocking contact and visits (182fd5d)

## v0.17.2 — 2026-08-18

### Fixes

- fix(build): repair a broken main — dead imports, missing table, untyped payments (3d85ab6)

### Migration notes

- supabase/migrations/20260818090000_add_customer_entitlements.sql
- supabase/migrations/20260818120000_customer_payments.sql

Apply with `supabase db push` before promoting.

## v0.17.1 — 2026-08-18

### Fixes

- fix(seo,dashboards): repair the empty sitemap and restore a green build (958ed8b)
- fix(seo): stop one missing column emptying the entire sitemap (57420ff)

## v0.17.0 — 2026-08-18

### Features

- feat: complete SEO upgrades, Docker support, and mobile MVP (3b46e0e)

## v0.16.0 — 2026-08-18

### Features

- feat(listing): make the wizard actually save the listing (b147fe6)

## v0.15.5 — 2026-08-17

### Fixes

- fix(seo): require real depth before submitting a city or locality page (c31bb2f)

## v0.15.4 — 2026-08-17

### Fixes

- fix(seo): close four indexing defects found by auditing the live site (4d572ae)

## v0.15.3 — 2026-08-17

### Fixes

- fix(security): set the response headers that were missing (ec613bb)

## v0.15.2 — 2026-08-17

### Fixes

- fix(dashboards): stop presenting invented records as real data (0a93017)

## v0.15.1 — 2026-08-17

### Fixes

- fix(hero): show the photo at its own brightness instead of a dark wash (d5af2ba)

### Documentation

- docs(readme): rewrite to describe the project as it actually is (024c522)

## v0.15.0 — 2026-08-17

### Features

- feat(billing): owner assistance plans with Razorpay checkout (bc1ab40)

## v0.14.2 — 2026-08-17

### Fixes

- fix(property-card): stop truncate cutting the price off on desktop (41aecd7)

## v0.14.1 — 2026-08-17

### Fixes

- fix(property-card): stop the card clipping its own title, price and button (c8bd001)

## v0.14.0 — 2026-08-17

### Features

- feat(listing): show owners what actually happens after they submit (73b759f)

## v0.13.6 — 2026-08-17

### Fixes

- fix(listing): store the owner's phone, so enquiries reach the owner (bab11b0)

## v0.13.5 — 2026-08-17

### Fixes

- fix(property-card): stop the price overflowing its column on mobile (4976668)

## v0.13.4 — 2026-08-17

### Fixes

- fix(brand): version the icon URLs so cached copies of the old logo refresh (c3fe820)

## v0.13.3 — 2026-08-17

### Fixes

- fix(build): pin engines.node back to an exact major (2395b85)
- chore(deps): take the tooling bumps from PR #12 without its lockfile (cd587cd)

## v0.13.2 — 2026-08-17

### Fixes

- fix(seo): stop shipping two conflicting canonical tags on every inner page (b13ebf3)

## v0.13.1 — 2026-08-17

### Fixes

- fix(admin): commit the EmployeeAccessForm the dashboard imports (7d20bcd)

## v0.13.0 — 2026-08-17

### Features

- feat(brand): rename the platform to Seedha Properties (cd8c8e2)

## v0.12.4 — 2026-08-17

### Fixes

- fix(ci): repair the lockfile and pin the npm major so `npm ci` stops drifting (edf1cdf)

## v0.12.3 — 2026-08-17

### Fixes

- fix(brand): replace the Lovable favicon, serve the OG image, correct env guidance (6d8289d)

## v0.12.2 — 2026-08-17

### Fixes

- fix(owner): restore owner-only isolation, and grant the role on first listing (6bebbf0)

## v0.12.1 — 2026-08-17

### Fixes

- fix: unbreak /admin, restore claim guards, align sitemap and stale tests (8b34145)

## v0.12.0 — 2026-08-17

### Features

- feat(admin): add region-based employee activity tracking (9fe8a84)

### Migration notes

- supabase/migrations/20260817130000_employee_access_and_scoping.sql
- supabase/migrations/20260817140000_add_critical_property_specs.sql
- supabase/migrations/20260817150000_employee_task_tracking.sql
- supabase/migrations/properties/20260817140000_add_housing_fields.sql

Apply with `supabase db push` before promoting.

## v0.11.0 — 2026-08-17

### Features

- feat: update property specs and permissions (75853e5)
- feat: update property specs and permissions (dfd7b38)

## v0.10.0 — 2026-08-17

### Features

- feat(privacy): consent-gated activity tracking, policy pages and data rights (61b6a98)

### Fixes

- fix(home): drop unearned claims and name the unlabelled controls (de97efb)

### Migration notes

- supabase/migrations/20260817120000_add_customer_tracking.sql

Apply with `supabase db push` before promoting.

## v0.9.0 — 2026-08-17

### Features

- feat(ui): update categories, add back buttons, and polish wizard (e269b61)

## v0.8.1 — 2026-08-16

### Fixes

- fix(types): resolve all TS errors blocking pre-push hook (0a5ef9a)
- fix(dashboard): restore sign-out by stopping an infinite render loop (74b72ad)

## v0.8.0 — 2026-08-16

### Features

- feat: complete rent and interaction core loops, fix linting (fcf7ce9)

### Fixes

- fix(auth): stop self-registration from granting its own role (f234307)

### Migration notes

- supabase/migrations/20260817000000_restrict_self_registration_to_customer.sql

Apply with `supabase db push` before promoting.

## v0.7.6 — 2026-08-16

### Fixes

- fix(cd): stop reporting success for deployments that never happened (7dabec0)

### Refactoring

- refactor(dashboard): use typed navigation for role redirects (9802bf8)

## v0.7.5 — 2026-08-16

### Fixes

- fix(ci): generate the lock with the npm major that CI actually runs (87d9a2f)

## v0.7.4 — 2026-08-16

### Fixes

- fix(ci): repair the lock entries npm prunes on non-wasm platforms (81dffb7)

## v0.7.3 — 2026-08-16

### Fixes

- fix(ci): resync package-lock so npm ci can install (07c746a)
- fix(routing): let the locality route actually render (4087ee0)
- fix(ui): stop the header overflowing at 320px (4f42c50)
- fix(db): make the video/location migration idempotent and collision-safe (22d5bbf)
- fix(property): survive the un-applied video/location migration (5f48796)

### Migration notes

- supabase/migrations/20260815131921_add_video_and_location_to_properties.sql

Apply with `supabase db push` before promoting.

## v0.7.2 — 2026-08-16

### Fixes

- fix(routing): remove conflicting splat route and streamline auth assertions (dfc4765)

## v0.7.1 — 2026-08-16

### Fixes

- fix(routing): support non-trailing slash on /rent/$city and normalize test matcher (cf4575c)

## v0.7.0 — 2026-08-16

### Features

- feat(ui): upgrade visual design system, enforce route security and audit marketing claims (4c810f3)

## v0.6.1 — 2026-08-15

### Fixes

- fix(e2e): stabilize LocationPicker hydration and assertion timings (96279d8)

## v0.6.0 — 2026-08-15

### Features

- feat: complete production rental platform with video tours, agent careers, and RLS (3fe5946)

### Migration notes

- supabase/migrations/20260815131921_add_video_and_location_to_properties.sql
- supabase/migrations/properties/20260815190000_add_extended_video_fields.sql
- supabase/migrations/properties/20260816000000_add_property_visits_and_agent_leads.sql
- supabase/migrations/users/20260816010000_add_agent_applications.sql

Apply with `supabase db push` before promoting.

## v0.5.0 — 2026-08-13

### Features

- feat(ci): upgrade to production-grade gated delivery architecture with release score (b741d62)

## v0.4.1 — 2026-08-13

### Fixes

- fix(cd): expand health check routes and set 404 handler for unknown routes (c4429b7)

## v0.4.0 — 2026-08-13

### Features

- feat(category): add dedicated category landing pages for buy, commercial, villas, plots, farm-lands (1bdc7e4)

## v0.3.6 — 2026-08-13

### Fixes

- fix(ci): update auth robots meta to index, follow and adjust performance threshold to 0.85 (c30910e)

## v0.3.5 — 2026-08-08

### Fixes

- fix(content): remove the last two fabricated service claims (6531043)

## v0.3.4 — 2026-08-08

### Fixes

- fix(cd): stop the health check failing every healthy deployment (83322f3)

## v0.3.3 — 2026-08-08

### Fixes

- fix(ci): stop the env validator failing unit tests in CI (79a5fcd)

## v0.3.2 — 2026-08-08

### Fixes

- fix(content): drop remaining pan-India framing from hero and site metadata (cef1af1)

## v0.3.1 — 2026-08-08

### Refactoring

- refactor: remove unbacked features and unearned claims across the product (365daf6)

## v0.3.0 — 2026-08-08

### Features

- feat(demo): seed a real Hyderabad catalogue; wire owner leads to live enquiries (51d74e6)

### Fixes

- feat(demo): seed a real Hyderabad catalogue; wire owner leads to live enquiries (51d74e6)

## v0.2.0 — 2026-08-08

### Features

- feat(expansion): make Bangalore roadmap cards informative; remove false claims (f6c41a8)

## v0.1.6 — 2026-08-08

### Refactoring

- refactor(product): remove unbacked promotional sections; make location search real (6360ed9)

## v0.1.5 — 2026-08-08

### Fixes

- fix(ui): remove the duplicate footer on the homepage (b5cd8ad)

## v0.1.4 — 2026-08-08

### Refactoring

- refactor(structure): move domain code into owning modules; drop empty scaffolding (a549c72)

## v0.1.3 — 2026-08-07

### Refactoring

- refactor(types): generate Supabase types from live schema; validate env at startup (c8e694b)

## v0.1.2 — 2026-08-07

### Fixes

- fix(ci): honour the server/client boundary convention; harden health check (005c494)

## v0.1.1 — 2026-08-07

### Fixes

- fix(ci): regenerate an out-of-sync package-lock (4e17d76)

## v0.1.0 — 2026-08-07

### Features

- feat(owner): real listing CRUD with image upload; migrate to new Supabase project (5caa11a)
- feat(services): implement interactive price calculator, before/after slider, expandable checklists, 8-stage timeline, and 10-field booking form (7014518)
- feat(property): add Ask Urban AI assistant, locality scores, and interactive visit scheduler to property details page (1167e33)
- feat(auth): implement enterprise password rules checklist, password strength meter, mobile OTP verification, and customer identity engine (1f5632d)
- feat(pages): add 7 dedicated product landing pages for Buy, Commercial, Plots, Villas, Farm Lands, PG Hostels, and Home Services (339e07c)
- feat(master): complete startup platform elevation with zero dead links, expansion waitlist, home services, and EMI calculators (5139518)
- feat(property): add flagship Luxury Duplex Villa Vinayak Nagar Madhapur listing with room breakdown, specifications, and locality hubs (fdd5a65)
- feat(dashboards): create production-grade role-based dashboard system for Customer, Owner, Agent, and Admin with demo switcher (1666658)
- feat(property-details): upgrade property detail page with sticky back bar, action controls, lightbox, and neighborhood insights (3249f2f)
- feat(proptech): add Interactive Leaflet Map Search, Urban AI Natural Language Search, Schedule Visit Walkthrough, and Digital Rental Agreement Builder (a3618b2)
- feat(discover): add full-screen Discover Experience drawer for live categories with Hyderabad locality matrix and budget filters (3bb5c4f)
- feat(modals): add interactive category, service, expansion city modals and owner onboarding wizard (85f6e24)
- feat(services): add Apple/Stripe inspired infinite marquee Services showcase and Pan-India expansion roadmap (3096877)
- feat(hyderabad): upgrade Urban Properties platform to Hyderabad launch standards with role-based auth redirection and 17 storytelling sections (61fa2ce)
- feat: updates for production build and documentation (ad2748c)

### Fixes

- fix(admin): show genuinely pending listings in the moderation queue (4f7a464)
- fix(ssr,a11y): eliminate hydration mismatch on property pages; label form inputs (319ff73)
- fix(owner): remove false 'Listing Submitted Successfully' claim (587b589)
- fix(admin): wire moderation actions to the real server function (d570023)
- fix(dashboards): resolve auth blocker, schema drift and env gaps; rebuild all four portals (89ff8e9)
- fix(imports): add missing ExpansionWaitlistModal and HomeServicesModal imports to __root.tsx (c1abe79)
- fix(boundary): replace old text error page with DEV stack diagnostics and permanent customer data fallbacks (974d33b)
- fix(brand): implement UrbanLogoIcon SVG fallback so logo icon is 100% visible on production (4a8c019)
- fix(imports): complete production audit and resolve missing LayoutGrid, MapPin, PropertyMapView, Link, ArrowRight, and Search imports (0209aa1)
- fix(category-modal): restore missing useState and UI component imports in CategoryModal.tsx (a37fc04)
- fix(properties): import useState from react in properties.index.tsx to resolve ReferenceError (e82b532)
- fix(property-card): add defensive null checks to PropertyCard images array and fallback fields (d32ce56)
- fix(router): add null safety checks to property filtering in dashboard and properties routes to prevent ErrorComponent crashes (71cff04)

### Refactoring

- refactor(architecture): feature-first modules, split oversized files, group migrations (2852d78)
- refactor(architecture): extract pages from route files into feature modules (017bafd)
- refactor: remove unused modules, fix dashboards, update footer, production cleanup (068de0a)

# Changelog

All notable changes to the **Urban Rental Flats (URF)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-05

### Added

- **TanStack Start & React 19 Architecture**: Migrated project to TanStack Start SSR meta-framework powered by Vite 8 and Nitro server engine.
- **Supabase Integration**:
  - Client-side Supabase proxy (`client.ts`) with publishable key and `localStorage` session persistence.
  - Server-side admin client (`client.server.ts`) with `service_role` key to bypass RLS for trusted operations.
  - RPC authentication middleware (`auth-middleware.ts`) and client bearer token attacher (`auth-attacher.ts`).
- **Database Migrations & Security Baseline**:
  - Implemented 9 SQL migration scripts in `supabase/migrations/`.
  - Added `properties`, `enquiries`, `audit_logs`, and `user_roles` tables with custom enums (`property_type`, `listing_type`, `property_status`, `app_role`).
  - Applied Column-Level Security (CLS) to `properties` table revoking owner contact information (`owner_name`, `owner_phone`, `owner_whatsapp`, `owner_email`) from `anon` and `authenticated` roles.
  - Configured deny-all Row-Level Security policies on `enquiries` and `audit_logs` for client roles.
  - Created `has_role` database function restricted to `service_role`.
- **Anti-Abuse Engine (`/api/public/enquiries`)**:
  - Postgres sliding-window rate limiting engine enforcing 5 rules across IP, property, and phone scopes.
  - Form submit timing verification (`MIN_SUBMIT_MS = 2500`).
  - Honeypot field inspection (`company`).
  - Optional Cloudflare Turnstile CAPTCHA verification (`verifyTurnstile`).
  - Audit logging to `public.audit_logs`.
- **Admin Dashboard (`/_authenticated/admin`)**:
  - Real-time overview metrics (Total, Approved, Pending, Featured, Rent/Sale, 7-day enquiry activity, City distribution).
  - Listing approval & featured toggle table.
  - Customer lead enquiry inbox.
  - Security activity audit log table.
- **Public Frontend Pages**:
  - Homepage (`/`) with hero search, popular cities, and featured listings.
  - Property Browse (`/properties`) with real-time multi-field filter bar.
  - Property Detail (`/properties/$id`) with gallery switcher, specs grid, save button, enquiry modal, and `Residence` JSON-LD schema.
  - Saved Homes (`/favorites`) reading from client local storage.
  - Authentication page (`/auth`) handling Supabase Email/Password sign in and sign up.
- **Platform Configuration & Feature Switchboard**:
  - Feature registry (`src/config/features.ts`) declaring ~100+ feature flags across 10 domains with runtime overrides (`VITE_FEATURES`).
  - Data-driven expansion config (`src/config/platform.ts`) with 13 Indian cities, 10 states, 7 locales, and monetization SKUs.
  - Role-Based Access Control matrix (`src/config/rbac.ts`).
