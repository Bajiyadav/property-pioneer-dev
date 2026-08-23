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
