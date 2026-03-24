---
label: "refacts"
implementation_ready: false
---

## Goal

Create a strict boundary between transport logic (reading inputs) and domain execution by explicitly converting inputs into nested domain models (`CommandExecution`, `RetryPolicy`, `RetrySchedule`), making `executeRetry` accept domain models rather than flat parameters.

## Problem

`ExecuteRetryParams` is structurally equivalent to a combination of `CommandExecution`, `RetryPolicy`, and `RetrySchedule`, but instead of composing them or constructing domain models at the boundary, the application logic directly expects a flattened parameter object that mirrors the transport DTO (`RetryRequest`).

## Context

The first principle of data architecture is single source of truth and boundary sovereignty. Currently, `src/app/execute-retry/index.ts` accepts `ExecuteRetryParams` which is a flattened object containing command config, retry policy config, and retry schedule config. Inside `executeRetry`, it immediately reassembles these flat properties into `RetryPolicy` and `RetrySchedule` objects before use. It passes the flattened object down to `executeAttempt`, which implicitly satisfies the `CommandExecution` interface because it has `command`, `shell`, and `terminationGraceSeconds` properties.

This is structural typing leading to implicit boundary overlap. The inputs should be converted into the proper domain representations as soon as they are read from the GitHub Actions environment, and `executeRetry` should take the domain models instead of rebuilding them.

## Evidence

- source_event: "implicit_structural_typing_data_arch.md"
  path: "src/app/execute-retry/index.ts"
  loc: "17-27"
  note: "`ExecuteRetryParams` duplicates properties from domain models instead of composing them."
- source_event: "implicit_structural_typing_data_arch.md"
  path: "src/app/execute-retry/index.ts"
  loc: "37-45"
  note: "`executeRetry` manually reassembles the `RetryPolicy` and `RetrySchedule` from the flat params."
- source_event: "implicit_structural_typing_data_arch.md"
  path: "src/app/execute-retry/index.ts"
  loc: "52"
  note: "`executeAttempt(params, attempt, dependencies)` implicitly relies on `ExecuteRetryParams` being structurally compatible with `CommandExecution`."
- source_event: "implicit_structural_typing_data_arch.md"
  path: "src/app/execute-retry/execute-attempt.ts"
  loc: "16-20"
  note: "`executeAttempt` signature takes `CommandExecution`, meaning the caller (`executeRetry`) passed its flattened params object which implicitly matched the shape."

## Change Scope

- `src/app/execute-retry/index.ts`
- `src/index.ts`

## Constraints

- Changes must be isolated to the identified scope.
- Preserve existing functionality.

## Acceptance Criteria

- Tests pass and coverage is maintained or improved.
- Addressed all concerns identified in the problem statement.
