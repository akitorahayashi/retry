---
label: "tests"
---

## Goal

Add explicit unit tests to cover crucial boundary, validation, and error-handling conditions in the execution engine to safeguard against regression risks and ensure the system behaves safely instead of silently failing or causing obscure state problems.

## Current State

Critical paths in error handling and specific fallback behaviors are missing test coverage.
- `src/app/execute-retry/execute-attempt.ts`: Currently throws an error when an attempt succeeds but the `exitCode` is null. This safety invariant is entirely uncovered by tests.
- `src/app/execute-retry/await-attempt-outcome.ts`: Currently throws an error when a process unexpectedly times out despite `timeoutSeconds` being undefined. This safety invariant is uncovered.
- `src/app/execute-retry/index.ts`: Currently validates that `maxAttempts` is a positive integer and throws an error if it is not. It also throws an error if the execution loop finishes without producing a `finalAttempt`. Both these boundary conditions lack test coverage.
- `tests/app/await-attempt-outcome.test.ts`: Missing tests for the undefined timeout scenario resulting in an unexpected timeout.
- `tests/app/execute-retry.test.ts`: Missing tests for invalid `maxAttempts` validation and missing `finalAttempt`.

## Plan

1. Create test for invalid maxAttempts in execute-retry.test.ts
   Add tests to assert that `executeRetry` throws an error when `maxAttempts` is zero, negative, or a non-integer, covering the initial input validation.
2. Create test for missing finalAttempt in execute-retry.test.ts
   Add a test that verifies `executeRetry` throws the expected error if the execution loop fails to produce a `finalAttempt` result, ensuring this safety net is covered.
3. Create test for successful attempt with null exit code
   Create `tests/app/execute-attempt.test.ts` with a unit test for `executeAttempt`. Configure the mocks so that the underlying execution returns a success outcome with a null exit code, verifying that the expected exception is thrown.
4. Create test for unexpected timeout without defined limits
   Add a test in `tests/app/await-attempt-outcome.test.ts` calling `awaitAttemptOutcome` with an undefined timeout limit but simulating an impossible timeout completion from the running command, verifying that the unexpected timeout exception is thrown.

## Acceptance Criteria

- A test covering `execute-attempt.ts` successfully asserts an error when an attempt outcome is success but `exitCode` is null.
- A test covering `await-attempt-outcome.ts` successfully asserts an error for unexpected timeouts when timeout limits are undefined.
- Tests covering `execute-retry.ts` successfully assert validation errors for invalid `maxAttempts` and the missing final attempt check.

## Risks

- The missing `finalAttempt` check and the unexpected timeout checks guard against theoretically unreachable states based on current type definitions. Trying to test them might require unnatural mocking of internal promises or typing bypasses that make the tests fragile.
- Testing the `executeAttempt` function in isolation requires carefully mocking `awaitAttemptOutcome` and process termination handlers, which might tightly couple the test to the implementation details.
