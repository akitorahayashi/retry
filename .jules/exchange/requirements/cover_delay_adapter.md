---
label: "tests"
implementation_ready: true
---

## Goal

Ensure the `delay` adapter correctly implements the Promise and cancellation logic, specifically verifying that the cancellation clears the timeout.

## Problem

The `src/adapters/delay.ts` file has extremely low coverage (10% statements/lines, 0% functions). The coverage summary shows `src/adapters/delay.ts` with 10% coverage, indicating the actual function `delay` and its cancellation logic are not directly tested. This is a crucial adapter for the retry logic (`retryDelaySeconds`), and its failure to delay properly or cancel could lead to unexpected behavior during retries or test environment leaks (e.g. unhandled timers).

## Evidence

- source_event: "untested_delay_adapter_cov.md"
  path: "coverage/coverage-summary.json"
  loc: ""/app/src/adapters/delay.ts""
  note: "Shows lines/statements at 10% and functions at 0% for delay.ts."

- source_event: "untested_delay_adapter_cov.md"
  path: "src/adapters/delay.ts"
  loc: "line 1-14"
  note: "The function implementation and `cancel` callback are completely uncovered in unit tests."

## Change Scope

- `src/adapters/delay.ts`
- `tests/adapters/delay.test.ts`

## Constraints

- Test files must mock timers rather than waiting in real time for delays.

## Acceptance Criteria

- Code coverage for `src/adapters/delay.ts` is 100%.
- A new test asserts that cancelling the delay effectively prevents execution of deferred callbacks.
