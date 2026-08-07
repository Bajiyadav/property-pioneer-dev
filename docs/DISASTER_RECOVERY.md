# Disaster Recovery

## Objectives

| Scenario               | RTO                          | RPO                   |
| ---------------------- | ---------------------------- | --------------------- |
| Bad deploy             | < 5 min (automatic rollback) | 0                     |
| Database corruption    | < 1 h                        | < 24 h (daily backup) |
| Supabase region outage | provider-dependent           | 0                     |

## Bad deploy

`cd.yml` records the live deployment before deploying. If health checks or smoke
tests fail, the `rollback` job promotes the previous deployment and opens an
incident issue automatically.

Manual equivalent:

```bash
npx vercel ls --prod                 # find the last good deployment
npx vercel promote <url> --yes       # promote it back
```

## Database restore

Every production deploy uploads a `db-backup` artifact (30-day retention).

```bash
# 1. Download the artifact from the Actions run
# 2. Restore into a scratch project FIRST and verify
psql "$SCRATCH_DB_URL" -f backup-YYYYMMDD-HHMMSS.sql
# 3. Only then restore production, during a maintenance window
```

Supabase also keeps its own automated backups (Dashboard → Database → Backups).

## Weekly restore validation

A backup that has never been restored is a hypothesis, not a backup. Monthly:
restore the latest artifact into a scratch project, confirm row counts and RLS,
then delete the scratch project.

## Compromised service-role key

1. Supabase → Settings → API → rotate.
2. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel; redeploy.
3. Audit `audit_logs` for the exposure window.
4. Rotate any key that shared the same channel.
