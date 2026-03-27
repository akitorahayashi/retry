---
label: "refacts"
implementation_ready: false
---

## Goal

Unify the representations of execution outcomes into a single domain concept, eliminating overlapping terminology (`AttemptOutcome`, `AttemptResult`, `ExecutionResult`).

## Problem

The concept of an execution's result or outcome is represented by multiple overlapping and redundant terms across layers: `AttemptOutcome` (domain), `AttemptResult` (domain), and `ExecutionResult` (app). `ExecutionResult` mirrors `AttemptResult` without the attempt number, creating an unnecessary boundary conversion where the application module repackages identical concepts to the domain model without adding meaningful separation. This makes discussing "the result of running the command" confusing and violates the Single Source of Truth principle.

## Evidence

- source_event: "duplicate_result_models_data_arch.md"
  path: "src/domain/result.ts"
  loc: "1-18"
  note: "Defines AttemptResult with outcome, exitCode, stdout, and attempt number."

- source_event: "duplicate_result_models_data_arch.md"
  path: "src/app/execute-retry/await-attempt-outcome.ts"
  loc: "14-17"
  note: "Defines ExecutionResult which mirrors AttemptResult sans the attempt number, leading to trivial mappings."

- source_event: "duplicate_result_models_data_arch.md"
  path: "src/app/execute-retry/execute-attempt.ts"
  loc: "34-72"
  note: "Maps ExecutionResult back to AttemptResult, showing the explicit conversion between identical state spaces."

- source_event: "attempt_result_taxonomy.md"
  path: "src/domain/policy.ts"
  loc: "line 1"
  note: "Defines `AttemptOutcome` as a string literal union."

## Change Scope

- `src/domain/policy.ts`
- `src/domain/result.ts`
- `src/app/execute-retry/await-attempt-outcome.ts`
- `src/app/execute-retry/execute-attempt.ts`

## Constraints

- The new unified outcome representation must maintain type safety for execution states (success, error, timeout).

## Acceptance Criteria

- `AttemptOutcome`, `AttemptResult`, and `ExecutionResult` are unified or clearly delineated into a consistent domain concept.
- Unnecessary mapping from `ExecutionResult` to `AttemptResult` is eliminated.
- Terminology for command execution outcomes is consistent across all layers.
