# Seedha auth migration — Supabase Auth → Seedha Java auth/OTP

Status: **in progress, dual-run.** Both auth systems are live. Supabase Auth is
NOT removed and existing users are not affected.

## Where things stand

| Layer                 | State                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Java auth/OTP backend | Implemented; 65 DB-backed tests pass against Postgres (OTP, JWT, refresh rotation, reuse detection, logout, IDOR, file security).                       |
| SMS delivery          | Provider abstraction + honest no-op (staging) + a Twilio adapter. No real vendor credentials configured → **REQUIRES OWNER ACTION**.                    |
| Flutter client        | `SeedhaAuthService` + `NativeApiClient` phone-OTP/refresh/logout, refresh token in Keychain/Keystore. Additive; the OTP UI screens still call Supabase. |

## Why a dual-run, not a switch

Supabase stores each user's password/OTP state in its own auth schema. Those
credentials cannot be exported and re-hashed into the Seedha `users` table —
Supabase never exposes them. So there is no silent, offline migration. The safe
path is re-authentication, done lazily, with both systems live so nobody is
locked out mid-flight.

## The migration, step by step

1. **Keep Supabase Auth working (now).** The existing `AuthService` (Supabase)
   remains the default. `SeedhaAuthService` (Java OTP) is available in parallel.

2. **Wire a real SMS provider.** Set `seedha.sms.provider=twilio` and supply
   `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` via the
   secret manager. Verify one real OTP end to end on staging. Until this is
   done the Java phone-OTP path generates and hashes correctly but does not
   deliver, and the code reports that honestly.

3. **Migrate screens behind a flag.** Point the login / OTP screens at
   `SeedhaAuthService` behind a remote/config flag, starting with new signups
   and a small cohort. New accounts are created directly in the Seedha `users`
   table with a `profiles` row (1:1 by id, as today).

4. **Lazy re-auth for existing users.** When an existing Supabase user logs in
   through the new path, they verify a phone OTP once; on success a Seedha
   `users`/`profiles` record is created (or linked by phone/email) and the
   Seedha session takes over. A user who never returns keeps working on Supabase
   until they do — no forced cut-over, no lost accounts.

5. **Backfill link table (optional).** To correlate the two identities during
   the overlap, record `{supabase_uid, seedha_user_id, linked_at}` when a user
   re-authenticates, so support and analytics can join the two.

6. **Decommission Supabase Auth — only after evidence.** When the new path is
   the default for all clients, real SMS is verified, refresh/rotation/logout
   are runtime-verified in production, and the active-user re-auth rate has
   plateaued, retire Supabase Auth. Not before.

## Hard rules during migration

- Never delete Supabase Auth or a user's Supabase session until that user has a
  working Seedha session.
- Never store a Supabase or Seedha token in SharedPreferences or logs — refresh
  tokens live in the platform keystore; access tokens stay in memory.
- Never log or return an OTP; never put one in a URL.
- Rate limits and RLS stay in force on both paths throughout.
