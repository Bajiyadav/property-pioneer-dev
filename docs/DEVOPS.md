# DevOps Guide

## Daily development

```bash
npm run dev          # local dev server
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run test         # vitest unit
npm run test:e2e     # playwright against E2E_BASE_URL
npm run build        # production build
```

Git hooks run automatically: **pre-commit** lint-staged, **pre-push** typecheck

- unit tests, **commit-msg** commitlint. Use `--no-verify` only to escape a
  broken hook, never to skip a failing test.

## Adding a feature

```bash
git checkout develop && git pull
git checkout -b feature/short-name
# work, commit with Conventional Commits
git push -u origin feature/short-name
# open a PR into develop; CI + preview run automatically
```

## Database change

1. Add SQL under `supabase/migrations/<feature>/`.
2. Additive and reversible where possible — `cd.yml` blocks `DROP TABLE`,
   `DROP COLUMN`, and `TRUNCATE`.
3. Test on a scratch project first.
4. Merge to `main`; CD backs up, applies, and can roll back.

## Deploying

Merging to `main` deploys. Manual escape hatch: `npx vercel --prod`.

## Incidents

CD rolls back automatically and opens an issue. Then: confirm production is
healthy on the previous build, read the run log, fix forward on `hotfix/*`.

## Maintenance calendar

| Cadence   | Task                                                                      |
| --------- | ------------------------------------------------------------------------- |
| Weekly    | review the dependency PR; triage Dependabot                               |
| Monthly   | restore a backup into a scratch project and verify                        |
| Quarterly | rotate service-role key; review RLS and grants; review Lighthouse budgets |
