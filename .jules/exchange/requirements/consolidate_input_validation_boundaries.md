---
label: "refacts"
implementation_ready: false
---

## Goal

Consolidate parameter input validation at the transport/entrypoint layer (`readInputs`) ensuring invalid inputs fail fast, and remove redundant runtime panic checks for `maxAttempts` in the core application logic to establish a trusted boundary. Add explicit test coverage for these validations.

## Problem

`maxAttempts` is redundantly validated in both `readInputs` and `executeRetry`, blurring the boundary of where invariants are enforced. Additionally, critical configuration validation error paths, specifically parsing non-integers or explicit false values (`'off'/'no'/'0'`) for booleans, lack test coverage.

## Evidence

- source_event: "redundant_validation_max_attempts_data_arch.md"
  path: "src/action/read-inputs.ts"
  loc: "readInputs (line 20)"
  note: "Validates `maxAttempts` with a minimum of 1."

- source_event: "redundant_validation_max_attempts_data_arch.md"
  path: "src/app/execute-retry/index.ts"
  loc: "executeRetry (line 29)"
  note: "Defensively checks `!Number.isInteger(request.maxAttempts) || request.maxAttempts <= 0`."

- source_event: "test_input_validation_gaps_cov.md"
  path: "src/action/read-inputs.ts"
  loc: "78-79, 108"
  note: "Branch handling string regex match failure for parseInt wrapper, and explicit false-value normalization parsing are uncovered."

## Change Scope

- `src/app/execute-retry/index.ts`
- `src/action/read-inputs.ts`
- `tests/action/read-inputs.test.ts`

## Constraints

- Input validation occurs exactly once at the system boundary (transport/entrypoint).
- Core domain functions (`executeRetry`) trust inputs provided by boundary validations.

## Acceptance Criteria

- The redundant `maxAttempts` validation check in `src/app/execute-retry/index.ts` is removed.
- Tests are added in `tests/action/read-inputs.test.ts` to assert that invalid inputs (e.g., non-integers) correctly fail and log errors.
- Tests verify correct boolean fallback normalization (e.g. `'off'`, `'no'`, `'0'`).
