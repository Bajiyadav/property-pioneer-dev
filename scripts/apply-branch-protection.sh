#!/usr/bin/env bash
# Applies the committed branch-protection policy to main and develop.
#
# Requires GitHub Pro (or a public repo) — the REST protection endpoint is not
# available on the free tier for private repositories. Run once after upgrading:
#
#   ./scripts/apply-branch-protection.sh
set -euo pipefail
REPO="${1:-Bajiyadav/property-pioneer-dev}"
for BR in main develop; do
  echo "Applying protection to $BR…"
  gh api -X PUT "repos/$REPO/branches/$BR/protection" \
    --input "$(dirname "$0")/branch-protection.json" >/dev/null
  echo "  ✓ $BR"
done
