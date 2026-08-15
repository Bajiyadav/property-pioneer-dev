#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Urban Properties — GitHub Branch Protection Configuration Script
#
# Configures strict production delivery rules on the 'main' branch:
#  - Requires Pull Request reviews before merging
#  - Requires parallel status checks to pass before merging
#  - Blocks force pushes
#  - Blocks branch deletions
#  - Enforces linear history
# ==============================================================================

REPO="${1:-Bajiyadav/property-pioneer-dev}"
BRANCH="${2:-main}"

echo "Configuring branch protection for repository: ${REPO}, branch: ${BRANCH}..."

if ! command -v gh &> /dev/null; then
  echo "Error: GitHub CLI (gh) is not installed."
  echo "Install via: brew install gh"
  echo "Alternatively, configure manually under Settings -> Branches in GitHub."
  exit 1
fi

gh api --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/${REPO}/branches/${BRANCH}/protection" \
  -input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "1. Security & Compliance",
      "2. Code Quality (ESLint)",
      "3. TypeScript Strict Check",
      "4. Unit & Coverage Tests",
      "5. Migration & Schema Safety",
      "6. Production SSR Build",
      "7. E2E & Business QA"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true
}
EOF

echo "✓ Branch protection rules successfully applied to ${BRANCH}!"
