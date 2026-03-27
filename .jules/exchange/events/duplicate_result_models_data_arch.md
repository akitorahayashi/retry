---
label: "refacts"
created_at: "2024-03-27"
author_role: "data_arch"
confidence: "high"
---

## Problem

Duplicate definitions exist for representing execution outcomes, violating the Single Source of Truth principle.

## Goal

Unify the representations into a single domain concept representing an execution attempt outcome.

## Context

The codebase defines `AttemptResult` in the core domain and `ExecutionResult` within an application module. Both structures are discriminated unions mapping to identical execution states (`success`, `error`, `timeout`) with the exact same inner properties (outcome, exitCode, stdout). This creates an unnecessary boundary conversion where the application module repackages identical concepts to the domain model without adding meaningful separation.

## Evidence

- path: "src/domain/result.ts"
  loc: "1-18"
  note: "Defines AttemptResult with outcome, exitCode, stdout, and attempt number."
- path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "14-17"
  note: "Defines ExecutionResult which mirrors AttemptResult sans the attempt number, leading to trivial mappings."
- path: "src/app/execute-retry/execute-attempt.ts"
  loc: "34-72"
  note: "Maps ExecutionResult back to AttemptResult, showing the explicit conversion between identical state spaces."

## Change Scope

- `src/domain/result.ts`
- `src/app/execute-retry/await-attempt-outcome.ts`
- `src/app/execute-retry/execute-attempt.ts`
