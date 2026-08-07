# Security Pipeline

## Automated checks (`security.yml`)

| Check                  | Tool                       | Fails on                                      |
| ---------------------- | -------------------------- | --------------------------------------------- |
| Secret scanning        | Gitleaks (full history)    | any detected secret                           |
| Static analysis        | CodeQL `security-extended` | new alerts                                    |
| Dependency review      | `dependency-review-action` | high severity                                 |
| Vulnerabilities        | `npm audit`                | critical                                      |
| VITE\_ prefix guard    | custom                     | a secret-looking value behind `VITE_`         |
| `.env` tracking        | custom                     | `.env` tracked in git                         |
| Server/client boundary | custom                     | a `*.server` module imported from client code |

The last three are repo-specific and encode incidents this codebase already had:
`.env` was tracked, and service-role code must never reach the browser.

## Application controls

- **RLS** on all seven tables; public reads limited to `is_approved = true`
- **Column grants** — owner PII never granted to `anon`/`authenticated`
- **Role authority** from `user_roles`, never client storage; escalation via
  localStorage is impossible
- **Owner scoping** — writes are `WHERE owner_id = <jwt sub>`; a client cannot
  supply `owner_id`
- **Input validation** — zod at every server-function boundary
- **Rate limiting** — per IP, per property, per phone on enquiries
- **Turnstile** — optional CAPTCHA; skips safely when unconfigured
- **Uploads** — MIME and size enforced at the bucket _and_ re-checked server-side
- **Audit logging** — auth, moderation, enquiries

## Secret handling

Secrets live in Vercel and GitHub Actions secrets. `.env` is gitignored and
`.env.example` documents every variable. `VITE_*` is inlined into the client
bundle — public by construction.

## Known gaps

- Branch protection not enforced (needs GitHub Pro on a private repo)
- Preview deploys share the production database
- No WAF/DDoS layer beyond Vercel defaults
- No automated penetration testing
