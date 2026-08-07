# CI/CD Pipeline

## Flow

```
feature/* ──PR──> develop ──PR──> main ──push──> production
    │              │                │
    │              │                └─ cd.yml: gate → migrations → deploy → health → rollback
    │              └─ ci.yml + preview.yml (Vercel preview + smoke tests)
    └─ pre-commit (lint-staged) · pre-push (typecheck + unit tests)
```

## Workflows

| File                    | Trigger                  | Purpose                                                                           |
| ----------------------- | ------------------------ | --------------------------------------------------------------------------------- |
| `ci.yml`                | PR, push to main/develop | lint · typecheck · coverage · build · bundle budget · npm audit · licences · E2E  |
| `preview.yml`           | PR opened/updated        | Vercel preview → smoke tests → PR comment                                         |
| `cd.yml`                | push to main             | quality gate → migration verify + backup → deploy → health checks → auto-rollback |
| `security.yml`          | PR, push, weekly         | gitleaks · CodeQL · dependency review · repo-specific guards                      |
| `performance.yml`       | PR, daily                | Lighthouse CI with LCP/CLS/TBT budgets                                            |
| `dependency-update.yml` | weekly                   | verified dependency PR into develop                                               |
| `release.yml`           | push to main             | semver from Conventional Commits, changelog, GitHub release                       |

## Quality gates

A deploy is blocked by any of: TypeScript errors · ESLint errors · failing unit
or E2E tests · build failure · critical npm audit finding · detected secret ·
copyleft licence in production deps · client bundle over budget · Lighthouse
category under 0.90 · a `*.server` module imported from client code.

## Required secrets

| Secret                                                                 | Used by             | Notes                                                  |
| ---------------------------------------------------------------------- | ------------------- | ------------------------------------------------------ |
| `VERCEL_TOKEN`                                                         | preview, cd         | Vercel → Account → Tokens                              |
| `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`                                  | preview, cd         | in `.vercel/project.json`                              |
| `SUPABASE_DB_URL`                                                      | cd                  | enables backup + `db push`; steps skip safely if unset |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_APP_URL` | ci                  | build-time public config                               |
| `PRODUCTION_URL` / `E2E_BASE_URL`                                      | cd, ci, performance | default to the current production URL                  |

Never add `SUPABASE_SERVICE_ROLE_KEY` to a `VITE_` variable — `security.yml`
fails the build if you do.

## Conventional Commits

`feat` (minor) · `fix|perf|refactor` (patch) · `BREAKING CHANGE` or `!` (major).
Also allowed: `docs`, `test`, `build`, `ci`, `chore`, `revert`. Enforced by
commitlint on `commit-msg`.
