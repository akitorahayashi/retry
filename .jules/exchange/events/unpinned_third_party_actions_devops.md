---
label: "bugs" # Must match a key in .jules/github-labels.json
created_at: "2026-03-20"
author_role: "devops" # e.g. taxonomy
confidence: "high"
---

## Problem

Third-party GitHub Actions are unpinned and use mutable major version tags (e.g., `@v5`, `@v2`) instead of immutable commit SHAs.

## Goal

Pin all third-party GitHub Actions to specific, immutable commit SHAs to enforce trust boundaries and mitigate supply-chain risks.

## Context

Using mutable tags like `@v5` allows upstream action maintainers (or attackers who compromise the action repository) to modify the executed code without warning. Determinism and provenance are baseline requirements. Trust boundaries must be explicit at every handoff, including external artifacts.

## Evidence

- path: ".github/workflows/run-static-checks.yml"
  loc: "19"
  note: "Uses mutable tag `actions/checkout@v5` instead of a specific SHA."
- path: ".github/workflows/run-tests.yml"
  loc: "19"
  note: "Uses mutable tag `actions/checkout@v5` instead of a specific SHA."
- path: ".github/workflows/verify-e2e-linux.yml"
  loc: "15"
  note: "Uses mutable tag `actions/checkout@v5` instead of a specific SHA."
- path: ".github/workflows/release.yml"
  loc: "47"
  note: "Uses mutable tag `actions/checkout@v5` instead of a specific SHA."
- path: ".github/workflows/release.yml"
  loc: "51"
  note: "Uses mutable tag `softprops/action-gh-release@v2` instead of a specific SHA."
- path: ".github/workflows/release.yml"
  loc: "68"
  note: "Uses mutable tag `actions/checkout@v5` instead of a specific SHA."
- path: ".github/actions/setup/action.yml"
  loc: "12"
  note: "Uses mutable tag `actions/setup-node@v5` instead of a specific SHA."
- path: ".github/actions/setup/action.yml"
  loc: "17"
  note: "Uses mutable tag `extractions/setup-just@v2` instead of a specific SHA."

## Change Scope

- `.github/workflows/run-static-checks.yml`
- `.github/workflows/run-tests.yml`
- `.github/workflows/verify-e2e-linux.yml`
- `.github/workflows/release.yml`
- `.github/actions/setup/action.yml`
