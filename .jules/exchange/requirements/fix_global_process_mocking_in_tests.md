---
label: "tests"
implementation_ready: true
---

## Goal

Ensure all global environment mocks (like `process` methods) are properly isolated per test by restoring all mocks in `afterEach` or avoiding global mutation if possible.

## Problem

`tests/app/execute-retry.test.ts` mutates global `process` methods (`process.exit`, `process.once`, `process.off`) in a specific test without restoring them afterward in an `afterEach` hook or within the test itself, causing diagnosability issues via shared global state leakage.

## Context

Mutating globals inside a specific `it` block and failing to restore them can lead to other seemingly unrelated tests failing because they inadvertently run against a mocked version of `process.exit` or event handlers. This shared mutable state destroys failure diagnosability because if a test fails due to leaked state, the cause is an entirely different file or test, frustrating developers and obscuring the real failure point. The test suite is currently missing an `afterEach` block containing `vi.restoreAllMocks()` or specific un-mocking steps for process globals.

## Evidence

For multi-file events, add multiple list items.

- source_event: "global_process_mocking_and_diagnosability_qa.md"
  path: "tests/app/execute-retry.test.ts"
  loc: "line 84-89"
  note: "Mocks `process.once`, `process.off`, and `process.exit` without cleaning them up."
- source_event: "global_process_mocking_and_diagnosability_qa.md"
  path: "tests/app/execute-retry.test.ts"
  loc: "line 78"
  note: "Test block 'interrupts running command and terminates process tree on $signal' contains global mutations."
- source_event: "global_process_mocking_and_diagnosability_qa.md"
  path: "tests/app/execute-retry.test.ts"
  loc: "line 36"
  note: "The `describe('executeRetry')` block lacks an `afterEach(() => vi.restoreAllMocks())` hook."

## Change Scope

- `tests/app/execute-retry.test.ts`

## Constraints

- Changes must be isolated to the identified scope.
- Preserve existing functionality.

## Acceptance Criteria

- Tests pass and coverage is maintained or improved.
- Addressed all concerns identified in the problem statement.
