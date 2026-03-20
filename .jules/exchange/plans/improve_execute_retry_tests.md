---
label: "tests"
---

## Goal

Add missing unit tests to cover signal handlers (`SIGTERM`, `SIGINT`) and process cancellation semantics in `executeRetry` to prevent orphaned processes and hung runners.

## Current State

The current test suite for `executeRetry` focuses primarily on iteration logic, policy evaluation, and scheduling delays, but ignores the system-level interactions such as process cancellation via signals or timeouts.
- `src/app/execute-retry.ts`: Signal handlers (`onSigterm`, `onSigint`) and timeout termination logic are executed within `runAttempt`, but these code paths lack test coverage. They are critical for preventing orphaned processes.
- `tests/app/execute-retry.test.ts`: Focuses purely on iteration logic, policy evaluation, and scheduling delays, relying on mocked process completion. There are no tests to simulate signal events (`SIGTERM`, `SIGINT`) or a command execution exceeding `timeoutSeconds`.

## Plan

1. Update `tests/app/execute-retry.test.ts` to test process timeouts.
   - Use mock timers (`vi.useFakeTimers()`) to simulate a command exceeding `timeoutSeconds`.
   - Verify that `terminateProcessTree` is called with the correct PID and `terminationGraceSeconds`.
   - Verify that the attempt result evaluates to a `timeout` outcome.
2. Update `tests/app/execute-retry.test.ts` to test process interruption via signals (`SIGTERM` and `SIGINT`).
   - Mock or intercept `process.once` and `process.off` to capture the signal handlers without registering them on the actual Node.js process (which could crash the test runner).
   - Simulate a `SIGTERM` and a `SIGINT` by invoking the captured handler while a mocked command is "running".
   - Verify that `terminateProcessTree` is called for the child PID when the runner receives either signal.
3. Verify that the event listeners on `process` are properly cleaned up (`process.off` is called) after the attempt completes, regardless of the outcome.

## Acceptance Criteria

- `tests/app/execute-retry.test.ts` has specific cases for both `SIGTERM` and `SIGINT` interruption.
- `tests/app/execute-retry.test.ts` has a specific case for timeout interruption when the duration exceeds `timeoutSeconds`.
- Tests assert `terminateProcessTree` is called for the child PID with the correct grace period when the runner receives a signal or times out.
- The state of execution is evaluated appropriately as a `timeout` outcome when `timeoutSeconds` is exceeded.
- The test runner does not exit or crash when simulating signal events.
- Test coverage for `src/app/execute-retry.ts` covers the signal handler and timeout logic blocks.

## Risks

- Vitest runner might crash or exit if actual signals are emitted or not intercepted properly. Mocking `process.once`/`process.off` mitigates this.
- Tests may become flaky if they rely on actual wall-clock time instead of mocked timers for the timeout tests.
- Mocking the asynchronous execution of `runCommand` requires precise timing to ensure the command is in an `isRunning() === true` state when the timeout or signal occurs, otherwise the termination logic will be skipped.
