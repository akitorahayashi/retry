---
label: "refacts"
implementation_ready: true
---

## Goal

Split monolithic static checks into separate, individually observable GitHub Actions jobs or steps to improve signal quality, failure isolation, and parallelization.

## Problem

The static checks workflow executes all verification tasks (formatting, linting, typechecking, and dist verification) sequentially under a single monolithic `just check` command. This hides the specific cause of a failure in the top-level CI dashboard, conflating distinct verification domains and inflating feedback latency.

## Evidence

- source_event: "monolithic_static_checks_devops.md"
  path: ".github/workflows/run-static-checks.yml"
  loc: "24"
  note: "Executes `just check` as a single monolithic step instead of distinct verification phases."
- source_event: "monolithic_static_checks_devops.md"
  path: "justfile"
  loc: "16-20"
  note: "The `check` recipe groups `format:check`, `lint`, `typecheck`, and `verify:dist` sequentially."

## Change Scope

- `.github/workflows/run-static-checks.yml`
- `justfile`

## Constraints

- Independent check commands (`format:check`, `lint`, `typecheck`, `verify:dist`) must still exist and be runnable via `just`.
- The GitHub Actions workflow must split these checks to be visible in the Actions UI for faster isolation.

## Acceptance Criteria

- The monolithic `just check` recipe in the `justfile` is refactored, split, or removed so CI invokes checks granularly.
- `.github/workflows/run-static-checks.yml` contains individual step definitions for each static check domain.
- The workflow continues to verify formatting, linting, typechecking, and dist artifacts.
