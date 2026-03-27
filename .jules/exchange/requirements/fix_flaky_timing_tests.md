---
label: "tests"
implementation_ready: false
---

## Goal

Ensure all timing-dependent tests use mocked timers or clear deterministic state checks rather than relying on real-time execution limits. Replace ambiguous timing structures with deterministic promises.

## Problem

Some timing-related tests rely on actual time progression or external assumptions, potentially causing flakiness, although `vi.useFakeTimers()` is used in some places. Tests in `tests/app/await-attempt-outcome.test.ts` manipulate complex Promise structures (`initialTimeoutPromise`, `terminationDelayPromise`, `terminateProcessTreePromise`, `delayPromise`) to simulate timing and event progression. While deterministic in a sense, this complex orchestration makes failures hard to diagnose and the logic brittle to refactoring.

## Evidence

- source_event: "flaky_timing_tests_qa.md"
  path: "tests/app/await-attempt-outcome.test.ts"
  loc: "123-228"
  note: "Test `terminates process tree when timeout is reached` constructs an intricate web of promises (`initialTimeoutPromise`, `terminationDelayPromise`, `terminateProcessTreePromise`) to control event order. This tight coupling to the promise structure makes it brittle and hard to read."

- source_event: "flaky_timing_tests_qa.md"
  path: "tests/app/execute-retry.test.ts"
  loc: "61-105"
  note: "Test `returns timeout and terminates process tree when timeout wins` similarly relies on mock implementations resolving deferred promises (`completionPromise`, `runCommand`)."

## Change Scope

- `tests/app/await-attempt-outcome.test.ts`
- `tests/app/execute-retry.test.ts`

## Constraints

- Refactored tests should ensure predictable behavior under varied machine execution speeds.
- Do not remove assertions; simplify the method used to trigger state changes over time.

## Acceptance Criteria

- Complex, manual promise resolution webs for timing tests are replaced with mocked timers (`vi.useFakeTimers()`).
- Flaky timing behaviors in `await-attempt-outcome.test.ts` and `execute-retry.test.ts` are eliminated.
