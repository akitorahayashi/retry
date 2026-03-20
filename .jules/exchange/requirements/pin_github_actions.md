---
label: "bugs"
implementation_ready: true
---

## Goal

Pin all third-party GitHub Actions to specific, immutable commit SHAs to enforce trust boundaries and mitigate supply-chain risks.

## Problem

Third-party GitHub Actions are unpinned and use mutable major version tags (e.g., `@v5`, `@v2`) instead of immutable commit SHAs. This violates determinism and provenance by allowing upstream modifications.

## Evidence

- source_event: "unpinned_third_party_actions_devops.md"
  path: ".github/workflows/run-static-checks.yml"
  loc: "18"
  note: "Uses mutable tag `actions/checkout@v5` instead of a specific SHA."
- source_event: "unpinned_third_party_actions_devops.md"
  path: ".github/workflows/run-tests.yml"
  loc: "18"
  note: "Uses mutable tag `actions/checkout@v5` instead of a specific SHA."
- source_event: "unpinned_third_party_actions_devops.md"
  path: ".github/workflows/verify-e2e-linux.yml"
  loc: "15"
  note: "Uses mutable tag `actions/checkout@v5` instead of a specific SHA."
- source_event: "unpinned_third_party_actions_devops.md"
  path: ".github/workflows/release.yml"
  loc: "44"
  note: "Uses mutable tag `actions/checkout@v5` instead of a specific SHA."
- source_event: "unpinned_third_party_actions_devops.md"
  path: ".github/workflows/release.yml"
  loc: "48"
  note: "Uses mutable tag `softprops/action-gh-release@v2` instead of a specific SHA."
- source_event: "unpinned_third_party_actions_devops.md"
  path: ".github/workflows/release.yml"
  loc: "63"
  note: "Uses mutable tag `actions/checkout@v5` instead of a specific SHA."
- source_event: "unpinned_third_party_actions_devops.md"
  path: ".github/actions/setup/action.yml"
  loc: "11"
  note: "Uses mutable tag `actions/setup-node@v5` instead of a specific SHA."
- source_event: "unpinned_third_party_actions_devops.md"
  path: ".github/actions/setup/action.yml"
  loc: "16"
  note: "Uses mutable tag `extractions/setup-just@v2` instead of a specific SHA."

## Change Scope

- `.github/workflows/run-static-checks.yml`
- `.github/workflows/run-tests.yml`
- `.github/workflows/verify-e2e-linux.yml`
- `.github/workflows/release.yml`
- `.github/actions/setup/action.yml`

## Constraints

- Pin strictly by full commit SHA for third-party actions.

## Acceptance Criteria

- All `uses:` definitions for third-party actions in GitHub workflows and composite actions rely on a full commit SHA instead of `@vX` tags.
