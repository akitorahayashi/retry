---
label: "tests"
---

## Goal

Provide full branch coverage for error handling and timeout edge cases in process termination paths.

## Current State

Timeout-induced termination failure paths and edge case completions in `await-attempt-outcome.ts` lack test coverage. The branch logic handling `terminateProcessTree` errors and delayed final completions are currently untested. Signal termination handlers (`SIGTERM` and `SIGINT`) have uncovered catch blocks in `terminate-command-on-signal.ts`. The error handling when terminating a process tree or when a handler throws an error is not tested, masking potential failure modes.

- `src/app/execute-retry/await-attempt-outcome.ts`: The `awaitAttemptOutcome` function catches and logs errors when `terminateProcessTree` fails (lines 48-52), falls back to a 5-second timeout if the process still does not exit (lines 64-68), and ensures timeout promises are cancelled (lines 82-89). Currently, these error and edge-case behaviors are not explicitly verified by unit tests, leaving them at 0% coverage and vulnerable to silent regressions.
- `src/app/execute-retry/terminate-command-on-signal.ts`: The `registerCommandTerminationOnSignal` function listens for `SIGTERM` and `SIGINT`. It has catch blocks to log errors when `terminateProcessTree` fails (line 31) and when the asynchronous signal handler `onSignal` throws an unexpected error (lines 40-42, 52-54). These paths are not tested, resulting in 77.77% branch coverage and an unverified safety net for process cleanup.
- `tests/app/await-attempt-outcome.test.ts`: Currently missing. Needs to be created to own the test behavior of `await-attempt-outcome.ts`.
- `tests/app/terminate-command-on-signal.test.ts`: Currently missing. Needs to be created to own the test behavior of `terminate-command-on-signal.ts`.

## Plan

1. Create `tests/app/await-attempt-outcome.test.ts` to test `awaitAttemptOutcome`.
   - Setup: Create basic unit tests covering standard completions (success and error) and basic timeouts to establish baseline coverage.
   - Behavior: Add a test verifying that when `dependencies.terminateProcessTree` rejects (fails), the error is caught, logged, and the function still waits for final completion.
   - Behavior: Add a test verifying that if the process fails to complete after termination (simulated by the secondary 5000ms delay resolving before completion), the function returns a safe `{ outcome: 'timeout', exitCode: null }` result.
   - Mechanism: Ensure these tests assert against the returned `AttemptExecutionOutcome` to verify externally observable behavior.
2. Create `tests/app/terminate-command-on-signal.test.ts` to test `registerCommandTerminationOnSignal`.
   - Setup: Mock `process.once`, `process.off`, and `process.exit` globally. Ensure `afterEach` restores these mocks to prevent global state leakage.
   - Behavior: Add tests confirming that `SIGTERM` and `SIGINT` trigger `params.terminateProcessTree`, and successfully exit with code 0.
   - Behavior: Add a test verifying that when `params.terminateProcessTree` rejects, the error is caught and logged, preventing unhandled promise rejections, and exits with code 0.
   - Behavior: Add a test simulating a synchronous error or an error not caught by the inner block, verifying the outer catch block logs the error and exits with code 1.
3. Verify test coverage and file state.
   - Run `npx vitest run --coverage src/app/execute-retry/await-attempt-outcome.ts src/app/execute-retry/terminate-command-on-signal.ts` to confirm 100% line and branch coverage for the targeted files.
   - Ensure the tests execute without hanging or leaking mocked global state.
4. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
5. Remove the requirement file `.jules/exchange/requirements/improve_termination_error_handling_coverage.md`.

## Acceptance Criteria

- `awaitAttemptOutcome` has tests for `terminateProcessTree` failure and secondary fallback timeout.
- `registerCommandTerminationOnSignal` has tests for signal handling, `terminateProcessTree` failure, and handler crash fallback.
- Test coverage for `src/app/execute-retry/await-attempt-outcome.ts` and `src/app/execute-retry/terminate-command-on-signal.ts` reaches 100%.
- Process signal mocks are properly restored after each test to prevent global state leakage.
- The processed requirement file is deleted.

## Risks

- Mocking `process.once` and `process.exit` can lead to test runner crashes or flaky tests if not meticulously restored in `afterEach`.
- Mixing mocked timers with native promises could introduce race conditions in testing the `Promise.race` logic in `awaitAttemptOutcome`. We will rely on explicit Promise resolutions instead of fake timers where possible.
