---
label: "tests"
---

## Goal

Ensure all timing-dependent tests use mocked timers (`vi.useFakeTimers()`) and deterministic state checks rather than relying on real-time execution limits or complex promise orchestration.

## Current State

Currently, timing tests rely on intricate webs of manual promise resolution (e.g., `initialTimeoutPromise`, `terminationDelayPromise`) which tightly couples tests to implementation internals and makes test failures hard to diagnose.
- `tests/app/await-attempt-outcome.test.ts`: Test `terminates process tree when timeout is reached` constructs an intricate web of promises to control event order. This tight coupling makes the test brittle and hard to read.
- `tests/app/execute-retry.test.ts`: Test `returns timeout and terminates process tree when timeout wins` similarly relies on mock implementations resolving deferred promises (`completionPromise`, `runCommand`) to mimic timing behavior.

## Plan

1. In `tests/app/await-attempt-outcome.test.ts`, replace the manual promise structures (`initialTimeoutPromise`, `terminationDelayPromise`, `terminateProcessTreePromise`, `delayPromise`) used for timing control with `vi.useFakeTimers()`. Use `vi.advanceTimersByTimeAsync()` to deterministically move time forward and assert on externally observable outcomes like whether `dependencies.terminateProcessTree` or `cancel` functions were called.
2. In `tests/app/execute-retry.test.ts`, replace mock implementations that resolve deferred promises for timing (like `completionPromise` in the timeout tests) with mocked timers via `vi.useFakeTimers()`. Fast-forward time to trigger timeouts and verify outcomes.

## Acceptance Criteria

- Complex manual promise resolution webs for timing tests are completely removed.
- Tests in `tests/app/await-attempt-outcome.test.ts` and `tests/app/execute-retry.test.ts` utilize `vi.useFakeTimers()` to simulate time progression.
- Tests reliably pass under varied machine execution speeds.
- No assertions are removed; the method of triggering state changes over time is simply simplified.

## Risks

- Mocking timers might interfere with other async operations in tests if `vi.useFakeTimers()` is not scoped correctly or cleaned up (`vi.useRealTimers()`).
- Using `vi.advanceTimersByTimeAsync()` requires ensuring the event loop can clear pending microtasks correctly to simulate real execution flow.
