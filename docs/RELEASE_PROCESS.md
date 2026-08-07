# Release Process

## Branches (Git Flow)

| Branch      | Purpose                                      | Merges into                |
| ----------- | -------------------------------------------- | -------------------------- |
| `main`      | production-ready; every commit is deployable | —                          |
| `develop`   | integration                                  | `main` via `release/*`     |
| `feature/*` | new work                                     | `develop`                  |
| `bugfix/*`  | non-urgent fixes                             | `develop`                  |
| `release/*` | stabilisation                                | `main` + back to `develop` |
| `hotfix/*`  | urgent production fix                        | `main` + back to `develop` |

## Standard release

1. Cut `release/vX.Y.Z` from `develop`.
2. CI runs; smoke-test the preview.
3. PR into `main`, review, merge (linear history — squash or rebase).
4. `cd.yml` gates, backs up the database, applies migrations, deploys, health-checks.
5. `release.yml` derives the version, writes `CHANGELOG.md`, tags, publishes.
6. Merge `main` back into `develop`.

## Hotfix

Branch from `main` → fix → PR to `main` → auto-deploy → merge back to `develop`.

## Versioning

Derived from Conventional Commits since the last tag. No manual version bumps —
`release.yml` owns `package.json` version and the tag.

## Branch protection

Requires GitHub Pro on a private repo. Once available:

```bash
./scripts/apply-branch-protection.sh
```

Policy (in `scripts/branch-protection.json`): 1 approving review, stale reviews
dismissed, required status checks, linear history, no force-push, no deletion,
conversations resolved.
