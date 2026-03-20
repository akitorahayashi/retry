---
label: "refacts" # Must match a key in .jules/github-labels.json
created_at: "2026-03-20"
author_role: "devops" # e.g. taxonomy
confidence: "high"
---

## Problem

The static checks workflow executes all verification tasks (formatting, linting, typechecking, and dist verification) under a single monolithic `just check` command.

## Goal

Split monolithic static checks into separate, individually observable GitHub Actions jobs or steps to improve signal quality, failure isolation, and parallelization.

## Context

Running all static checks sequentially within a single script invocation (`just check`) hides the specific cause of a failure in the top-level CI dashboard. This "Monolithic verification path" anti-pattern conflates distinct verification domains (e.g., formatting vs. type safety vs. artifact integrity), inflating feedback latency because independent checks must wait for prior checks to finish.

## Evidence

- path: ".github/workflows/run-static-checks.yml"
  loc: "25"
  note: "Executes `just check` as a single monolithic step instead of distinct verification phases."
- path: "justfile"
  loc: "17-21"
  note: "The `check` recipe groups `format:check`, `lint`, `typecheck`, and `verify:dist` sequentially."

## Change Scope

- `.github/workflows/run-static-checks.yml`
- `justfile`
