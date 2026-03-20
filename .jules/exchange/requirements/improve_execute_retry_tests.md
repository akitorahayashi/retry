---
label: "tests"
implementation_ready: false
---

## Goal

Add missing tests to cover signal handlers (`SIGTERM`, `SIGINT`) and process cancellation semantics in `executeRetry`.

## Problem

Signal handlers and timeouts in `executeRetry` are completely uncovered by tests, representing a major risk for orphaned processes, hung runners, and zombie build steps if termination logic fails silently.

## Evidence

- source_event: "uncovered_signal_handlers_execute_retry_cov.md"
  path: "src/app/execute-retry.ts"
  loc: "105-162"
  note: "Signal handlers (`onSigterm`, `onSigint`) and timeout termination logic are executed but there are no tests asserting they correctly clean up the process tree or result in the proper outcome."
- source_event: "uncovered_signal_handlers_execute_retry_cov.md"
  path: "tests/app/execute-retry.test.ts"
  loc: "1-102"
  note: "Tests focus purely on iteration logic, policy evaluation, and scheduling delays, relying on mocked process completion. There are no tests to simulate signal events or a command exceeding `timeoutSeconds`."

## Change Scope

- `src/app/execute-retry.ts`
- `tests/app/execute-retry.test.ts`

## Constraints

- Dependencies like `process.on` must be mockable or intercepted within the test suite so the test runner doesn't exit when testing signals.
- Tests must assert that the child process tree is correctly terminated when signals are emitted.

## Acceptance Criteria

- `tests/app/execute-retry.test.ts` has specific cases for both `SIGTERM` and `SIGINT` interruption.
- Tests assert `terminateProcessTree` is called for the child PID when the runner receives a signal.
- The state of execution returns appropriately to `executeRetry` after signal interruption.
