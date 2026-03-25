---
label: "refacts"
---

## Goal

Consolidate parameter input validation at the transport/entrypoint layer (`readInputs`) ensuring invalid inputs fail fast, and remove redundant runtime panic checks for `maxAttempts` in the core application logic to establish a trusted boundary. Add explicit test coverage for these validations.

## Current State

- `src/action/read-inputs.ts`: Validates `maxAttempts` with a minimum of 1, but lacks test coverage for branch handling string regex match failure for parseInt wrapper, and explicit false-value normalization parsing (e.g. `'off'`, `'no'`, `'0'`).
- `src/app/execute-retry/index.ts`: Defensively checks `!Number.isInteger(request.maxAttempts) || request.maxAttempts <= 0` in `executeRetry`. This redundant check blurs the boundary of where invariants are enforced.
- `tests/action/read-inputs.test.ts`: Missing test coverage for invalid inputs (e.g., non-integers) correctly failing and logging errors, and missing tests for correct boolean fallback normalization.

## Plan

1. Remove the redundant validation block `if (!Number.isInteger(request.maxAttempts) || request.maxAttempts <= 0) { throw new Error(...) }` from `executeRetry` in `src/app/execute-retry/index.ts`.
2. Update tests in `tests/action/read-inputs.test.ts` to assert that invalid inputs like non-integers are caught and throw the appropriate errors from `readInputs`.
3. Update tests in `tests/action/read-inputs.test.ts` to explicitly test boolean fallback normalization (e.g., passing `'off'`, `'no'`, `'0'` evaluates to `false`).
4. Update tests in `tests/app/execute-retry.test.ts` to remove any tests assuming `executeRetry` throws on invalid `maxAttempts` input, as we are shifting the trust boundary.

## Acceptance Criteria

- The redundant `maxAttempts` validation check in `src/app/execute-retry/index.ts` is removed.
- Tests are added in `tests/action/read-inputs.test.ts` to assert that invalid inputs (e.g., non-integers) correctly fail and log errors.
- Tests verify correct boolean fallback normalization (e.g. `'off'`, `'no'`, `'0'`).

## Risks

- Core functions in `src/app/execute-retry` may crash unexpectedly if called directly with invalid `maxAttempts` bypassing `readInputs`. However, this is mitigated because `executeRetry` is designed to trust inputs provided by boundary validations in the system design.
- The `tests/action/read-inputs.test.ts` additions could incorrectly assert boolean normalization behavior leading to incorrect pipeline evaluations. This is mitigated by accurately verifying against the existing `readBooleanFlag` implementation.
