## What changed

<!-- One or two sentences. Link the issue. -->

## Why

## Risk

- [ ] No database migration, or migration is additive and reversible
- [ ] No change to RLS, grants, or auth
- [ ] No new client-side secret (nothing secret behind `VITE_`)
- [ ] Routes unchanged, or the change is intentional and documented

## Verification

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Preview deployment smoke-tested
