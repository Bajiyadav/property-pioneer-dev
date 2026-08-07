# Scaling Guide

Current: SSR on Vercel edge + Supabase Postgres. TTFB ~75 ms, FCP ~430 ms.

| Scale      | Bottleneck                                                           | Action                                                                                                                                                                     |
| ---------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1K MAU** | none                                                                 | current stack is sufficient                                                                                                                                                |
| **10K**    | `fetchProperties` selects the whole table; rate limits are DB-backed | paginate + cursor; move rate limiting to Redis/Upstash; add DB indexes (already present on approval/city/owner)                                                            |
| **100K**   | Postgres `ILIKE` search; image bandwidth; single primary             | dedicated search (Typesense/Elastic); CDN image transforms; read replicas; split preview/production databases                                                              |
| **1M**     | monolithic schema and request path                                   | partition `properties` by region; move enquiries to a queue; extract services along the existing module seams (`modules/property`, `modules/enquiry`, `modules/analytics`) |

## Cost inflection points

Supabase compute at ~10K MAU; Vercel bandwidth once images are served at volume
(fix with CDN transforms before scaling the plan).

## Ordered next steps

1. Split preview from production database
2. Paginate the property feed
3. Sentry + Vercel Analytics
4. Redis rate limiting
5. Dedicated search
